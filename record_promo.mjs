import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync, renameSync, statSync } from 'fs';
import { extname } from 'path';

const ROOT = 'D:/GPT浏览器下载/2026-10-30-10-33-22/feedudu-threejs';
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webm':'video/webm' };

const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/promo.html';
  const fp = ROOT + p;
  if (!existsSync(fp)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
  res.end(readFileSync(fp));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/promo.html`;
console.log('serving at', base);

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl',
         '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader',
         '--no-sandbox', '--disable-dev-shm-usage']
});
const context = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  recordVideo: { dir: ROOT, size: { width: 1080, height: 1920 } }
});
const page = await context.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('PAGE-ERR:', m.text()); });
page.on('pageerror', e => console.log('PAGE-EXCEPTION:', e.message));
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
console.log('page loaded, recording 54s...');
await page.waitForTimeout(54500);

const video = page.video();
await context.close();
await browser.close();
server.close();

const vp = video ? await video.path() : null;
let src = vp;
if (!src || !existsSync(src)) {
  const webms = readdirSync(ROOT).filter(f => f.endsWith('.webm'))
    .map(f => ({ f, t: statSync(ROOT + '/' + f).mtimeMs })).sort((a,b)=>b.t-a.t);
  src = webms.length ? ROOT + '/' + webms[0].f : null;
}
if (!src) { console.error('NO VIDEO'); process.exit(2); }
const out = ROOT + '/feedudu_promo_raw.webm';
if (src !== out) renameSync(src, out);
console.log('saved:', out);
