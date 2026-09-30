import { createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const RELEASE_DIR = path.join(ROOT, 'release');
const SMOKE_DIR = path.join(RELEASE_DIR, 'smoke-test');
const PROJECT_PATH = path.join(SMOKE_DIR, 'smoke-project.cabinetws.json');
const STEP_PATH = path.join(SMOKE_DIR, 'smoke-export.step');
const SUMMARY_PATH = path.join(SMOKE_DIR, 'smoke-summary.json');
const DEBUG_PORT = 9333;
const TIMEOUT_MS = 120_000;

if (process.platform !== 'win32') {
  throw new Error('The packaged Windows smoke test must run on Windows.');
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.exceptions = [];
    this.consoleMessages = [];
    this.pausedFrames = [];
    this.lastExpression = '';
    this.closed = false;
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out connecting to Chromium DevTools.')), 15_000);
      this.socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.socket.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('Could not connect to Chromium DevTools.'));
      }, { once: true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      if (message.method === 'Debugger.paused') {
        this.pausedFrames = message.params.callFrames.map(frame => ({ name: frame.functionName, url: frame.url, location: frame.location }));
      }
      if (message.method === 'Runtime.consoleAPICalled') {
        this.consoleMessages.push({ type: message.params.type, args: message.params.args.map(arg => arg.value ?? arg.description) });
      }
      if (message.method === 'Runtime.exceptionThrown') {
        this.exceptions.push(message.params?.exceptionDetails?.exception?.description || message.params?.exceptionDetails?.text || 'Unhandled renderer exception');
      }
    });
    this.socket.addEventListener('close', () => {
      this.closed = true;
      for (const pending of this.pending.values()) {
        pending.reject(new Error('Chromium DevTools connection closed.'));
      }
      this.pending.clear();
    });
    await this.call('Runtime.enable');
    await this.call('Debugger.enable');
  }

  call(method, params = {}, timeoutMs = 15_000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for Chromium DevTools ${method}.`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: value => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: error => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    this.lastExpression = expression;
    const result = await this.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    }, 60_000);
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Renderer evaluation failed.');
    }
    return result.result?.value;
  }

  close() {
    this.socket?.close();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function findPortableExe() {
  const entries = await readdir(RELEASE_DIR, { withFileTypes: true });
  const candidates = entries
    .filter(entry => entry.isFile() && /^Cabinet-WS-Standalone-.*-Windows-x64\.exe$/i.test(entry.name))
    .map(entry => path.join(RELEASE_DIR, entry.name));
  if (candidates.length !== 1) {
    throw new Error(`Expected exactly one packaged Windows executable, found ${candidates.length}.`);
  }
  return candidates[0];
}

async function waitForTarget() {
  const deadline = Date.now() + TIMEOUT_MS;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`, { signal: AbortSignal.timeout(5_000) });
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl);
        if (page) return page;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`Packaged app did not expose a renderer DevTools target.${lastError ? ` ${lastError.message}` : ''}`);
}

async function waitFor(client, expression, label, timeoutMs = TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await client.evaluate(`Boolean(${expression})`)) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function clickButton(client, label) {
  const clicked = await client.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')]
      .find(candidate => candidate.textContent.replace(/\\s+/g, ' ').trim() === ${JSON.stringify(label)});
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Could not click enabled ${label} button.`);
}

async function notice(client) {
  return client.evaluate(`document.querySelector('.header-status span')?.textContent || ''`);
}

async function waitForNotice(client, expected) {
  await waitFor(
    client,
    `document.querySelector('.header-status span')?.textContent.includes(${JSON.stringify(expected)})`,
    `notice containing ${JSON.stringify(expected)}`,
    30_000,
  );
}

async function setWidth(client, millimeters) {
  const changed = await client.evaluate(`(() => {
    const input = document.querySelector('.viewport-dimension-editor label:first-child input');
    if (!(input instanceof HTMLInputElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setter) return false;
    setter.call(input, ${JSON.stringify(String(millimeters))});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!changed) throw new Error('Could not edit the packaged app width control.');
  await waitFor(
    client,
    `document.querySelector('.document-name .dirty-label')?.textContent.includes('Modified')`,
    'edited document to become dirty',
  );
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function runTaskkill(args) {
  const killer = spawn('taskkill', args, { windowsHide: true, stdio: 'ignore' });
  await Promise.race([
    new Promise(resolve => killer.once('exit', resolve)),
    sleep(5_000),
  ]);
}

async function stopProcess(child) {
  if (child.pid && child.exitCode === null) {
    await runTaskkill(['/pid', String(child.pid), '/t', '/f']);
  }
  await runTaskkill(['/im', 'Cabinet WS Standalone.exe', '/t', '/f']);
}

function recordCheck(summary, message) {
  summary.checks.push(message);
  console.log(`[smoke] ${message}`);
}

await rm(SMOKE_DIR, { recursive: true, force: true });
await mkdir(SMOKE_DIR, { recursive: true });

const executable = await findPortableExe();
const processLog = createWriteStream(path.join(SMOKE_DIR, 'electron.log'));
const child = spawn(executable, [], {
  cwd: ROOT,
  env: {
    ...process.env,
    CABINET_WS_SMOKE_DIR: SMOKE_DIR,
    CABINET_WS_SMOKE_DEBUG_PORT: String(DEBUG_PORT),
    ELECTRON_ENABLE_LOGGING: '1',
  },
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.pipe(processLog, { end: false });
child.stderr.pipe(processLog, { end: false });

let client;
let summary = {
  executable: path.basename(executable),
  passed: false,
  checks: [],
};

try {
  const target = await waitForTarget();
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();

  await waitFor(client, `document.querySelector('.app-shell')`, 'application shell');
  recordCheck(summary, 'packaged EXE renderer loaded');

  await waitFor(
    client,
    `document.querySelector('.viewport-badges span')?.textContent.includes('Exact CAD ·')`,
    'OpenCascade worker readiness',
  );
  recordCheck(summary, 'geometry worker reached exact-CAD ready state');

  await clickButton(client, 'Save As');
  await waitForNotice(client, 'Saved smoke-project.cabinetws.json');
  const initialProjectStat = await stat(PROJECT_PATH);
  if (initialProjectStat.size <= 0) throw new Error('Initial project save was empty.');
  recordCheck(summary, 'schema-v3 project saved through Electron IPC');

  await clickButton(client, 'Open');
  await waitForNotice(client, 'Opened smoke-project.cabinetws.json');
  recordCheck(summary, 'saved project opened through Electron IPC');

  await setWidth(client, 777);
  recordCheck(summary, 'cabinet width edited to 777 mm');

  await clickButton(client, 'Save');
  await waitForNotice(client, 'Saved smoke-project.cabinetws.json');
  const savedProject = JSON.parse(await readFile(PROJECT_PATH, 'utf8'));
  if (savedProject.version !== 3) throw new Error(`Expected schema v3 save, got v${savedProject.version}.`);
  if (savedProject.parameters?.width !== 777) {
    throw new Error(`Saved width mismatch: expected 777, got ${savedProject.parameters?.width}.`);
  }
  recordCheck(summary, 'edited schema-v3 project persisted expected width');

  await clickButton(client, 'New');
  await waitForNotice(client, 'New Utility cabinet');
  await clickButton(client, 'Open');
  await waitForNotice(client, 'Opened smoke-project.cabinetws.json');
  await waitFor(
    client,
    `Number(document.querySelector('.viewport-dimension-editor label:first-child input')?.value) === 777`,
    'reopened width to equal 777 mm',
  );
  recordCheck(summary, 'saved edit survived reopen');

  await waitFor(
    client,
    `document.querySelector('.viewport-badges span')?.textContent.includes('Exact CAD ·')`,
    'exact geometry after reopen',
  );
  await clickButton(client, 'STEP');
  await waitForNotice(client, 'Exported STEP · smoke-export.step');
  const step = await readFile(STEP_PATH);
  const stepText = step.toString('utf8');
  if (step.length <= 0 || !stepText.includes('ISO-10303-21') || !stepText.includes('END-ISO-10303-21')) {
    throw new Error('Packaged STEP export was missing the expected STEP envelope.');
  }
  summary.stepBytes = step.length;
  summary.stepSha256 = await sha256(STEP_PATH);
  summary.projectSha256 = await sha256(PROJECT_PATH);
  recordCheck(summary, 'STEP export completed and contained a valid STEP envelope');

  if (client.exceptions.length) {
    throw new Error(`Renderer exceptions observed: ${client.exceptions.join(' | ')}`);
  }

  summary.passed = true;
  summary.finalNotice = await notice(client);
  console.log(`Packaged Windows smoke test passed: ${summary.checks.join('; ')}`);
} catch (error) {
  summary.error = error instanceof Error ? error.stack || error.message : String(error);
  summary.lastExpression = client?.lastExpression;
  if (client && !client.closed) {
    await client.call('Debugger.pause', {}, 5000).catch(() => undefined);
    await sleep(500);
    summary.pausedFrames = client.pausedFrames;
    await client.call('Debugger.resume', {}, 5000).catch(() => undefined);
    await client.call('Page.captureScreenshot', {}, 5000).then(async result => {
      await writeFile(path.join(SMOKE_DIR, 'failure.png'), Buffer.from(result.data, 'base64'));
    }).catch(() => undefined);
  }
  throw error;
} finally {
  summary.rendererExceptions = client?.exceptions ?? [];
  summary.consoleMessages = client?.consoleMessages ?? [];
  await writeFile(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
  client?.close();
  await stopProcess(child);
  processLog.end();
}
