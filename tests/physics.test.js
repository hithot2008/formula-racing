import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACKS, makeTrack } from '../src/tracks.js';
import { createCar, stepCar, aiInput, resetCar, collide, STEP } from '../src/physics.js';
const track = makeTrack(TRACKS[0]);
test('all eight closed tracks have finite geometry and continuous start', () => {
  for (const d of TRACKS) {
    const t = makeTrack(d);
    assert(t.length > 600);
    assert(Math.hypot(t.at(0).x - t.at(t.length).x, t.at(0).z - t.at(t.length).z) < 0.001);
    assert(t.samples.every((p) => Number.isFinite(p.heading)));
  }
});
test('throttle accelerates and brakes stop without reversing', () => {
  const c = createCar(track);
  for (let i = 0; i < 240; i++) stepCar(c, { throttle: 1 }, track, 'easy');
  assert(c.speed > 15);
  for (let i = 0; i < 500; i++) stepCar(c, { brake: 1 }, track, 'easy');
  assert(c.speed < 0.1);
});
test('wet road extends the assisted stopping distance', () => {
  function run(weather) {
    const t = { ...track, weather },
      c = createCar(t);
    c.vx = Math.sin(c.heading) * 25;
    c.vz = Math.cos(c.heading) * 25;
    const x = c.x,
      z = c.z;
    for (let i = 0; i < 600; i++) stepCar(c, { brake: 1 }, t, 'easy');
    return Math.hypot(c.x - x, c.z - z);
  }
  assert(run('rain') > run('clear') * 1.25);
});
test('fixed steps produce the same result across 30 and 60 FPS', () => {
  function run(fps) {
    const c = createCar(track);
    for (let f = 0; f < fps * 2; f++)
      for (let s = 0; s < 120 / fps; s++)
        stepCar(c, { throttle: 1, steer: 0.02 }, track, 'easy', STEP);
    return c;
  }
  const a = run(30),
    b = run(60);
  assert.equal(a.x, b.x);
  assert.equal(a.speed, b.speed);
});
test('reset invalidates lap, clears velocity, preserves progress and adds penalty', () => {
  const c = createCar(track);
  c.vx = 10;
  const total = c.total;
  resetCar(c, track);
  assert.equal(c.total, total);
  assert.equal(c.penalty, 5);
  assert.equal(c.lapValid, false);
  assert.equal(c.vx, 0);
});
test('collision separates overlapping cars and reduces closing speed', () => {
  const a = createCar(track),
    b = createCar(track);
  b.x = a.x + 1;
  b.z = a.z;
  a.vx = 10;
  b.vx = 0;
  assert(collide(a, b, 'pro'));
  assert(Math.hypot(a.x - b.x, a.z - b.z) > 2.24);
  assert(a.vx < 10);
  assert(a.damage > 0);
});
test('AI completes every circuit without wall damage', () => {
  for (const def of TRACKS) {
    const t = makeTrack(def),
      c = createCar(t);
    for (let i = 0; i < 120 * 180 && c.total < t.length; i++)
      stepCar(c, aiInput(c, t, 'advanced'), t, 'advanced');
    assert(c.total >= t.length, `${def.id}: only ${c.total.toFixed(0)} / ${t.length.toFixed(0)}`);
    assert(c.damage < 10, `${def.id}: damage ${c.damage}`);
  }
});
