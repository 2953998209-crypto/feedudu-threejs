// render_compare.mjs —— 内嵌静态服务器的渲染比对脚本
// 用系统 Chrome(Playwright) 渲染 index.html 并截图，供视觉比对。
// 用法: node render_compare.mjs [outfile] [可选 JSON 参数串 如 '{"noseSize":1.2}']
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, resolve, join, normalize } from 'path';

const out = process.argv[2] || 'feedudu_render.png';
const paramStr = process.argv[3] || '{}';
const root = resolve('');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const fp = normalize(join(root, p));
    if (!fp.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
    const buf = await readFile(fp);
    res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(buf);
  } catch (e) {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const baseUrl = `http://localhost:${port}/index.html`;

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-webgl',
  ],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 1300 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message));

try {
  await page.goto(baseUrl, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => !!window.__feedudu, { timeout: 30000 });
  if (paramStr && paramStr !== '{}') {
    await page.evaluate((p) => { window.__feedudu.model.setParams(JSON.parse(p)); }, paramStr);
  }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: out });
  console.log('SHOT_OK', out);
} catch (e) {
  console.error('RENDER_FAIL:', e.message);
  console.error('CONSOLE_ERRORS:', errors.slice(0, 8).join(' | '));
} finally {
  if (errors.length) console.log('CONSOLE_ERRORS:', errors.slice(0, 8).join(' | '));
  await browser.close();
  server.close();
}
