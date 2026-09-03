import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRACKS, makeTrack } from '../src/tracks.js';
import { createCar, stepCar, aiInput, collide, STEP } from '../src/physics.js';
import { trackRecordKey, currentMedalCount } from '../src/records.js';
const proposals = JSON.parse(
  readFileSync(new URL('../docs/previews/track-layouts-v2.json', import.meta.url)),
);
test('approved layouts retain coordinates and road clearance including barriers', () => {
  for (const proposal of proposals) {
    const def = TRACKS.find((d) => d.id === proposal.id);
    assert.deepEqual(def.points, proposal.points);
    assert.equal(def.layoutVersion, 2);
    const track = makeTrack(def),
      p = track.samples;
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++) {
        const arc = (Math.min(j - i, p.length - (j - i)) * track.length) / p.length;
        if (arc < def.width * 4) continue;
        assert(
          Math.hypot(p[i].x - p[j].x, p[i].z - p[j].z) > def.width + 10,
          `${def.id}: road/barrier overlap`,
        );
      }
  }
});
test('revised lap records and ghosts are isolated without deleting legacy records', () => {
  const old = {
    best: 42,
    medal: 3,
    ghost: [
      [0, 1, 2, 3],
      [1, 2, 3, 4],
    ],
  };
  const records = { 'coast:easy:time': old, 'rookie:easy:time': old };
  const coast = TRACKS.find((d) => d.id === 'coast');
  const key = trackRecordKey(coast, 'easy', 'time');
  assert.equal(key, 'coast:easy:time:v2');
  assert.equal(records[key], undefined);
  assert.equal(currentMedalCount(records, TRACKS), 1);
  records[key] = {
    best: 70,
    medal: 1,
    ghost: [
      [0, 5, 6, 7],
      [1, 6, 7, 8],
    ],
  };
  assert.deepEqual(records['coast:easy:time'], old);
  assert.equal(currentMedalCount(records, TRACKS), 2);
  assert.equal(trackRecordKey(TRACKS[0], 'easy', 'time'), 'rookie:easy:time');
});
for (const difficulty of ['easy', 'advanced', 'pro']) {
  test(`six-car field completes three laps on revised layouts: ${difficulty}`, () => {
    for (const proposal of proposals) {
      const track = makeTrack(TRACKS.find((d) => d.id === proposal.id));
      const cars = Array.from({ length: 6 }, (_, i) => createCar(track, i));
      for (let step = 0; step < 120 * 600 && cars.some((c) => !c.finished); step++) {
        for (const [i, c] of cars.entries()) {
          if (c.finished) continue;
          stepCar(c, aiInput(c, track, difficulty, i), track, difficulty);
          if (c.total >= track.length * 3) {
            c.finished = true;
            c.finishTime = step * STEP;
          }
        }
        for (let i = 0; i < cars.length; i++)
          for (let j = i + 1; j < cars.length; j++)
            if (!cars[i].finished && !cars[j].finished) collide(cars[i], cars[j], difficulty);
      }
      for (const [i, c] of cars.entries()) {
        assert(
          c.finished,
          `${proposal.id} car ${i}: ${c.total.toFixed(0)}/${(track.length * 3).toFixed(0)}, damage ${c.damage}`,
        );
        assert(c.damage < 10, `${proposal.id} car ${i}: damage ${c.damage}`);
        assert.equal(c.resetCount, 0);
      }
      console.log(
        `${proposal.id} ${difficulty}: six finishers, max damage ${Math.max(...cars.map((c) => c.damage)).toFixed(2)}, last ${Math.max(...cars.map((c) => c.finishTime)).toFixed(1)}s`,
      );
    }
  });
}
