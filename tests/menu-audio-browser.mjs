import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => window.racing);
  const cues = await page.evaluate(async () => {
    const { MENU_CUES, scheduleCue } = await import('/src/menu-audio.js');
    const rows = [];
    for (const kind of Object.keys(MENU_CUES)) {
      const ctx = new OfflineAudioContext(1, 22050, 22050);
      scheduleCue(ctx, ctx.destination, kind, 0.01);
      const data = (await ctx.startRendering()).getChannelData(0);
      let energy = 0,
        peak = 0;
      for (const x of data) {
        energy += x * x;
        peak = Math.max(peak, Math.abs(x));
      }
      rows.push({ kind, energy, peak });
    }
    return rows;
  });
  for (const cue of cues) {
    // Cues last only a fraction of the one-second render window.
    assert(Math.sqrt(cue.energy / 22050) > 0.002);
    assert(cue.peak > 0.02);
    assert(cue.peak < 0.3);
  }
  assert.equal(new Set(cues.map((c) => c.energy)).size, 3);
  assert.equal(
    await page.evaluate(() => window.racing.snapshot().menuAudio.context),
    'uninitialized',
  );
  await page.locator('#sound').uncheck();
  await page.locator('#musicEnabled').uncheck();
  await page.waitForTimeout(100);
  let before = await page.evaluate(() => window.racing.snapshot().menuAudio.played);
  await page.locator('[data-track="1"]').click();
  await page.waitForFunction((n) => window.racing.snapshot().menuAudio.played > n, before);
  assert.equal(await page.evaluate(() => window.racing.snapshot().menuAudio.kind), 'select');
  await page.waitForTimeout(100);
  before = await page.evaluate(() => window.racing.snapshot().menuAudio.played);
  await page.selectOption('#difficulty', 'advanced');
  await page.waitForFunction((n) => window.racing.snapshot().menuAudio.played > n, before);
  assert.equal(await page.evaluate(() => window.racing.snapshot().menuAudio.kind), 'change');
  await page.waitForTimeout(100);
  before = await page.evaluate(() => window.racing.snapshot().menuAudio.played);
  await page.locator('[data-track="2"]').focus();
  await page.keyboard.press('Space');
  await page.waitForFunction((n) => window.racing.snapshot().menuAudio.played > n, before);
  await page.locator('#menuSound').uncheck();
  before = await page.evaluate(() => window.racing.snapshot().menuAudio.played);
  await page.locator('[data-track="0"]').click();
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => window.racing.snapshot().menuAudio.played), before);
  assert.equal(await page.evaluate(() => window.racing.snapshot().menuAudio.activeNodes), 0);
  await page.reload();
  await page.waitForFunction(() => window.racing);
  assert.equal(await page.locator('#menuSound').isChecked(), false);
  assert.equal(
    await page.evaluate(() => window.racing.snapshot().menuAudio.context),
    'uninitialized',
  );
  await page.locator('#menuSound').check();
  await page.waitForTimeout(100);
  await page.selectOption('#language', 'en');
  assert.equal(await page.locator('[data-i18n="選單音效"]').innerText(), 'Menu sounds');
  await page.waitForTimeout(100);
  before = await page.evaluate(() => window.racing.snapshot().menuAudio.played);
  await page.locator('#start').click();
  await page.waitForFunction((n) => window.racing.snapshot().menuAudio.played > n, before);
  assert.equal(await page.evaluate(() => window.racing.snapshot().menuAudio.kind), 'start');
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.racing.snapshot().menuAudio.activeNodes), 0);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: true,
        cues,
        checks: [
          'pointer',
          'keyboard',
          'change',
          'start',
          'independent mute',
          'preference persistence',
          'no autoplay',
          'node cleanup',
          'English label',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
