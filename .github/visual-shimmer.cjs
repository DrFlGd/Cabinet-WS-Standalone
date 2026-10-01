const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const outputDir = path.resolve(process.argv[3] || 'shimmer-visual-artifacts');
fs.mkdirSync(outputDir, { recursive: true });

app.commandLine.appendSwitch('use-gl', 'swiftshader');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(win, expression, label, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      if (await win.webContents.executeJavaScript(`Boolean(${expression})`, true)) return;
    } catch {}
    await delay(120);
  }
  throw new Error('Timed out waiting for ' + label);
}

async function chooseSelect(win, ariaLabel, optionText) {
  const opened = await win.webContents.executeJavaScript(`(() => {
    const button = document.querySelector('[aria-label="${ariaLabel.replaceAll('"', '\\"')}"]');
    if (!button) return false;
    button.click();
    return true;
  })()`, true);
  if (!opened) throw new Error('Could not open ' + ariaLabel);
  await waitFor(win, `document.querySelector('.select-control-menu[aria-label="${ariaLabel.replaceAll('"', '\\"')}"]')`, ariaLabel + ' menu');
  const chosen = await win.webContents.executeJavaScript(`(() => {
    const menu = document.querySelector('.select-control-menu[aria-label="${ariaLabel.replaceAll('"', '\\"')}"]');
    const option = [...(menu?.querySelectorAll('[role="option"]') || [])]
      .find(node => node.textContent?.includes(${JSON.stringify(optionText)}));
    if (!option) return false;
    option.click();
    return true;
  })()`, true);
  if (!chosen) throw new Error('Could not choose ' + optionText + ' from ' + ariaLabel);
  await waitFor(
    win,
    `document.querySelector('[aria-label="${ariaLabel.replaceAll('"', '\\"')}"]')?.textContent?.includes(${JSON.stringify(optionText)})`,
    ariaLabel + ' value ' + optionText,
  );
  await waitFor(win, `!document.querySelector('.viewport-status.loading')`, 'kernel idle after ' + optionText, 30000);
  await delay(500);
}

async function capture(win, name) {
  const before = await canvasMetrics(win);
  win.webContents.invalidate();
  await win.webContents.executeJavaScript(
    `new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`,
    true,
  );
  await delay(180);
  const image = await win.webContents.capturePage();
  const after = await canvasMetrics(win);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(name + ' state changed during capture: ' + JSON.stringify({ before, after }));
  }
  fs.writeFileSync(path.join(outputDir, name + '.png'), image.toPNG());
  return after;
}

async function waitForDocumentState(win, familyText, documentName) {
  await waitFor(
    win,
    `document.querySelector('.viewport-footer p')?.textContent?.includes(${JSON.stringify(familyText)})`,
    'footer family ' + familyText,
    30000,
  );
  await waitFor(
    win,
    `document.querySelector('input[aria-label="Document name"]')?.value === ${JSON.stringify(documentName)}`,
    'document name ' + documentName,
    30000,
  );
  await waitFor(win, `!document.querySelector('.viewport-status.loading')`, 'kernel idle for ' + documentName, 30000);
  await delay(700);
}

async function openApp(width, height) {
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
  const visualUrl = process.env.SHIMMER_VISUAL_URL;
  if (visualUrl) await win.loadURL(visualUrl);
  else await win.loadFile(path.join(process.cwd(), 'dist', 'index.html'));
  await waitFor(win, `document.querySelector('.cad-viewport canvas') && document.querySelector('[aria-label="Cabinet family"]')`, 'workspace');
  await delay(1200);
  return win;
}

async function selectPart(win, partId, expectedName) {
  await waitFor(win, `!document.querySelector('.viewport-status.loading')`, 'kernel idle before selection', 30000);
  const opened = await win.webContents.executeJavaScript(`(() => {
    const button = document.querySelector('[aria-label="Open parts browser"]');
    if (!button) return false;
    button.click();
    return true;
  })()`, true);
  if (!opened) throw new Error('Could not open parts browser');

  await waitFor(win, `document.querySelector('.tree-panel.expanded .tree-select[title="${partId}"]')`, partId);
  await win.webContents.executeJavaScript(
    `document.querySelector('.tree-panel.expanded .tree-select[title="${partId}"]')?.click()`,
    true,
  );
  await waitFor(
    win,
    `document.querySelector('.selection-breadcrumb')?.textContent?.includes(${JSON.stringify(expectedName)})`,
    'selection breadcrumb for ' + expectedName,
  );

  const collapsed = await win.webContents.executeJavaScript(`(() => {
    const button = document.querySelector('.tree-panel.expanded [aria-label="Collapse parts browser"]');
    if (!button) return false;
    button.click();
    return true;
  })()`, true);
  if (!collapsed) throw new Error('Could not collapse parts browser');

  await waitFor(
    win,
    `Boolean(document.querySelector('.tree-panel.collapsed [aria-label="Open parts browser"]')) && !document.querySelector('.tree-panel.expanded')`,
    'parts drawer collapsed',
  );
  await waitFor(win, `!document.querySelector('.viewport-status.loading')`, 'kernel idle after selection', 30000);
  await waitFor(
    win,
    `document.querySelector('.selection-breadcrumb')?.textContent?.includes(${JSON.stringify(expectedName)})`,
    'stable selection breadcrumb for ' + expectedName,
  );
  await waitFor(
    win,
    `(document.querySelector('.cad-viewport canvas')?.getBoundingClientRect().width || 0) > 600`,
    'selected viewport width',
  );
  await delay(350);
  await win.webContents.executeJavaScript(`document.querySelector('button[title="Fit model"]')?.click()`, true);
  await delay(900);
}

async function setExplode(win, value) {
  const changed = await win.webContents.executeJavaScript(`(() => {
    const input = document.querySelector('.explode-control input[type="range"]');
    if (!(input instanceof HTMLInputElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, ${JSON.stringify(String(value))});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`, true);
  if (!changed) throw new Error('Could not set explode');
  await delay(300);
  await win.webContents.executeJavaScript(`document.querySelector('button[title="Fit model"]')?.click()`, true);
  await delay(700);
}

async function canvasMetrics(win) {
  return win.webContents.executeJavaScript(`(() => {
    const canvas = document.querySelector('.cad-viewport canvas');
    const footer = document.querySelector('.viewport-footer');
    const box = canvas?.getBoundingClientRect();
    return {
      width: box?.width || 0,
      height: box?.height || 0,
      family: footer?.querySelector('p')?.textContent || '',
      documentName: document.querySelector('input[aria-label="Document name"]')?.value || '',
      selected: document.querySelector('.selection-breadcrumb')?.textContent || '',
      explode: document.querySelector('.explode-control output')?.textContent || '',
      partsCollapsed: Boolean(document.querySelector('.tree-panel.collapsed')) && !document.querySelector('.tree-panel.expanded'),
      displayMode: document.querySelector('[aria-label="Display mode"]')?.textContent || '',
    };
  })()`, true);
}

async function captureScenario(win, label) {
  const captures = {};

  await chooseSelect(win, 'Cabinet family', 'Utility');
  await chooseSelect(win, 'Utility cabinet starter', 'Door Base');
  await waitForDocumentState(win, 'Utility cabinet', 'Door Base');
  await setExplode(win, 0);
  captures.utilityNormal = await capture(win, label + '-utility-normal');

  await selectPart(win, 'carcass:top-front', 'Top Front Stretcher');
  captures.utilitySelected = await capture(win, label + '-utility-selected');

  await setExplode(win, 110);
  captures.utilityExploded = await capture(win, label + '-utility-exploded');

  await setExplode(win, 0);
  await chooseSelect(win, 'Cabinet family', 'Equipment stand');
  await chooseSelect(win, 'Equipment stand starter', 'Solid-Side Utility Stand');
  await waitForDocumentState(win, 'Equipment stand', 'Solid-Side Utility Stand');
  captures.equipmentNormal = await capture(win, label + '-equipment-normal');

  await selectPart(win, 'carcass:top-front', 'Front Top Rail');
  captures.equipmentSelected = await capture(win, label + '-equipment-selected');

  await setExplode(win, 110);
  captures.equipmentExploded = await capture(win, label + '-equipment-exploded');

  for (const [name, metrics] of Object.entries(captures)) {
    if (metrics.width <= 600 || metrics.height <= 300) throw new Error(name + ' viewport is too small: ' + JSON.stringify(metrics));
    if (!metrics.partsCollapsed) throw new Error(name + ' captured with parts browser expanded: ' + JSON.stringify(metrics));
  }
  if (!captures.utilityNormal.family.includes('Utility cabinet') || captures.utilityNormal.documentName !== 'Door Base') {
    throw new Error('Utility capture state is stale: ' + JSON.stringify(captures.utilityNormal));
  }
  if (!captures.equipmentNormal.family.includes('Equipment stand') || captures.equipmentNormal.documentName !== 'Solid-Side Utility Stand') {
    throw new Error('Equipment capture state is stale: ' + JSON.stringify(captures.equipmentNormal));
  }
  if (!captures.utilitySelected.selected.includes('Top Front Stretcher')) {
    throw new Error('Utility selected capture is stale: ' + JSON.stringify(captures.utilitySelected));
  }
  if (!captures.equipmentSelected.selected.includes('Front Top Rail')) {
    throw new Error('Equipment selected capture is stale: ' + JSON.stringify(captures.equipmentSelected));
  }
  if (!captures.utilityExploded.explode.includes('110') || !captures.equipmentExploded.explode.includes('110')) {
    throw new Error('Exploded capture state is stale: ' + JSON.stringify(captures));
  }

  return captures;
}

app.whenReady().then(async () => {
  let win;
  try {
    win = await openApp(1200, 800);
    const validation = {
      compact: await captureScenario(win, 'compact'),
    };

    win.setSize(1600, 1000);
    await delay(800);
    validation.wide = await captureScenario(win, 'wide');

    fs.writeFileSync(path.join(outputDir, 'metrics.json'), JSON.stringify(validation, null, 2));
    console.log('SHIMMER_VISUAL_OK ' + JSON.stringify(validation));
    win.destroy();
    app.quit();
  } catch (error) {
    win?.destroy();
    console.error(error);
    app.exit(1);
  }
});
