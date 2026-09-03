export class EngineAudio {
  constructor() {
    this.enabled = true;
  }
  start() {
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0;
        this.gain.connect(this.ctx.destination);
        this.osc = this.ctx.createOscillator();
        this.osc.type = 'sawtooth';
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 650;
        this.osc.connect(this.filter);
        this.filter.connect(this.gain);
        this.osc.start();
      }
      this.ctx.resume();
    } catch {
      this.enabled = false;
    }
  }
  update(speed, throttle, playing) {
    if (!this.ctx) return;
    const gear = Math.max(1, Math.min(8, Math.floor(speed / 11) + 1));
    const rev = 100 + (speed / gear) * 21 + throttle * 30;
    this.osc.frequency.setTargetAtTime(rev, this.ctx.currentTime, 0.05);
    this.gain.gain.setTargetAtTime(
      this.enabled && playing ? 0.012 + throttle * 0.018 : 0,
      this.ctx.currentTime,
      0.08,
    );
  }
}
