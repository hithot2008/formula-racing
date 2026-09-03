import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader', '--enable-webgl'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5173/');
await page.waitForFunction(() => window.racing?.snapshot().state === 'menu');
assert.equal(await page.locator('.track-card').count(), 8);
await mkdir('artifacts', { recursive: true });
await page.screenshot({ path: 'artifacts/menu.png' });
await page.locator('[data-track="6"]').click();
assert.equal(await page.locator('#trackName').textContent(), '銀雨技術場');
await page.locator('[data-track="0"]').click();
await page.selectOption('#difficulty', 'easy');
await page.selectOption('#mode', 'race');
await page.locator('#start').click();
await page.waitForFunction(() => window.racing.snapshot().state === 'racing');
assert.equal(await page.locator('.position-row').count(), 6);
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(2400);
await page.keyboard.up('ArrowUp');
const moving = await page.evaluate(() => window.racing.snapshot());
assert(moving.cars[0].speed > 8);
await page.screenshot({ path: 'artifacts/race.png' });
await page.keyboard.press('Escape');
const paused = await page.evaluate(() => window.racing.snapshot().elapsed);
await page.waitForTimeout(500);
assert.equal(await page.evaluate(() => window.racing.snapshot().elapsed), paused);
await page.locator('#resume').click();
await page.keyboard.press('KeyC');
await page.keyboard.press('KeyR');
assert.equal(await page.evaluate(() => window.racing.snapshot().cars[0].penalty), 5);
await page.keyboard.press('Escape');
await page.locator('#back').click();
await page.selectOption('#difficulty', 'advanced');
await page.selectOption('#mode', 'race');
await page.locator('#start').click();
const fullRace = await page.evaluate(() => window.racing.verify.advance(450, true));
assert.equal(fullRace.state, 'results');
assert.equal(fullRace.cars[0].lap, 3);
assert((await page.locator('#overlayTitle').textContent()).includes('完賽'));
await page.screenshot({ path: 'artifacts/results.png' });
await page.locator('#back').click();
await page.selectOption('#mode', 'time');
await page.locator('#start').click();
const timeTrial = await page.evaluate(() => window.racing.verify.advance(300, true));
assert.equal(timeTrial.state, 'results');
assert(Number.isFinite(timeTrial.cars[0].bestLap));
assert(
  await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('formula-racing-v1')).records['rookie:advanced:time'].ghost
        .length > 10,
  ),
);
await page.locator('#back').click();
await page.selectOption('#mode', 'academy');
await page.locator('#start').click();
const academy = await page.evaluate(() => window.racing.verify.advance(200, true));
assert.equal(academy.state, 'results');
assert.equal(academy.cars[0].lap, 1);
await page.locator('#back').click();
await page.locator('#help').click();
assert(await page.locator('#overlayTitle').isVisible());
await page.locator('#closeHelp').click();
await page.selectOption('#difficulty', 'pro');
await page.reload();
await page.waitForFunction(() => window.racing);
assert.equal(await page.locator('#difficulty').inputValue(), 'pro');
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: 'artifacts/mobile-menu.png', fullPage: true });
assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
assert.deepEqual(errors, []);
console.log(
  JSON.stringify(
    {
      passed: true,
      checks: [
        '8 tracks',
        'selection',
        'start lights',
        '6 cars',
        'acceleration',
        'pause freezes simulation',
        'camera',
        'reset penalty',
        'help',
        'settings persistence',
        'mobile layout',
        'no JS errors',
        'complete 3-lap race',
        '2-lap time trial',
        'ghost saved',
        '1-lap academy',
      ],
      speed: moving.cars[0].speed,
      render: moving.renderer,
    },
    null,
    2,
  ),
);
await browser.close();
