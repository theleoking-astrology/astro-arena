// src/engine3d/Loop.ts
export class GameLoop {
  private raf = 0;
  private last = 0;
  private acc = 0;
  private readonly step: number;
  private running = false;
  private onFixed: (dt: number) => void;
  private onFrame: (dt: number) => void;
  
  constructor(onFixed: (dt: number) => void, onFrame: (dt: number) => void, hz = 60) {
    this.onFixed = onFixed;
    this.onFrame = onFrame;
    this.step = 1 / hz;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now() / 1000;
    const tick = () => {
      const now = performance.now() / 1000;
      let dt = now - this.last;
      this.last = now;
      this.acc += Math.min(dt, 0.25); // clamp to avoid spiral
      while (this.acc >= this.step) {
        this.onFixed(this.step);
        this.acc -= this.step;
      }
      this.onFrame(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  stop() { cancelAnimationFrame(this.raf); this.running = false; }
}

