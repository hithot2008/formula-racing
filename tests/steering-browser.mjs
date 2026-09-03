import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForFunction(() => window.racing?.verify);
  await page.selectOption('#mode', 'time');
  await page.selectOption('#difficulty', 'easy');
  const results = [];
  for (const [key, sign] of [
    ['ArrowLeft', -1],
    ['ArrowRight', 1],
    ['KeyA', -1],
    ['KeyD', 1],
  ]) {
    await page.locator('#start').click();
    await page.evaluate(() => window.racing.verify.advance(5.1));
    await page.keyboard.down('KeyW');
    await page.evaluate(() => window.racing.verify.advance(1.5));
    const before = await page.evaluate(() => window.racing.snapshot().cars[0]);
    await page.keyboard.down(key);
    await page.evaluate(() => window.racing.verify.advance(0.65));
    await page.keyboard.up(key);
    await page.keyboard.up('KeyW');
    const after = await page.evaluate(() => window.racing.snapshot().cars[0]);
    const right =
      -Math.cos(before.heading) * (after.x - before.x) +
      Math.sin(before.heading) * (after.z - before.z);
    assert(right * sign > 0.1, `${key} turned the wrong way: right displacement ${right}`);
    results.push({ key, driverRightMetres: right });
    await page.keyboard.press('Escape');
    await page.locator('#back').click();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} finally {
  await browser.close();
}
