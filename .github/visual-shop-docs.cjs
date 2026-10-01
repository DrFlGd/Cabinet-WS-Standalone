const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const outputDir = path.resolve(process.argv[2] || 'visual-artifacts');
const mode = process.argv[3] || 'after';
fs.mkdirSync(outputDir, { recursive: true });

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(win, expression, label, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const ready = await win.webContents.executeJavaScript(`Boolean(${expression})`, true);
      if (ready) return;
    } catch {}
    await delay(150);
  }
  throw new Error('Timed out waiting for ' + label);
}

async function clickByText(win, selector, text) {
  const clicked = await win.webContents.executeJavaScript(`(() => {
    const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find(candidate => candidate.textContent?.trim().includes(${JSON.stringify(text)}));
    if (!element) return false;
    element.click();
    return true;
  })()`, true);
  if (!clicked) throw new Error('Could not find ' + text + ' in ' + selector);
}

async function openProduction(width, height) {
  const win = new BrowserWindow({
    width,
    height,
    show: false,
    backgroundColor: '#171a1d',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });
  await win.loadFile(path.join(process.cwd(), 'dist', 'index.html'));
  await waitFor(win, `[...document.querySelectorAll('button')].some(button => button.textContent?.includes('Shop Docs'))`, 'Shop Docs button');
  await clickByText(win, 'button', 'Shop Docs');
  await waitFor(win, `document.querySelector('.shop-docs-dialog')`, 'Shop Docs dialog');
  await clickByText(win, '.shop-docs-tabs button', 'Production');
  await waitFor(win, `document.querySelector('.production-planning-view')`, 'Production planning panel');
  await delay(750);
  return win;
}

async function capture(win, name) {
  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, name + '.png'), image.toPNG());
}

async function selectSecondStock(win) {
  await waitFor(win, `document.querySelectorAll('.production-stock-identity').length >= 2`, 'multiple stock rows');
  const result = await win.webContents.executeJavaScript(`(() => {
    const buttons = [...document.querySelectorAll('.production-stock-identity')];
    const target = buttons[1];
    const material = target.querySelector('strong')?.textContent?.trim() || '';
    target.click();
    return material;
  })()`, true);
  await waitFor(win, `document.querySelectorAll('.production-stock-identity')[1]?.getAttribute('aria-pressed') === 'true'`, 'second stock selection');
  await delay(250);
  return result;
}

async function afterValidation(win, expectedMaterial) {
  const result = await win.webContents.executeJavaScript(`(() => {
    const selectedButton = document.querySelector('.production-stock-identity[aria-pressed="true"]');
    const selectedMaterial = selectedButton?.querySelector('strong')?.textContent?.trim() || '';
    const stockSelect = document.querySelector('[aria-label="Production stock material"] .select-control-value')?.textContent?.trim()
      || document.querySelector('[aria-label="Production stock material"]')?.textContent?.trim()
      || '';
    const sheetSelect = document.querySelector('[aria-label="Nested sheet for selected stock"] .select-control-value')?.textContent?.trim()
      || document.querySelector('[aria-label="Nested sheet for selected stock"]')?.textContent?.trim()
      || '';
    const previewMaterial = document.querySelector('.production-sheet-preview header span')?.textContent?.trim() || '';
    const summaryMaterial = document.querySelector('.production-selected-stock-summary header strong')?.textContent?.trim() || '';
    const placementCount = document.querySelectorAll('.production-placement-list button').length;
    const rowCount = document.querySelectorAll('.production-stock-identity').length;
    return { selectedMaterial, stockSelect, sheetSelect, previewMaterial, summaryMaterial, placementCount, rowCount };
  })()`, true);

  if (result.rowCount < 2) throw new Error('Expected at least two stock/material rows.');
  if (result.selectedMaterial !== expectedMaterial) throw new Error('Selected stock row did not remain active.');
  if (result.summaryMaterial !== expectedMaterial) throw new Error('Selected-stock summary does not match stock row.');
  if (!result.stockSelect.includes(expectedMaterial)) throw new Error('Stock selector label does not match selected stock.');
  if (!result.previewMaterial.includes(expectedMaterial)) throw new Error('Visible sheet preview does not match selected stock.');
  if (!result.sheetSelect) throw new Error('Selected stock did not expose a sheet.');
  if (result.placementCount < 1) throw new Error('Selected stock sheet has no visible placements.');
  return result;
}

app.whenReady().then(async () => {
  try {
    if (mode === 'before') {
      const wide = await openProduction(1440, 1000);
      await capture(wide, 'before-wide');
      wide.destroy();

      const narrow = await openProduction(760, 900);
      await capture(narrow, 'before-narrow');
      narrow.destroy();
      console.log('VISUAL_VALIDATION ' + JSON.stringify({ mode, captured: ['before-wide', 'before-narrow'] }));
    } else {
      const wide = await openProduction(1440, 1000);
      await capture(wide, 'after-wide-stock-1');
      const secondMaterial = await selectSecondStock(wide);
      const validation = await afterValidation(wide, secondMaterial);
      await capture(wide, 'after-wide-stock-2');
      wide.destroy();

      const narrow = await openProduction(760, 900);
      const narrowMaterial = await selectSecondStock(narrow);
      const narrowValidation = await afterValidation(narrow, narrowMaterial);
      await capture(narrow, 'after-narrow-stock-2');
      narrow.destroy();

      console.log('VISUAL_VALIDATION ' + JSON.stringify({
        mode,
        secondMaterial,
        validation,
        narrowValidation,
        captured: ['after-wide-stock-1', 'after-wide-stock-2', 'after-narrow-stock-2'],
      }));
    }
    app.quit();
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
