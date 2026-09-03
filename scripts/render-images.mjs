import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { digest, renderInputs } from './render-inputs.mjs';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4175', '--strictPort'],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let serverError = '';
server.stderr.on('data', (d) => (serverError += d));
server.stdout.on('data', () => {});
let browser;
const stage = await mkdtemp(join(tmpdir(), 'formula-renders-'));
const files = [];
try {
  const deadline = Date.now() + 30000;
  for (;;) {
    if (server.exitCode !== null) throw new Error(serverError || 'Render server stopped');
    try {
      const response = await fetch('http://127.0.0.1:4175');
      if (response.ok) break;
    } catch {}
    if (Date.now() > deadline) throw new Error('Render server timeout');
    await new Promise((r) => setTimeout(r, 150));
  }
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-angle=swiftshader'],
  });
  for (const language of ['zh-Hant', 'en']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } }),
      errors = [],
      suffix = language === 'en' ? '-en' : '';
    page.on('pageerror', (e) => errors.push(e.message));
    const shot = async (name) => {
      const file = name + suffix + '.png';
      await page.screenshot({ path: join(stage, file), fullPage: true });
      files.push(file);
    };
    await page.goto('http://127.0.0.1:4175');
    await page.waitForFunction(() => window.racing?.verify);
    await page.evaluate(() => {
      const menu = document.getElementById('menu');
      menu.addEventListener('click', () => {
        window.__selectionRipple = !!menu.querySelector('.selection-ripple');
      });
      menu.addEventListener('change', () => {
        window.__settingFeedback = !!menu.querySelector('.setup.selection-feedback');
      });
    });
    await page.selectOption('#language', language);
    await page.waitForTimeout(650);
    await shot('menu');
    await page.locator('[data-track="1"]').click();
    assert.equal(await page.locator('[data-track="1"]').getAttribute('aria-pressed'), 'true');
    assert(await page.evaluate(() => window.__selectionRipple));
    await shot('selection');
    await page.waitForTimeout(600);
    await page.locator('[data-track="2"]').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('[data-track="2"]').getAttribute('aria-pressed'), 'true');
    await page.waitForTimeout(600);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-track="0"]').click();
    assert.equal(await page.locator('.selection-ripple').count(), 0);
    assert.equal(
      await page.locator('[data-track="0"]').evaluate((el) => getComputedStyle(el).animationName),
      'none',
    );
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.selectOption('#difficulty', 'advanced');
    assert(await page.evaluate(() => window.__settingFeedback));
    await page.selectOption('#difficulty', 'easy');
    await page.waitForTimeout(650);
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await shot('mobile-menu');
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.selectOption('#musicTrack', 'redline');
    await page.waitForTimeout(650);
    await shot('music-menu');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot('music-mobile');
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.locator('#start').click();
    await page.evaluate(() => window.racing.verify.advance(5.1));
    await page.keyboard.down('KeyW');
    await page.evaluate(() => window.racing.verify.advance(2.8));
    await page.keyboard.up('KeyW');
    const cameraFrame = await page.evaluate(() => window.racing.snapshot().renderer.frame);
    await page.waitForFunction(
      (frame) => window.racing.snapshot().renderer.frame > frame + 20,
      cameraFrame,
    );
    await shot('race');
    await page.evaluate(() => window.racing.verify.advance(400, true));
    assert.equal(await page.evaluate(() => window.racing.snapshot().state), 'results');
    await page.waitForTimeout(800);
    await shot('results');
    assert.deepEqual(errors, []);
    await page.close();
    console.log(
      `Verified ${language}: pointer, keyboard, reduced motion, settings, mobile and race results.`,
    );
  }
  await mkdir('artifacts', { recursive: true });
  const images = {};
  for (const file of files) {
    const dest = 'artifacts/' + file;
    await copyFile(join(stage, file), dest);
    images[dest] = digest(await readFile(dest));
  }
  await writeFile(
    'artifacts/render-manifest.json',
    JSON.stringify({ inputs: renderInputs(), images }, null, 2) + '\n',
  );
  console.log(`Updated ${files.length} bilingual screenshots.`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await rm(stage, { recursive: true, force: true });
}
