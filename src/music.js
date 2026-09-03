// Original, locally synthesized arrangements. No samples, streams or external audio files.
export const MUSIC_TRACKS = [
  {
    id: 'apex',
    name: '極速電音',
    genre: 'Electro House',
    bpm: 128,
    root: 45,
    wave: 'sawtooth',
    progression: [0, 5, 3, 7],
    lead: [12, 19, 15, 19, 12, 22, 19, 15],
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: 2,
  },
  {
    id: 'neon',
    name: '霓虹疾馳',
    genre: 'Synthwave',
    bpm: 110,
    root: 42,
    wave: 'triangle',
    progression: [0, 3, 7, 5],
    lead: [12, 15, 19, 22, 19, 15, 10, 7],
    kick: [0, 8, 10],
    snare: [4, 12],
    hat: 2,
  },
  {
    id: 'redline',
    name: '紅線鼓打',
    genre: 'Drum & Bass',
    bpm: 174,
    root: 40,
    wave: 'square',
    progression: [0, 0, 5, 3],
    lead: [19, 12, 22, 15, 19, 24, 22, 15],
    kick: [0, 6, 10],
    snare: [4, 12],
    hat: 1,
  },
  {
    id: 'tunnel',
    name: '隧道脈衝',
    genre: 'Techno',
    bpm: 138,
    root: 38,
    wave: 'sawtooth',
    progression: [0, 0, 3, 0],
    lead: [0, 12, 7, 12, 3, 15, 7, 10],
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: 1,
  },
  {
    id: 'horizon',
    name: '地平線衝刺',
    genre: 'Trance',
    bpm: 140,
    root: 45,
    wave: 'sawtooth',
    progression: [0, 7, 5, 3],
    lead: [12, 15, 19, 24, 22, 19, 15, 19],
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: 2,
  },
  {
    id: 'grid',
    name: '起跑碎拍',
    genre: 'Breakbeat',
    bpm: 132,
    root: 43,
    wave: 'triangle',
    progression: [0, 5, 0, 7],
    lead: [12, 10, 15, 19, 17, 15, 10, 7],
    kick: [0, 3, 8, 11, 14],
    snare: [4, 12],
    hat: 1,
  },
];
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
export function createNoise(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate),
    data = buffer.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  return buffer;
}
export function scheduleStep(ctx, out, noise, track, step, time, register = () => {}) {
  const beat = 60 / track.bpm,
    slot = step % 16,
    bar = Math.floor(step / 16),
    root = track.root + track.progression[Math.floor(bar / 2) % 4];
  function tone(freq, duration, volume, type = 'sine', cutoff = 1800, endFreq = null) {
    const osc = ctx.createOscillator(),
      gain = ctx.createGain(),
      filter = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration * 0.85);
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    register(osc);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }
  function percussion(duration, volume, cutoff) {
    const src = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    src.buffer = noise;
    filter.type = 'highpass';
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    register(src);
    src.start(time);
    src.stop(time + duration);
  }
  // Eight-bar harmonic progression, with fills every eighth bar and a 32-bar arrangement.
  const section = Math.floor(bar / 8) % 4;
  if (track.kick.includes(slot)) tone(135, 0.24, 0.48, 'sine', 900, 42);
  if (track.snare.includes(slot)) {
    percussion(0.14, 0.15, 1300);
    tone(185, 0.1, 0.09, 'triangle', 1300, 100);
  }
  if (slot % track.hat === 0)
    percussion(slot % 4 === 2 ? 0.1 : 0.035, slot % 4 === 2 ? 0.07 : 0.035, 6500);
  if (bar % 8 === 7 && slot >= 14) percussion(0.065, 0.09, 1800);
  const bassSteps =
    track.id === 'redline'
      ? [0, 3, 6, 8, 11, 14]
      : track.id === 'tunnel'
        ? [2, 6, 10, 14]
        : [0, 2, 6, 8, 10, 14];
  if (bassSteps.includes(slot))
    tone(
      midi(root + (slot === 14 ? 7 : 0)),
      beat * 0.65,
      0.13,
      track.id === 'neon' ? 'triangle' : 'sawtooth',
      500,
    );
  if (slot === 0 && section !== 2)
    for (const interval of [12, 15, 19])
      tone(midi(root + interval), beat * 3.4, 0.028, 'triangle', 1200);
  if ((slot % 2 === 0 || track.id === 'horizon') && section !== 2) {
    const note = track.lead[(Math.floor(slot / 2) + (bar % 2) * 3) % 8];
    tone(midi(root + note), beat * 0.48, 0.048, track.wave, track.id === 'tunnel' ? 850 : 2400);
  }
  if (section === 3 && slot % 4 === 2)
    tone(midi(root + 24 + (track.lead[(slot + bar) % 8] % 12)), beat * 0.8, 0.022, 'sine', 3200);
}
export class BackgroundMusic {
  constructor() {
    this.enabled = true;
    this.volume = 0.35;
    this.trackId = 'apex';
    this.playing = false;
    this.nodes = new Set();
    this.step = 0;
    this.scheduled = 0;
  }
  async unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0;
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.ratio.value = 5;
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.master.connect(this.compressor);
        this.compressor.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        this.noise = createNoise(this.ctx);
      }
      await this.ctx.resume();
      return this.ctx.state === 'running';
    } catch {
      return false;
    }
  }
  select(id) {
    if (!MUSIC_TRACKS.some((t) => t.id === id)) return;
    const resume = this.playing;
    this.setPlaying(false);
    this.trackId = id;
    this.step = 0;
    if (resume) this.setPlaying(true);
  }
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.ctx)
      this.master.gain.setTargetAtTime(this.playing ? this.volume : 0, this.ctx.currentTime, 0.04);
  }
  setPlaying(request) {
    const next = !!(request && this.enabled && this.ctx?.state === 'running');
    if (next === this.playing) return;
    this.playing = next;
    clearInterval(this.timer);
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(next ? this.volume : 0, this.ctx.currentTime, 0.012);
    if (!next) {
      for (const node of this.nodes) {
        try {
          node.stop(this.ctx.currentTime + 0.04);
        } catch {}
      }
      this.nodes.clear();
      return;
    }
    this.nextTime = this.ctx.currentTime + 0.055;
    const pump = () => {
      if (!this.playing) return;
      const track = MUSIC_TRACKS.find((t) => t.id === this.trackId);
      if (this.nextTime < this.ctx.currentTime - 0.1) this.nextTime = this.ctx.currentTime + 0.02;
      while (this.nextTime < this.ctx.currentTime + 0.12) {
        scheduleStep(
          this.ctx,
          this.master,
          this.noise,
          track,
          this.step++,
          this.nextTime,
          (node) => {
            this.nodes.add(node);
            node.addEventListener('ended', () => this.nodes.delete(node));
          },
        );
        this.nextTime += 60 / track.bpm / 4;
        this.scheduled++;
      }
    };
    pump();
    this.timer = setInterval(pump, 25);
  }
  snapshot() {
    const data = new Float32Array(256);
    this.analyser?.getFloatTimeDomainData(data);
    return {
      track: this.trackId,
      playing: this.playing,
      enabled: this.enabled,
      volume: this.volume,
      scheduled: this.scheduled,
      activeNodes: this.nodes.size,
      context: this.ctx?.state || 'uninitialized',
      rms: Math.sqrt(data.reduce((a, b) => a + b * b, 0) / data.length),
    };
  }
}
