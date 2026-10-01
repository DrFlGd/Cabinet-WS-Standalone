const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const outputArg = process.argv.at(-2) || 'visual-artifacts';
const mode = process.argv.at(-1) || 'after';
const outputDir = path.resolve(outputArg);
fs.mkdirSync(outputDir, { recursive: true });

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('use-angle', 'swiftshader');
app.on('window-all-closed', event => event.preventDefault());

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

async function downloadByButton(win, buttonText, fileName) {
  const targetPath = path.join(outputDir, fileName);
  return new Promise(async (resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Timed out downloading ' + fileName));
    }, 10000);
    win.webContents.session.once('will-download', (_event, item) => {
      item.setSavePath(targetPath);
      item.once('done', (_downloadEvent, state) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (state === 'completed') resolve(targetPath);
        else reject(new Error(fileName + ' download ended with state ' + state));
      });
    });
    try {
      await clickByText(win, '.shop-docs-actions button', buttonText);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

async function captureHtmlDocument(filePath, name) {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    show: true,
    backgroundColor: '#ffffff',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  await win.loadFile(filePath);
  await delay(500);
  const typography = await win.webContents.executeJavaScript(`(() => {
    const body = getComputedStyle(document.body);
    const table = document.querySelector('table');
    const tableStyle = table ? getComputedStyle(table) : null;
    return { bodyFontSize: body.fontSize, bodyLineHeight: body.lineHeight, tableFontSize: tableStyle?.fontSize || '' };
  })()`, true);
  await capture(win, name);
  win.destroy();
  return typography;
}

async function openProduction(width, height) {
  const win = new BrowserWindow({
    width,
    height,
    show: true,
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
  win.show();
  win.focus();
  await delay(300);
  const image = await Promise.race([
    win.webContents.capturePage(),
    new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Timed out capturing ' + name)), 10000)),
  ]);
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
  await delay(900);
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
  const hardTimeout = setTimeout(() => {
    console.error('VISUAL_VALIDATION hard timeout');
    app.exit(2);
  }, 90000);
  try {
    console.log('VISUAL_VALIDATION app ready', { mode, cwd: process.cwd(), outputDir });
    if (mode === 'before') {
      console.log('VISUAL_VALIDATION opening baseline wide');
      const wide = await openProduction(1440, 1000);
      console.log('VISUAL_VALIDATION capturing baseline wide');
      await capture(wide, 'before-wide');
      wide.destroy();

      console.log('VISUAL_VALIDATION opening baseline narrow');
      const narrow = await openProduction(760, 900);
      console.log('VISUAL_VALIDATION capturing baseline narrow');
      await capture(narrow, 'before-narrow');
      narrow.destroy();
      console.log('VISUAL_VALIDATION ' + JSON.stringify({ mode, captured: ['before-wide', 'before-narrow'] }));
    } else {
      console.log('VISUAL_VALIDATION opening updated wide');
      const wide = await openProduction(1440, 1000);
      console.log('VISUAL_VALIDATION capturing updated stock 1');
      await capture(wide, 'after-wide-stock-1');
      const secondMaterial = await selectSecondStock(wide);
      console.log('VISUAL_VALIDATION selected second stock', secondMaterial);
      const validation = await afterValidation(wide, secondMaterial);
      await capture(wide, 'after-wide-stock-2');
      await wide.webContents.executeJavaScript(`document.querySelector('.production-sheet-toolbar')?.scrollIntoView({ block: 'start' })`, true);
      await delay(500);
      await capture(wide, 'after-wide-stock-2-review');

      await clickByText(wide, '.shop-docs-tabs button', 'BOM / Cut List');
      await waitFor(wide, `document.querySelector('.bom-view')`, 'BOM view');
      const cutListPath = await downloadByButton(wide, 'Printable report', 'visual-bom-cut-list.html');
      await clickByText(wide, '.shop-docs-tabs button', 'Assembly');
      await waitFor(wide, `document.querySelector('.assembly-view')`, 'Assembly view');
      const assemblyPath = await downloadByButton(wide, 'Printable assembly packet', 'visual-assembly-packet.html');
      const cutListTypography = await captureHtmlDocument(cutListPath, 'after-printable-bom');
      const assemblyTypography = await captureHtmlDocument(assemblyPath, 'after-printable-assembly');
      wide.destroy();

      console.log('VISUAL_VALIDATION printable typography', { cutListTypography, assemblyTypography });
      console.log('VISUAL_VALIDATION opening updated narrow');
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
        cutListTypography,
        assemblyTypography,
        captured: ['after-wide-stock-1', 'after-wide-stock-2', 'after-wide-stock-2-review', 'after-printable-bom', 'after-printable-assembly', 'after-narrow-stock-2'],
      }));
    }
    clearTimeout(hardTimeout);
    app.quit();
  } catch (error) {
    clearTimeout(hardTimeout);
    console.error(error);
    app.exit(1);
  }
});
