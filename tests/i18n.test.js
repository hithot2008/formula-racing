import { MUSIC_TRACKS } from '../src/music.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { english, t, setLanguage } from '../src/i18n.js';
import { TRACKS } from '../src/tracks.js';
test('English covers static labels and all eight circuit descriptions', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-aria-label|-title)?="([^"]+)"/g)].map((m) => m[1]);
  for (const track of TRACKS) keys.push(track.name, track.region, track.tag);
  for (const track of MUSIC_TRACKS) keys.push(track.name);
  for (const key of keys) assert(english[key], `Missing English: ${key}`);
  for (const [key, value] of Object.entries(english)) {
    assert(!/[\p{Script=Han}]/u.test(value), `Untranslated: ${key}`);
    assert.deepEqual(
      [...key.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort(),
      [...value.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort(),
    );
  }
});
test('locale switching and interpolation work without changing source strings', () => {
  setLanguage('en');
  assert.equal(t('個人紀錄 {time}', { time: '0:42.100' }), 'Personal best 0:42.100');
  setLanguage('zh-Hant');
  assert.equal(t('個人紀錄 {time}', { time: '0:42.100' }), '個人紀錄 0:42.100');
  setLanguage('invalid');
  assert.equal(t('煞車'), '煞車');
});
