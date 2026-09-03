import { angle, clamp } from './tracks.js';
export const DIFFICULTIES = {
  easy: { name: '容易', assist: 1, ai: 0.69, damage: 0.25 },
  advanced: { name: '進階', assist: 0.45, ai: 0.84, damage: 0.65 },
  pro: { name: '專業', assist: 0, ai: 0.97, damage: 1 },
};
export const STEP = 1 / 120;
export function createCar(track, index = 0) {
  const s = -12 - index * 8,
    p = track.at(s),
    lane = index % 2 ? 2.6 : -2.6;
  return {
    x: p.x + p.tz * lane,
    z: p.z - p.tx * lane,
    heading: p.heading,
    vx: 0,
    vz: 0,
    speed: 0,
    yaw: 0,
    steer: 0,
    s: (s + track.length) % track.length,
    total: s,
    lap: 0,
    lapStart: 0,
    lastLap: 0,
    bestLap: Infinity,
    lapValid: true,
    wear: 0,
    temp: 78,
    energy: 100,
    damage: 0,
    offroad: false,
    slip: 0,
    finished: false,
    finishTime: null,
    pit: 0,
    pits: 0,
    penalty: 0,
    resetCount: 0,
    throttle: 0,
    brake: 0,
  };
}
export function stepCar(car, input, track, difficulty, dt = STEP) {
  const d = DIFFICULTIES[difficulty],
    road = track.nearest(car.x, car.z);
  car.offroad = road.distance > track.width / 2;
  const sin = Math.sin(car.heading),
    cos = Math.cos(car.heading);
  let forward = car.vx * sin + car.vz * cos,
    side = car.vx * cos - car.vz * sin;
  const throttle = clamp(input.throttle || 0, 0, 1),
    brake = clamp(input.brake || 0, 0, 1);
  car.throttle = throttle;
  car.brake = brake;
  const wet = track.weather === 'rain' ? 0.65 : 1;
  const grip =
    (11.5 + Math.min(12, forward * forward * 0.0025)) *
    wet *
    (1 - car.wear * 0.003) *
    (car.offroad ? 0.38 : 1);
  const maxSteer = 0.48 / (1 + Math.abs(forward) * 0.037);
  car.steer +=
    (clamp(input.steer || 0, -1, 1) * maxSteer - car.steer) * Math.min(1, dt * (5 + 5 * d.assist));
  let desired = (forward / 3.2) * Math.tan(car.steer);
  if (d.assist > 0)
    desired = clamp(
      desired,
      (-grip / Math.max(9, Math.abs(forward))) * (1.15 - d.assist * 0.1),
      (grip / Math.max(9, Math.abs(forward))) * (1.15 - d.assist * 0.1),
    );
  car.yaw += (desired - car.yaw) * Math.min(1, dt * 4);
  const boost = input.boost && car.energy > 0 && throttle > 0.1;
  let drive =
    throttle *
    (18 / (1 + Math.abs(forward) * 0.026)) *
    (1 - car.damage * 0.005) *
    (boost ? 1.4 : 1);
  const braking = brake * (d.assist > 0.5 ? grip : 20);
  const lock = brake > 0.9 && d.assist < 0.5 && Math.abs(forward) > 12;
  if (d.assist > 0.5) drive = Math.min(drive, grip);
  const drag = 0.00145 * forward * Math.abs(forward) + forward * (car.offroad ? 0.8 : 0.025);
  forward += (drive - drag - Math.sign(forward || 1) * braking) * dt;
  if (forward < 0) forward = 0;
  const lateralAcceleration = clamp(-side * (lock ? 1.8 : 5 + d.assist * 5), -grip, grip);
  side += lateralAcceleration * dt;
  car.vx = sin * forward + cos * side;
  car.vz = cos * forward - sin * side;
  car.heading = angle(car.heading + car.yaw * dt);
  car.x += car.vx * dt;
  car.z += car.vz * dt;
  car.speed = Math.hypot(car.vx, car.vz);
  car.slip = Math.abs(side) + Math.max(0, Math.abs(car.yaw * forward) - grip);
  car.energy = clamp(car.energy + (boost ? -9 : brake * 5 + 0.45) * dt, 0, 100);
  car.wear = clamp(
    car.wear + (0.014 + car.slip * 0.012) * (track.id === 'desert' ? 1.65 : 1) * dt,
    0,
    100,
  );
  car.temp += (70 + throttle * 20 + brake * 30 + car.slip * 3 - car.temp) * dt * 0.06;
  const after = track.nearest(car.x, car.z);
  let delta = after.s - car.s;
  if (delta > track.length / 2) delta -= track.length;
  if (delta < -track.length / 2) delta += track.length;
  if (Math.abs(delta) < 15 && after.distance < track.width * 0.75) car.total += delta;
  car.s = after.s;
  if (car.offroad) car.lapValid = false;
  if (after.distance > track.width / 2 + 5) {
    const sign = Math.sign(after.lateral),
      edge = track.width / 2 + 4.8;
    car.x = after.x + after.tz * edge * sign;
    car.z = after.z - after.tx * edge * sign;
    const impact = Math.abs(car.vx * after.tz - car.vz * after.tx);
    car.damage = clamp(car.damage + impact * d.damage * 0.6, 0, 100);
    car.vx *= 0.8;
    car.vz *= 0.8;
  }
}
export function aiInput(car, track, difficulty, index = 0) {
  const look = 11 + car.speed * 0.55,
    target = track.at(car.s + look);
  const lane = (index % 2 ? 1 : -1) * 1.5;
  const heading = Math.atan2(
    target.x + target.tz * lane - car.x,
    target.z - target.tx * lane - car.z,
  );
  let curvature = 0.004;
  for (let n = 0; n < 7; n++)
    curvature = Math.max(curvature, Math.abs(track.curvature(car.s + n * (5 + car.speed * 0.1))));
  const grip = track.weather === 'rain' ? 8 : 14;
  const targetSpeed = clamp(Math.sqrt(grip / curvature), 12, 64) * DIFFICULTIES[difficulty].ai;
  return {
    steer: clamp(angle(heading - car.heading) * 3, -1, 1),
    throttle: car.speed < targetSpeed ? 1 : 0,
    brake: car.speed > targetSpeed + 1 ? 0.65 : 0,
  };
}
export function collide(a, b, difficulty) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    dist = Math.hypot(dx, dz);
  if (dist >= 2.25 || dist < 0.001) return false;
  const nx = dx / dist,
    nz = dz / dist,
    overlap = (2.25 - dist) / 2;
  a.x -= nx * overlap;
  a.z -= nz * overlap;
  b.x += nx * overlap;
  b.z += nz * overlap;
  const relative = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
  if (relative > 0) {
    const impulse = relative * 0.65;
    a.vx -= nx * impulse;
    a.vz -= nz * impulse;
    b.vx += nx * impulse;
    b.vz += nz * impulse;
    const damage = relative * DIFFICULTIES[difficulty].damage * 0.25;
    a.damage = clamp(a.damage + damage, 0, 100);
    b.damage = clamp(b.damage + damage, 0, 100);
  }
  return true;
}
export function resetCar(car, track) {
  const p = track.at(car.s);
  Object.assign(car, {
    x: p.x,
    z: p.z,
    heading: p.heading,
    vx: 0,
    vz: 0,
    yaw: 0,
    speed: 0,
    steer: 0,
    lapValid: false,
    penalty: car.penalty + 5,
    resetCount: car.resetCount + 1,
  });
}
