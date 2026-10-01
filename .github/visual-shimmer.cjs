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
  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, name + '.png'), image.toPNG());
}

async function openApp(width, height) {
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
  await waitFor(win, `document.querySelector('.tree-select[title="${partId}"]')`, partId);
  await win.webContents.executeJavaScript(`document.querySelector('.tree-select[title="${partId}"]')?.click()`, true);
  await waitFor(
    win,
    `document.querySelector('.selection-breadcrumb')?.textContent?.includes(${JSON.stringify(expectedName)})`,
    'selection breadcrumb for ' + expectedName,
  );

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const closed = await win.webContents.executeJavaScript(
      `Boolean(document.querySelector('[aria-label="Open parts browser"]'))`,
      true,
    );
    if (closed) break;
    await win.webContents.executeJavaScript(
      `document.querySelector('[aria-label="Collapse parts browser"]')?.click()`,
      true,
    );
    await delay(250);
  }
  await waitFor(win, `document.querySelector('[aria-label="Open parts browser"]')`, 'parts drawer closed');
  await waitFor(win, `!document.querySelector('.viewport-status.loading')`, 'kernel idle after selection', 30000);
  await waitFor(
    win,
    `document.querySelector('.selection-breadcrumb')?.textContent?.includes(${JSON.stringify(expectedName)})`,
    'stable selection breadcrumb for ' + expectedName,
  );
  await win.webContents.executeJavaScript(`document.querySelector('button[title="Fit model"]')?.click()`, true);
  await delay(700);
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
      footer: footer?.textContent || '',
      selected: document.querySelector('.selection-breadcrumb')?.textContent || '',
      explode: document.querySelector('.explode-control output')?.textContent || '',
    };
  })()`, true);
}

async function captureScenario(win, label) {
  await chooseSelect(win, 'Cabinet family', 'Utility');
  await chooseSelect(win, 'Utility cabinet starter', 'Door Base');
  await setExplode(win, 0);
  await capture(win, label + '-utility-normal');
  await selectPart(win, 'carcass:top-front', 'Top Front Stretcher');
  await capture(win, label + '-utility-selected');
  await setExplode(win, 110);
  await capture(win, label + '-utility-exploded');

  await setExplode(win, 0);
  await chooseSelect(win, 'Cabinet family', 'Equipment stand');
  await chooseSelect(win, 'Equipment stand starter', 'Solid-Side Utility Stand');
  await capture(win, label + '-equipment-normal');
  await selectPart(win, 'carcass:top-front', 'Front Top Rail');
  await capture(win, label + '-equipment-selected');
  await setExplode(win, 110);
  await capture(win, label + '-equipment-exploded');

  return canvasMetrics(win);
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
