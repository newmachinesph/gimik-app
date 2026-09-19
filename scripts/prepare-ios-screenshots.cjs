// Runs only on the EAS Maestro worker; never bundled into the application.
const { execFileSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const { homedir } = require('node:os');
const { join } = require('node:path');

async function main() {
  const email = process.env.MAESTRO_SCREENSHOT_EMAIL;
  const password = process.env.MAESTRO_SCREENSHOT_PASSWORD;
  if (!email?.startsWith('gimik-screenshots-') || !email.endsWith('@example.com') || !password) {
    throw new Error('Configure the dedicated screenshot account in the preview EAS environment.');
  }
  const base = 'https://api.gimik.app';
  async function request(path, options = {}) {
    const response = await fetch(base + path, options);
    if (!response.ok) throw new Error(`Screenshot fixture request ${path}: HTTP ${response.status}`);
    return response.json();
  }
  const pair = await request('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const headers = { Authorization: `Bearer ${pair.access_token}` };
  const threads = await request('/threads', { headers });
  const thread = threads.find(t => t.kind === 'plan' && t.someday?.slug === 'mountain-climbing');
  if (!thread) throw new Error('Seed the private screenshot plan and conversation before capturing.');
  execFileSync('set-env', ['MAESTRO_SCREENSHOT_THREAD', thread.id]);
  // Maestro 2.x can save relative screenshot paths outside its results folder.
  // Use an explicit directory included in EAS's Maestro Test Results artifact.
  const screenshotDir = join(homedir(), '.maestro', 'tests', 'app-store');
  mkdirSync(screenshotDir, { recursive: true });
  execFileSync('set-env', ['MAESTRO_SCREENSHOT_DIR', screenshotDir]);

  const simctl = (...args) => execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8', timeout: 180000 });
  const runtimes = JSON.parse(simctl('list', 'runtimes', '--json')).runtimes;
  const runtime = runtimes.filter(r => r.isAvailable && r.identifier.includes('.iOS-')).at(-1);
  if (!runtime) throw new Error('No available iOS runtime on the EAS worker.');
  const devices = JSON.parse(simctl('list', 'devices', '--json')).devices;
  let device = (devices[runtime.identifier] || []).find(d => d.name === 'Gimik Screenshots');
  const udid = device?.udid || simctl('create', 'Gimik Screenshots',
    'com.apple.CoreSimulator.SimDeviceType.iPhone-13-Pro-Max', runtime.identifier).trim();
  if (device?.state !== 'Booted') simctl('boot', udid);
  simctl('bootstatus', udid, '-b');
  simctl('ui', udid, 'appearance', 'light');
  simctl('status_bar', udid, 'override', '--time', '9:41', '--dataNetwork', 'wifi',
    '--wifiMode', 'active', '--wifiBars', '3', '--batteryState', 'charged', '--batteryLevel', '100');
  console.log('Prepared iPhone 13 Pro Max (1284 x 2778), light appearance, and screenshot fixture.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
