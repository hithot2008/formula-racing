import './style.css';
import { TRACKS, makeTrack, clamp } from './tracks.js';
import { STEP, DIFFICULTIES, createCar, stepCar, aiInput, collide, resetCar } from './physics.js';
import { RaceScene } from './scene.js';
import { EngineAudio } from './audio.js';
const $ = (id) => document.getElementById(id),
  show = (id, visible) => $(id).classList.toggle('hidden', !visible);
const STORE = 'formula-racing-v1',
  colors = [0xda4e37, 0x48b8b1, 0x6e99de, 0xd5ba63, 0xe6e4d5, 0x9c7cd3],
  names = ['YOU / 車手 01', 'M. COSTA', 'A. HAYASHI', 'L. WEBER', 'S. MOREAU', 'N. SILVA'];
let save = { records: {}, settings: {} };
try {
  const data = JSON.parse(localStorage.getItem(STORE));
  if (data && typeof data.records === 'object' && data.records && !Array.isArray(data.records))
    save = { records: data.records, settings: data.settings || {} };
} catch {}
function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(save));
  } catch {
    notify('無法寫入本機紀錄；本場仍可繼續。', 6);
  }
}
const format = (t) =>
  Number.isFinite(t) ? `${Math.floor(t / 60)}:${(t % 60).toFixed(3).padStart(6, '0')}` : '—';
let view,
  track,
  cars = [],
  selected = 0,
  state = 'menu',
  elapsed = 0,
  countdown = 5,
  totalLaps = 3,
  difficulty = 'easy',
  mode = 'race',
  accumulator = 0,
  noticeUntil = 0,
  notice = '',
  lastHud = 0,
  collisionUntil = 0;
let devDriver = false,
  lapTrace = [],
  bestTrace = null,
  ghostTrace = null,
  ghostIndex = 0;
const keys = new Set(),
  audio = new EngineAudio();
function recordKey() {
  return `${track.id}:${$('difficulty').value}:${$('mode').value}`;
}
function trackSvg(t) {
  const xs = t.samples.map((p) => p.x),
    zs = t.samples.map((p) => p.z),
    minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minZ = Math.min(...zs),
    maxZ = Math.max(...zs),
    scale = 65 / Math.max(maxX - minX, maxZ - minZ);
  return `<svg viewBox="0 0 85 70" aria-hidden="true"><path d="${t.samples
    .filter((_, i) => i % 8 === 0)
    .map((p, i) => `${i ? 'L' : 'M'}${10 + (p.x - minX) * scale},${3 + (p.z - minZ) * scale}`)
    .join(
      ' ',
    )}Z" fill="none" stroke="${t.color}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
}
const tracks = TRACKS.map(makeTrack);
function updateSetup() {
  const t = track;
  $('trackName').textContent = t.name;
  $('trackMeta').textContent = `${t.region} / ${(t.length / 1000).toFixed(2)} KM / ${t.tag}`;
  const hints = {
    race: '與 5 名對手爭奪頒獎台。完成 3 圈，以名次獲得獎章。',
    time: '完成 2 圈，追逐最佳單圈。離開賽道或回正將使該圈無效。',
    academy: '完成 1 圈：保持在白線內、不回正，並將車損控制在 5% 以下。',
  };
  $('modeHint').textContent = hints[$('mode').value];
  const r = save.records[recordKey()];
  $('record').textContent = `個人紀錄 ${format(r?.best)}`;
  $('medalCount').textContent = String(
    Object.values(save.records).filter((r) => r?.medal > 0).length,
  ).padStart(2, '0');
  save.settings = {
    difficulty: $('difficulty').value,
    mode: $('mode').value,
    sound: $('sound').checked,
    track: selected,
  };
  persist();
}
function selectTrack(i) {
  selected = i;
  track = tracks[i];
  view.build(track);
  cars = [createCar(track, 0)];
  view.addCars([colors[0]]);
  document.querySelectorAll('.track-card').forEach((b, j) => {
    b.classList.toggle('selected', j === i);
    b.setAttribute('aria-pressed', String(j === i));
  });
  show('rain', track.weather === 'rain');
  updateSetup();
}
function notify(text, seconds = 3) {
  notice = text;
  noticeUntil = elapsed + seconds;
  $('message').textContent = text;
}
function startRace() {
  difficulty = $('difficulty').value;
  mode = $('mode').value;
  totalLaps = mode === 'race' ? 3 : mode === 'time' ? 2 : 1;
  cars = Array.from({ length: mode === 'race' ? 6 : 1 }, (_, i) => createCar(track, i));
  view.build(track);
  view.addCars(colors.slice(0, cars.length));
  view.line.visible = difficulty !== 'pro';
  lapTrace = [];
  bestTrace = null;
  ghostTrace = mode === 'time' ? save.records[recordKey()]?.ghost : null;
  ghostIndex = 0;
  if (Array.isArray(ghostTrace) && ghostTrace.length > 1) view.addGhost();
  else ghostTrace = null;
  state = 'countdown';
  elapsed = 0;
  countdown = 5;
  accumulator = 0;
  lastHud = 0;
  notice = '';
  noticeUntil = 0;
  collisionUntil = 0;
  keys.clear();
  show('menu', false);
  show('hud', true);
  show('overlay', false);
  show('lights', true);
  $('raceTrack').textContent = track.en;
  $('weatherLabel').textContent = {
    clear: '晴朗 · 乾地',
    overcast: '陰天 · 乾地',
    sunset: '黃昏 · 高溫',
    rain: '雨天 · 濕地',
    night: '夜間 · 乾地',
  }[track.weather];
  $('lights').innerHTML = '<i></i>'.repeat(5);
  audio.enabled = $('sound').checked;
  audio.start();
  updateHud();
}
function sorted() {
  return cars
    .map((c, i) => ({ c, i }))
    .sort((a, b) =>
      a.c.finished && b.c.finished
        ? a.c.finishTime - b.c.finishTime
        : a.c.finished
          ? -1
          : b.c.finished
            ? 1
            : b.c.total - a.c.total,
    );
}
function finish() {
  state = 'results';
  keys.clear();
  audio.update(0, 0, false);
  const p = cars[0],
    rank = sorted().findIndex((r) => r.i === 0) + 1;
  let medal =
    mode === 'race'
      ? rank === 1
        ? 3
        : rank <= 3
          ? 2
          : 1
      : mode === 'academy'
        ? p.lapValid && p.damage < 5 && p.resetCount === 0
          ? 3
          : 0
        : Number.isFinite(p.bestLap)
          ? p.bestLap < track.length / 22
            ? 3
            : p.bestLap < track.length / 17
              ? 2
              : 1
          : 0;
  const key = recordKey(),
    old = save.records[key] || {},
    best = Number.isFinite(old.best) ? old.best : Infinity;
  save.records[key] = {
    medal: Math.max(Number(old.medal) || 0, medal),
    best: Number.isFinite(p.bestLap)
      ? Math.min(best, p.bestLap)
      : Number.isFinite(best)
        ? best
        : null,
    completed: (Number(old.completed) || 0) + 1,
    ghost: bestTrace && p.bestLap < best ? bestTrace : old.ghost || null,
  };
  persist();
  const resultMedal = ['挑戰未達成', '銅牌完賽', '銀牌表現', '金牌達成'][medal];
  $('overlayEyebrow').textContent = 'CHEQUERED FLAG';
  $('overlayTitle').textContent = mode === 'race' ? `第 ${rank} 名 · 完賽` : '挑戰完成';
  $('overlayBody').innerHTML =
    `<div class="result-medal">${resultMedal}</div><dl><dt>賽道</dt><dd>${track.name}</dd><dt>駕駛難度</dt><dd>${DIFFICULTIES[difficulty].name}</dd><dt>總時間</dt><dd>${format(elapsed)}</dd><dt>最佳有效單圈</dt><dd>${format(p.bestLap)}</dd><dt>回正罰停（已計入）</dt><dd>+${p.penalty} 秒</dd><dt>車輛損傷</dt><dd>${p.damage.toFixed(1)}%</dd></dl><p>${medal ? '獎章與有效圈速已保存在這台裝置。' : '下次嘗試保持在白線內、避免碰撞與回正。'}${mode === 'race' ? ' 名次依抵達終點順序；回正會另外停車 5 秒。' : ''}</p>`;
  $('overlayActions').innerHTML =
    '<button class="primary" id="again">再次挑戰 ↗</button><button class="secondary" id="back">返回賽道選單</button>';
  $('again').onclick = startRace;
  $('back').onclick = backMenu;
  show('overlay', true);
}
function backMenu() {
  state = 'menu';
  keys.clear();
  show('hud', false);
  show('overlay', false);
  show('menu', true);
  show('lights', false);
  selectTrack(selected);
}
function pause() {
  if (state !== 'racing' && state !== 'countdown') return;
  const previous = state;
  state = 'paused';
  keys.clear();
  audio.update(0, 0, false);
  $('overlayEyebrow').textContent = 'RACE CONTROL';
  $('overlayTitle').textContent = '暫停，調整呼吸。';
  $('overlayBody').innerHTML =
    '<p>W / ↑ 油門 · S / ↓ 煞車<br>A D / ← → 轉向 · Space 能源加速<br>C 切換鏡頭 · R 回正（停車 5 秒）<br>P 維修：起終點後右側綠色區域，停穩後按下<br>支援標準手把：左搖桿轉向、RT 油門、LT 煞車、A 加速。</p>';
  $('overlayActions').innerHTML =
    '<button class="primary" id="resume">繼續比賽 ↗</button><button class="secondary" id="restart">重新起跑</button><button class="secondary" id="back">返回選單</button>';
  $('resume').onclick = () => {
    state = previous;
    show('overlay', false);
  };
  $('restart').onclick = startRace;
  $('back').onclick = backMenu;
  show('overlay', true);
}
function repair() {
  if (state !== 'racing') return;
  const p = cars[0],
    near = track.nearest(p.x, p.z);
  if (p.speed < 2 && p.s > 14 && p.s < 34 && near.lateral > track.width / 2 - 4) {
    p.pit = 5;
    notify('維修中 · 換胎、修復與補充能源', 5);
  } else notify('駛入起終點後右側綠色維修格，停穩後按 P。', 4);
}
function input() {
  let steer =
      (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
      (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0),
    throttle = keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0,
    brake = keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0,
    boost = keys.has('Space');
  const gp = Array.from(navigator.getGamepads?.() || []).find((g) => g?.mapping === 'standard');
  if (gp) {
    if (Math.abs(gp.axes[0]) > 0.12) steer = gp.axes[0];
    throttle = Math.max(throttle, gp.buttons[7]?.value || 0);
    brake = Math.max(brake, gp.buttons[6]?.value || 0);
    boost = boost || gp.buttons[0]?.pressed;
  }
  return { steer, throttle, brake, boost };
}
function tick(dt) {
  if (state === 'countdown') {
    countdown -= dt;
    Array.from($('lights').children).forEach((n, i) => n.classList.toggle('on', countdown < 5 - i));
    if (countdown <= 0) {
      state = 'racing';
      show('lights', false);
      notify('綠燈！找到你的煞車點。', 3);
    }
    return;
  }
  if (state !== 'racing') return;
  elapsed += dt;
  cars.forEach((c, i) => {
    if (c.finished) return;
    if (c.pit > 0) {
      c.pit -= dt;
      c.vx = c.vz = c.speed = 0;
      if (c.pit <= 0) {
        c.wear = 0;
        c.damage = 0;
        c.energy = 100;
        c.pits++;
        if (i === 0) notify('維修完成，安全返回賽道。');
      }
      return;
    }
    if (c.resetWait > 0) {
      c.resetWait -= dt;
      c.vx = c.vz = c.speed = 0;
      return;
    }
    stepCar(
      c,
      i === 0 && !devDriver ? input() : aiInput(c, track, difficulty, i),
      track,
      difficulty,
      dt,
    );
    if (
      i === 0 &&
      (!lapTrace.length || elapsed - c.lapStart - lapTrace[lapTrace.length - 1][0] >= 0.15)
    )
      lapTrace.push([elapsed - c.lapStart, c.x, c.z, c.heading]);
    const laps = Math.max(0, Math.floor(c.total / track.length));
    if (laps > c.lap) {
      const lapTime = elapsed - c.lapStart;
      c.lastLap = lapTime;
      if (c.lapValid) {
        if (i === 0 && lapTime < c.bestLap) bestTrace = lapTrace;
        c.bestLap = Math.min(c.bestLap, lapTime);
      }
      c.lap = laps;
      c.lapStart = elapsed;
      if (i === 0) {
        lapTrace = [];
        ghostIndex = 0;
      }
      if (laps >= totalLaps) {
        c.finished = true;
        c.finishTime = elapsed;
      } else {
        if (i === 0)
          notify(
            c.lapValid ? `完成第 ${laps} 圈 · ${format(lapTime)}` : '本圈離開賽道，圈速無效。',
            3,
          );
        c.lapValid = true;
      }
    }
  });
  for (let i = 0; i < cars.length; i++)
    for (let j = i + 1; j < cars.length; j++)
      if (
        !cars[i].finished &&
        !cars[j].finished &&
        collide(cars[i], cars[j], difficulty) &&
        i === 0
      )
        collisionUntil = elapsed + 1.5;
  if (ghostTrace) {
    const time = elapsed - cars[0].lapStart;
    while (ghostIndex < ghostTrace.length - 1 && ghostTrace[ghostIndex + 1][0] <= time)
      ghostIndex++;
    view.setGhost(time <= ghostTrace[ghostTrace.length - 1][0] ? ghostTrace[ghostIndex] : null);
  }
  if (cars[0].finished) finish();
}
function updateHud() {
  const p = cars[0];
  if (!p) return;
  $('speed').textContent = Math.round(p.speed * 3.6);
  const gear = p.speed < 0.7 ? 'N' : Math.min(8, Math.floor(p.speed / 11) + 1);
  $('gear').textContent = gear;
  $('lapLabel').textContent = `LAP ${Math.min(totalLaps, p.lap + 1)} / ${totalLaps}`;
  $('lapTime').textContent = format(elapsed - p.lapStart);
  $('bestTime').textContent = format(p.bestLap);
  $('energy').textContent = `${Math.round(p.energy)}%`;
  $('tyre').textContent = `${Math.round(100 - p.wear)}%`;
  $('damage').textContent = `${Math.round(p.damage)}%`;
  $('energyBar').style.width = `${p.energy}%`;
  $('throttleBar').style.width = `${p.throttle * 100}%`;
  $('brakeBar').style.width = `${p.brake * 100}%`;
  Array.from($('rpm').children).forEach((e, i) => {
    e.className = (p.speed % 11) / 11 > i / 12 ? 'lit' + (i > 8 ? ' hot' : '') : '';
  });
  $('positions').innerHTML = sorted()
    .map(
      ({ c, i }, r) =>
        `<div class="position-row ${i === 0 ? 'player' : ''}"><span>${r + 1}</span><i style="background:#${colors[i].toString(16).padStart(6, '0')}"></i><span class="driver">${names[i]}</span><span class="gap">${i === 0 ? 'YOU' : c.finished ? 'FIN' : `${Math.round(c.total - p.total)} m`}</span></div>`,
    )
    .join('');
  $('message').textContent =
    p.resetWait > 0
      ? `回正罰停 · ${Math.ceil(p.resetWait)} 秒`
      : p.pit > 0
        ? `維修中 · ${Math.ceil(p.pit)} 秒`
        : elapsed < noticeUntil
          ? notice
          : p.offroad
            ? '超出白線 · 本圈圈速無效'
            : elapsed < collisionUntil
              ? '黃旗 · 注意碰撞'
              : p.damage > 60
                ? '車損嚴重，請返回維修區'
                : p.slip > 7
                  ? '抓地不足 · 收油並減少轉向'
                  : '';
  drawMap();
}
function drawMap() {
  const canvas = $('minimap'),
    ctx = canvas.getContext('2d'),
    samples = track.samples,
    minX = Math.min(...samples.map((p) => p.x)),
    maxX = Math.max(...samples.map((p) => p.x)),
    minZ = Math.min(...samples.map((p) => p.z)),
    maxZ = Math.max(...samples.map((p) => p.z)),
    scale = Math.min(165 / (maxX - minX), 125 / (maxZ - minZ));
  const point = (p) => [
    100 + (p.x - (maxX + minX) / 2) * scale,
    80 + (p.z - (maxZ + minZ) / 2) * scale,
  ];
  ctx.clearRect(0, 0, 200, 160);
  ctx.beginPath();
  samples.forEach((p, i) => {
    const [x, y] = point(p);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.strokeStyle = '#a2b2ac';
  ctx.lineWidth = 4;
  ctx.stroke();
  cars.forEach((c, i) => {
    const [x, y] = point(c);
    ctx.beginPath();
    ctx.arc(x, y, i === 0 ? 4 : 2.8, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#d5ef77' : `#${colors[i].toString(16)}`;
    ctx.fill();
  });
}
$('start').onclick = startRace;
$('difficulty').onchange = updateSetup;
$('mode').onchange = updateSetup;
$('sound').onchange = () => {
  audio.enabled = $('sound').checked;
  updateSetup();
};
$('pauseBtn').onclick = pause;
$('cameraBtn').onclick = () => (view.cameraMode = (view.cameraMode + 1) % 3);
$('help').onclick = () => {
  $('overlayEyebrow').textContent = 'DRIVER HANDBOOK';
  $('overlayTitle').textContent = '你的第一圈，從這裡開始。';
  $('overlayBody').innerHTML =
    '<p>油門：W / ↑　煞車：S / ↓<br>轉向：A D / ← →　能源加速：Space<br>鏡頭：C　暫停：Esc　回正：R（停車 5 秒）<br>維修：P（在起終點後右側綠色格停穩）</p><p>入彎前先煞車，彎中少踩油門，車頭轉正後再加速。容易模式提供循跡與煞車輔助；專業模式需要更細膩的操控。綠色虛線是路線參考，並非煞車提示。</p><p>標準手把：左搖桿轉向、RT 油門、LT 煞車、A 加速。<br>紀錄依賽道、模式與難度分開保存在此瀏覽器。清除瀏覽資料會移除紀錄。<br>計時金牌：平均速度超過 79.2 km/h；銀牌：超過 61.2 km/h；銅牌：完成有效單圈。</p>';
  $('overlayActions').innerHTML = '<button class="primary" id="closeHelp">準備好了 ↗</button>';
  $('closeHelp').onclick = () => show('overlay', false);
  show('overlay', true);
};
window.addEventListener('keydown', (e) => {
  if (['INPUT', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName) && state === 'menu')
    return;
  if (
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) &&
    state !== 'menu'
  )
    e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'Escape') {
    if (state === 'paused') $('resume')?.click();
    else pause();
    return;
  }
  if (state === 'racing') {
    if (e.code === 'KeyC') view.cameraMode = (view.cameraMode + 1) % 3;
    if (e.code === 'KeyR' && !cars[0].resetWait && !cars[0].pit) {
      resetCar(cars[0], track);
      cars[0].resetWait = 5;
      notify('已回正 · 罰停 5 秒');
    }
    if (e.code === 'KeyP') repair();
  }
  keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => {
  keys.clear();
  pause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    keys.clear();
    pause();
  }
});
for (const b of document.querySelectorAll('[data-key]')) {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    keys.add(b.dataset.key);
  };
  b.onpointerup = b.onpointercancel = () => keys.delete(b.dataset.key);
}
try {
  view = new RaceScene($('world'));
  $('tracks').innerHTML = tracks
    .map(
      (t, i) =>
        `<button class="track-card" data-track="${i}" aria-label="選擇${t.name}" aria-pressed="false"><span class="number">${String(i + 1).padStart(2, '0')} / ${t.weather === 'rain' ? 'WET' : t.weather === 'night' ? 'NIGHT' : 'DRY'}</span>${trackSvg(t)}<h3>${t.name}</h3><p>${t.en}</p><span class="tag">${t.tag}</span></button>`,
    )
    .join('');
  document
    .querySelectorAll('[data-track]')
    .forEach((b) => (b.onclick = () => selectTrack(Number(b.dataset.track))));
  if (DIFFICULTIES[save.settings.difficulty]) $('difficulty').value = save.settings.difficulty;
  if (['race', 'time', 'academy'].includes(save.settings.mode))
    $('mode').value = save.settings.mode;
  $('sound').checked = save.settings.sound !== false;
  $('rpm').innerHTML = '<i></i>'.repeat(12);
  selectTrack(clamp(Number(save.settings.track) || 0, 0, 7));
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (state === 'racing' || state === 'countdown') {
      accumulator += dt;
      while (accumulator >= STEP) {
        tick(STEP);
        accumulator -= STEP;
      }
    } else accumulator = 0;
    view.update(cars, dt, state === 'menu');
    audio.update(cars[0].speed, cars[0].throttle, state === 'racing');
    if (now - lastHud > 100 && state !== 'menu') {
      updateHud();
      lastHud = now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Read-only diagnostics for verification and performance inspection.
  window.racing = {
    snapshot: () => ({
      state,
      track: track.id,
      elapsed,
      mode,
      difficulty,
      totalLaps,
      cars: cars.map((c) => ({ ...c })),
      renderer: view.renderer.info.render,
    }),
  };
  if (import.meta.env.DEV)
    window.racing.verify = {
      advance: (seconds, autodrive = false) => {
        devDriver = autodrive;
        for (let i = 0; i < Math.min(seconds, 600) / STEP; i++) tick(STEP);
        devDriver = false;
        updateHud();
        return window.racing.snapshot();
      },
    };
} catch (error) {
  $('fatal').textContent =
    `無法啟動 3D 畫面。請使用支援 WebGL 的瀏覽器並開啟硬體加速。${error.message}`;
  show('fatal', true);
  console.error(error);
}
