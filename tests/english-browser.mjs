import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => window.racing?.verify);
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('formula-racing-v1'));
    save.records['rookie:advanced:time'] = { medal: 2, best: 42, completed: 1, ghost: null };
    localStorage.setItem('formula-racing-v1', JSON.stringify(save));
  });
  await page.reload();
  await page.waitForFunction(() => window.racing?.verify);
  await page.selectOption('#language', 'en');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await page.selectOption('#difficulty', 'advanced');
  await page.selectOption('#mode', 'time');
  assert.equal(await page.locator('#record').innerText(), 'Personal best 0:42.000');
  async function noChinese(selector) {
    const text = await page.locator(selector).evaluate((el) => {
      const c = el.cloneNode(true);
      c.querySelectorAll('.language-picker').forEach((n) => n.remove());
      return c.textContent;
    });
    assert(!/[\p{Script=Han}]/u.test(text), `Untranslated ${selector}: ${text}`);
  }
  await noChinese('#menu');
  assert.equal(await page.locator('#trackName').innerText(), 'Academy Circuit');
  await page.screenshot({ path: 'artifacts/menu-en.png' });
  await page.locator('#help').click();
  await noChinese('#overlay');
  await page.locator('#closeHelp').click();
  await page.locator('[data-track="6"]').click();
  assert.equal(await page.locator('#trackName').innerText(), 'Silver Rain');
  await page.locator('[data-track="0"]').click();
  await page.locator('#start').click();
  await page.evaluate(() => window.racing.verify.advance(5.1));
  await noChinese('#hud');
  assert.match(await page.locator('#message').innerText(), /Lights out/);
  await page.keyboard.press('KeyP');
  await page.evaluate(() => window.racing.verify.advance(0.1));
  assert.match(await page.locator('#message').innerText(), /green pit box/);
  await page.keyboard.press('Escape');
  await noChinese('#overlay');
  await page.locator('#resume').click();
  await page.evaluate(() => window.racing.verify.advance(300, true));
  assert.equal(await page.evaluate(() => window.racing.snapshot().state), 'results');
  await noChinese('#overlay');
  await page.screenshot({ path: 'artifacts/results-en.png' });
  await page.locator('#back').click();
  const records = await page.evaluate(() =>
    JSON.stringify(JSON.parse(localStorage.getItem('formula-racing-v1')).records),
  );
  await page.selectOption('#language', 'zh-Hant');
  assert.equal(await page.locator('#trackName').innerText(), '新秀測試場');
  assert.equal(
    await page.evaluate(() =>
      JSON.stringify(JSON.parse(localStorage.getItem('formula-racing-v1')).records),
    ),
    records,
  );
  await page.selectOption('#language', 'en');
  await page.reload();
  await page.waitForFunction(() => window.racing?.verify);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('#language').inputValue(), 'en');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.locator('.section-heading h2').isVisible());
  assert(await page.locator('.section-heading h2 span').isVisible());
  await page.screenshot({ path: 'artifacts/mobile-menu-en.png', fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log(
    'PASS: English menu, tracks, help, HUD, pit prompt, pause, result, save compatibility, language persistence and mobile width',
  );
} finally {
  await browser.close();
}
