// Short original UI cues, independent of engine sound and background music.
export const MENU_CUES = {
  select: [
    [720, 0, 0.065],
    [1080, 0.045, 0.075],
  ],
  change: [
    [540, 0, 0.075],
    [810, 0.04, 0.08],
  ],
  start: [
    [440, 0, 0.1],
    [660, 0.065, 0.12],
    [880, 0.13, 0.16],
  ],
};
export function scheduleCue(ctx, output, kind, when, register = () => {}) {
  for (const [frequency, offset, duration] of MENU_CUES[kind] || MENU_CUES.select) {
    const osc = ctx.createOscillator(),
      gain = ctx.createGain(),
      time = when + offset;
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.075, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(output);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    register(osc);
    osc.start(time);
    osc.stop(time + duration + 0.01);
  }
}
export class MenuAudio {
  constructor() {
    this.enabled = true;
    this.nodes = new Set();
    this.played = 0;
    this.kind = null;
    this.generation = 0;
    this.last = -Infinity;
  }
  stop() {
    this.generation++;
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {}
    }
    this.nodes.clear();
  }
  async play(kind) {
    if (!this.enabled || document.hidden || performance.now() - this.last < 60) return;
    this.last = performance.now();
    const generation = this.generation;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.ctx.destination);
      }
      await this.ctx.resume();
      if (
        !this.enabled ||
        document.hidden ||
        generation !== this.generation ||
        this.ctx.state !== 'running'
      )
        return;
      // At most one cue at a time; rapid changes cannot stack their volume.
      for (const node of this.nodes) {
        try {
          node.stop();
        } catch {}
      }
      this.nodes.clear();
      scheduleCue(this.ctx, this.analyser, kind, this.ctx.currentTime + 0.012, (node) => {
        this.nodes.add(node);
        node.addEventListener('ended', () => this.nodes.delete(node));
      });
      this.kind = kind;
      this.played++;
    } catch {
      /* Unsupported or blocked audio never prevents menu interaction. */
    }
  }
  snapshot() {
    return {
      enabled: this.enabled,
      played: this.played,
      kind: this.kind,
      activeNodes: this.nodes.size,
      context: this.ctx?.state || 'uninitialized',
    };
  }
}
