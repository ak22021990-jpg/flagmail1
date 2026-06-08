import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('playwright-artifacts');
const BASE_URL = 'http://127.0.0.1:4173';

const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'laptop-1280x720', width: 1280, height: 720 },
  { name: 'tablet-1024x768', width: 1024, height: 768 },
];

await fs.mkdir(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${viewport.name}.png`),
    fullPage: true,
  });

  const metrics = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const root = document.querySelector('#root > div');
    const firstMotionBlock = root?.firstElementChild;
    const mainGrid = firstMotionBlock?.firstElementChild;
    const leftColumn = mainGrid?.firstElementChild;
    const rightColumn = mainGrid?.lastElementChild;

    const readBox = (el) => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        bottom: Math.round(rect.bottom),
      };
    };

    const text = (el) => el?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 160) ?? null;

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scroll: {
        bodyScrollHeight: body.scrollHeight,
        htmlScrollHeight: html.scrollHeight,
        overflowY:
          Math.max(body.scrollHeight, html.scrollHeight) > window.innerHeight ? 'scrolling' : 'fits',
        extraPixels:
          Math.max(body.scrollHeight, html.scrollHeight) - window.innerHeight,
      },
      rootBox: readBox(root),
      mainGridBox: readBox(mainGrid),
      leftColumnBox: readBox(leftColumn),
      rightColumnBox: readBox(rightColumn),
      rightColumnText: text(rightColumn),
    };
  });

  report.push({
    viewport: viewport.name,
    ...metrics,
  });

  await page.close();
}

await browser.close();
await fs.writeFile(
  path.join(OUTPUT_DIR, 'landing-report.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);

const { url, timestamp, ...summary } = report;
console.log(JSON.stringify({ url, timestamp, checks: Object.keys(summary) }, null, 2));
