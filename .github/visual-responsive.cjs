const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const outputDir = path.resolve(process.argv[3] || 'responsive-visual-artifacts');
fs.mkdirSync(outputDir, { recursive: true });

app.commandLine.appendSwitch('use-gl', 'swiftshader');
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(win, expression, label, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      if (await win.webContents.executeJavaScript(`Boolean(${expression})`, true)) return;
    } catch {}
    await delay(120);
  }
  throw new Error('Timed out waiting for ' + label);
}

async function clickByText(win, selector, text) {
  const clicked = await win.webContents.executeJavaScript(`(() => {
    const target = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find(element => element.textContent?.includes(${JSON.stringify(text)}));
    if (!target) return false;
    target.click();
    return true;
  })()`, true);
  if (!clicked) throw new Error('Could not find ' + text + ' in ' + selector);
}

async function setInput(win, selector, value) {
  const changed = await win.webContents.executeJavaScript(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!(input instanceof HTMLInputElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`, true);
  if (!changed) throw new Error('Could not update ' + selector);
}

async function openApp(width, height, zoomFactor = 1) {
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
  win.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('RESPONSIVE_VISUAL_LOAD_FAILURE', JSON.stringify({ code, description, url }));
  });
  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log('RESPONSIVE_VISUAL_CONSOLE', JSON.stringify({ level, message, line, sourceId }));
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('RESPONSIVE_VISUAL_RENDERER_GONE', JSON.stringify(details));
  });

  const visualUrl = process.env.RESPONSIVE_VISUAL_URL;
  if (visualUrl) await win.loadURL(visualUrl);
  else await win.loadFile(path.join(process.cwd(), 'dist', 'index.html'));
  if (zoomFactor !== 1) {
    win.webContents.setZoomFactor(zoomFactor);
    await delay(300);
  }
  try {
    await waitFor(win, `document.querySelector('.workspace') && document.querySelector('.properties-panel')`, 'main workspace');
  } catch (error) {
    const diagnostic = await win.webContents.executeJavaScript(`(() => ({
      location: location.href,
      title: document.title,
      readyState: document.readyState,
      root: document.querySelector('#root')?.innerHTML?.slice(0, 4000) || '',
      bodyText: document.body?.innerText?.slice(0, 4000) || '',
      scripts: [...document.scripts].map(script => ({ src: script.src, type: script.type })),
      resources: performance.getEntriesByType('resource').map(entry => entry.name).slice(-20)
    }))()`, true).catch(diagnosticError => ({ diagnosticError: String(diagnosticError) }));
    console.error('RESPONSIVE_VISUAL_STARTUP_DIAGNOSTIC', JSON.stringify(diagnostic));
    throw error;
  }
  await delay(500);
  return win;
}

async function capture(win, name) {
  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outputDir, name + '.png'), image.toPNG());
}

async function validateBounds(win, label) {
  const metrics = await win.webContents.executeJavaScript(`(() => {
    const rect = selector => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    const toolbar = document.querySelector('.toolbar');
    return {
      innerWidth,
      innerHeight,
      devicePixelRatio,
      documentScrollWidth: document.documentElement.scrollWidth,
      workspace: rect('.workspace'),
      viewport: rect('.viewport-panel'),
      properties: rect('.properties-panel'),
      propertiesNavigation: rect('.properties-navigation'),
      propertiesContent: rect('.properties-content-shell'),
      layoutWorkspace: rect('.layout-primary-column'),
      toolbar: rect('.toolbar'),
      toolbarScrollWidth: toolbar?.scrollWidth || 0,
      toolbarClientWidth: toolbar?.clientWidth || 0,
    };
  })()`, true);

  for (const key of ['workspace', 'viewport', 'properties', 'propertiesNavigation', 'propertiesContent', 'layoutWorkspace']) {
    if (!metrics[key]) throw new Error(label + ': missing ' + key);
  }
  if (metrics.workspace.left < -1 || metrics.workspace.right > metrics.innerWidth + 1) {
    throw new Error(label + ': workspace escapes horizontal viewport');
  }
  if (metrics.workspace.bottom > metrics.innerHeight + 1) {
    throw new Error(label + ': workspace escapes vertical viewport');
  }
  if (metrics.viewport.width < 295) throw new Error(label + ': viewport is narrower than 295 CSS px');
  if (metrics.properties.width < 260) throw new Error(label + ': Properties panel is narrower than 260 CSS px');
  if (metrics.propertiesNavigation.bottom > metrics.propertiesContent.top + 1) {
    throw new Error(label + ': Properties navigation overlaps results');
  }
  if (metrics.propertiesContent.bottom > metrics.properties.bottom + 1 || metrics.propertiesContent.height < 70) {
    throw new Error(label + ': Properties results are not bounded inside the panel');
  }
  if (metrics.documentScrollWidth > metrics.innerWidth + 2) {
    throw new Error(label + ': document has uncontrolled horizontal overflow');
  }
  return metrics;
}

async function verifyConstrainedDrawers(win) {
  const opened = await win.webContents.executeJavaScript(`(() => {
    const hardware = document.querySelector('.hardware-drawer-toggle.collapsed');
    const parts = document.querySelector('.parts-drawer-toggle.collapsed');
    if (!hardware || !parts) return false;
    hardware.click();
    parts.click();
    return true;
  })()`, true);
  if (!opened) throw new Error('Could not open constrained Hardware and Parts drawers');
  await waitFor(win, `document.querySelector('.hardware-drawer.expanded') && document.querySelector('.tree-panel.expanded')`, 'both responsive drawers');

  const result = await win.webContents.executeJavaScript(`(() => {
    const box = node => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const row = document.querySelector('.layout-navigation-row');
    const hardware = document.querySelector('.hardware-drawer.expanded');
    const parts = document.querySelector('.tree-panel.expanded');
    const hardwareClose = document.querySelector('.hardware-drawer-collapse');
    const partsClose = document.querySelector('.parts-drawer-collapse');
    if (!row || !hardware || !parts || !hardwareClose || !partsClose) return null;
    return {
      row: box(row),
      hardware: box(hardware),
      parts: box(parts),
      hardwareClose: box(hardwareClose),
      partsClose: box(partsClose),
    };
  })()`, true);

  if (!result) throw new Error('Could not measure responsive drawers');
  if (result.hardware.right > result.parts.left + 1) throw new Error('Constrained drawers overlap each other');
  for (const [name, control] of [['hardware', result.hardwareClose], ['parts', result.partsClose]]) {
    if (control.left < result.row.left - 1 || control.right > result.row.right + 1 || control.top < result.row.top - 1 || control.bottom > result.row.bottom + 1) {
      throw new Error(name + ' drawer close control is not reachable inside the workspace');
    }
  }

  await win.webContents.executeJavaScript(`(() => {
    document.querySelector('.hardware-drawer-collapse')?.click();
    document.querySelector('.parts-drawer-collapse')?.click();
  })()`, true);
  await waitFor(win, `document.querySelector('.hardware-drawer.collapsed') && document.querySelector('.tree-panel.collapsed')`, 'collapsed responsive drawers');
  return result;
}

async function verifySolverPersistence(win) {
  await clickByText(win, '.layout-workspace-tabs button', 'Fit Solver');
  await waitFor(win, `document.querySelector('.fit-solver-panel')?.offsetParent !== null`, 'visible Fit Solver');
  const updated = await win.webContents.executeJavaScript(`(() => {
    const label = [...document.querySelectorAll('.fit-input-grid label')]
      .find(candidate => candidate.textContent?.includes('Inside width'));
    const input = label?.querySelector('input');
    if (!(input instanceof HTMLInputElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, '777');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`, true);
  if (!updated) throw new Error('Could not edit Fit Solver Inside width');

  await clickByText(win, '.layout-workspace-tabs button', 'Layout');
  await clickByText(win, '.layout-workspace-tabs button', 'Fit Solver');
  const persisted = await win.webContents.executeJavaScript(`(() => {
    const label = [...document.querySelectorAll('.fit-input-grid label')]
      .find(candidate => candidate.textContent?.includes('Inside width'));
    return label?.querySelector('input')?.value || '';
  })()`, true);
  if (persisted !== '777') throw new Error('Fit Solver input did not survive workspace tab switches: ' + persisted);
  return { insideWidth: persisted };
}

async function verifySelectedCategoryBrowse(win) {
  const opened = await win.webContents.executeJavaScript(`(() => {
    const button = document.querySelector('.parts-drawer-toggle.collapsed');
    if (!button) return false;
    button.click();
    return true;
  })()`, true);
  if (!opened) throw new Error('Could not open Parts browser');
  await waitFor(win, `document.querySelector('.tree-panel.expanded .tree-select')`, 'expanded Parts browser');

  const selected = await win.webContents.executeJavaScript(`(() => {
    const part = document.querySelector('.tree-panel.expanded .tree-select');
    if (!part) return false;
    part.click();
    return true;
  })()`, true);
  if (!selected) throw new Error('Could not select a generated part');
  await waitFor(win, `document.querySelector('.selection-breadcrumb')`, 'selected-part breadcrumb');

  const before = await win.webContents.executeJavaScript(`(() => ({
    selection: document.querySelector('.selection-breadcrumb')?.textContent || '',
    dimensions: document.querySelector('.viewport-footer')?.textContent || ''
  }))()`, true);

  await clickByText(win, '.property-mode-tabs button', 'Family settings');
  await waitFor(win, `document.querySelector('.settings-category-nav button')`, 'settings category rail');
  const category = await win.webContents.executeJavaScript(`(() => {
    const button = document.querySelector('.settings-category-nav button');
    if (!button) return '';
    const label = button.textContent?.trim() || '';
    button.click();
    return label;
  })()`, true);
  if (!category) throw new Error('Could not activate a Family settings category');
  await waitFor(win, `document.querySelector('.selected-context-return')`, 'selected-part return control');

  const after = await win.webContents.executeJavaScript(`(() => ({
    selection: document.querySelector('.selection-breadcrumb')?.textContent || '',
    dimensions: document.querySelector('.viewport-footer')?.textContent || '',
    returnLabel: document.querySelector('.selected-context-return')?.textContent || '',
    activeCategory: document.querySelector('.settings-category-nav button.active')?.textContent?.trim() || ''
  }))()`, true);

  if (before.selection !== after.selection) throw new Error('Explicit category browse changed the selected part');
  if (before.dimensions !== after.dimensions) throw new Error('Category navigation changed cabinet dimensions');
  if (!after.returnLabel.includes('Return to selected part')) throw new Error('Selected-part return control is missing');
  if (after.activeCategory !== category) throw new Error('Activated category did not stay visibly active');
  return { category, selection: after.selection };
}

async function verifySearch(win, query, expectMatch) {
  await clickByText(win, '.property-mode-tabs button', 'Family settings');
  await setInput(win, '[aria-label="Search properties"]', query);
  if (expectMatch) {
    await waitFor(win, `Number.parseInt(document.querySelector('.family-settings-search-count')?.textContent || '0', 10) > 0`, 'family search matches');
  } else {
    await waitFor(win, `document.querySelector('.property-search-empty')?.textContent?.includes('No family settings match')`, 'family no-match state');
  }
  return win.webContents.executeJavaScript(`(() => ({
    query: document.querySelector('[aria-label="Search properties"]')?.value || '',
    summary: document.querySelector('.family-settings-search-count')?.textContent || '',
    empty: document.querySelector('.property-search-empty')?.textContent || '',
    scrollHeight: document.querySelector('.properties-scroll')?.scrollHeight || 0,
    clientHeight: document.querySelector('.properties-scroll')?.clientHeight || 0
  }))()`, true);
}

const scenario = process.argv[4] || 'minimum';

app.whenReady().then(async () => {
  const validation = {};
  let win;
  try {
    console.log('RESPONSIVE_VISUAL_START ' + scenario);
    if (scenario === 'minimum') {
      win = await openApp(1100, 700);
      validation.bounds = await validateBounds(win, 'minimum-1100x700');
      validation.drawers = await verifyConstrainedDrawers(win);
      validation.search = await verifySearch(win, 'this-query-intentionally-matches-no-family-setting-1234567890', false);
      await capture(win, 'minimum-1100x700-no-match');
    } else if (scenario === 'laptop') {
      win = await openApp(1366, 768);
      validation.bounds = await validateBounds(win, 'laptop-1366x768');
      validation.selectedCategory = await verifySelectedCategoryBrowse(win);
      await capture(win, 'laptop-1366x768-selected-category');
    } else if (scenario === 'desktop') {
      win = await openApp(1920, 1080);
      validation.bounds = await validateBounds(win, 'desktop-1920x1080');
      validation.solver = await verifySolverPersistence(win);
      await capture(win, 'desktop-1920x1080-fit-solver');
    } else if (scenario === 'scaled') {
      win = await openApp(1100, 700, 1.25);
      validation.bounds = await validateBounds(win, 'scale-pressure-125');
      validation.search = await verifySearch(win, 'width', true);
      await capture(win, 'scale-pressure-125-width-search');
    } else {
      throw new Error('Unknown responsive visual scenario: ' + scenario);
    }

    fs.writeFileSync(path.join(outputDir, 'validation-' + scenario + '.json'), JSON.stringify(validation, null, 2));
    console.log('RESPONSIVE_VISUAL_VALIDATION ' + scenario + ' ' + JSON.stringify(validation));
    win?.destroy();
    app.quit();
  } catch (error) {
    win?.destroy();
    console.error(error);
    app.exit(1);
  }
});
