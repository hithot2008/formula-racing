import { mkdir as ensureScreenshotDir } from 'node:fs/promises';
await ensureScreenshotDir('artifacts/test-runs', { recursive: true });
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForFunction(() => window.racing?.verify);
  const rendered = await page.evaluate(async () => {
    const { MUSIC_TRACKS, createNoise, scheduleStep } = await import('/src/music.js');
    const results = [];
    for (const track of MUSIC_TRACKS) {
      const duration = (60 / track.bpm) * 16 + 1,
        ctx = new OfflineAudioContext(1, Math.ceil(22050 * duration), 22050),
        gain = ctx.createGain();
      gain.gain.value = 0.35;
      gain.connect(ctx.destination);
      const noise = createNoise(ctx);
      for (let step = 0; step < 64; step++)
        scheduleStep(ctx, gain, noise, track, step, 0.01 + (step * 60) / track.bpm / 4);
      const buffer = await ctx.startRendering(),
        data = buffer.getChannelData(0);
      let sum = 0,
        peak = 0,
        hash = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
        peak = Math.max(peak, Math.abs(data[i]));
        if (i % 997 === 0) hash += data[i] * (i + 1);
      }
      results.push({ id: track.id, bpm: track.bpm, rms: Math.sqrt(sum / data.length), peak, hash });
    }
    return results;
  });
  assert.equal(rendered.length, 6);
  assert.equal(new Set(rendered.map((r) => r.hash)).size, 6);
  for (const r of rendered) {
    assert(r.rms > 0.005, `${r.id} silent`);
    assert(r.peak < 0.95, `${r.id} clipping`);
  }
  assert.equal(await page.locator('#musicTrack option').count(), 6);
  await page.locator('#sound').uncheck();
  await page.locator('#musicPreview').click();
  await page.waitForFunction(
    () => window.racing.snapshot().music.playing && window.racing.snapshot().music.rms > 0.001,
  );
  for (const id of ['neon', 'redline', 'tunnel', 'horizon', 'grid']) {
    await page.selectOption('#musicTrack', id);
    await page.waitForFunction(
      (id) =>
        window.racing.snapshot().music.track === id && window.racing.snapshot().music.rms > 0.001,
      id,
    );
  }
  await page.locator('#musicVolume').fill('20');
  await page.locator('#musicVolume').dispatchEvent('input');
  assert.equal(await page.evaluate(() => window.racing.snapshot().music.volume), 0.2);
  await page.locator('#musicPreview').click();
  await page.waitForFunction(() => !window.racing.snapshot().music.playing);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.racing.snapshot().music.activeNodes), 0);
  await page.selectOption('#language', 'en');
  await page.screenshot({ path: 'artifacts/test-runs/music-menu-en.png' });
  assert.equal(await page.locator('#musicPreview').innerText(), 'Preview');
  await page.reload();
  await page.waitForFunction(() => window.racing);
  assert.equal(await page.locator('#musicTrack').inputValue(), 'grid');
  assert.equal(await page.locator('#musicVolume').inputValue(), '20');
  assert.equal(await page.evaluate(() => window.racing.snapshot().music.playing), false);
  await page.locator('#start').click();
  await page.waitForFunction(() => window.racing.snapshot().music.playing);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !window.racing.snapshot().music.playing);
  await page.locator('#resume').click();
  await page.waitForFunction(() => window.racing.snapshot().music.playing);
  await page.locator('#musicMute').click();
  await page.waitForFunction(() => !window.racing.snapshot().music.playing);
  assert.equal(await page.locator('#musicEnabled').isChecked(), false);
  await page.locator('#musicMute').click();
  await page.waitForFunction(() => window.racing.snapshot().music.playing);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForFunction(() => !window.racing.snapshot().music.playing);
  await page.locator('#back').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/test-runs/music-mobile-en.png', fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: true,
        rendered,
        checks: [
          'six audible distinct arrangements',
          'no clipping in rendered previews',
          'preview',
          'switch track',
          'engine sound independent',
          'volume persisted',
          'no autoplay after reload',
          'pause/resume',
          'mute/unmute',
          'blur stops music',
          'mobile layout',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
