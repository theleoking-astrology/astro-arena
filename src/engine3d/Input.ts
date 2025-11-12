// src/engine3d/Input.ts
export interface InputSnapshot {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  sprint: boolean;
  fire: boolean;
  aim: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const dead = (v: number, d = 0.15) => Math.abs(v) < d ? 0 : v;

export class Input {
  private keys = new Set<string>();
  private look = { x: 0, y: 0 };
  private gamepadIndex = -1;
  private firing = false;
  private aiming = false;
  private sprinting = false;

  private mobile = {
    enabled: false,
    leftId: -1,
    rightId: -1,
    leftStart: { x: 0, y: 0 },
    rightStart: { x: 0, y: 0 },
    leftVec: { x: 0, y: 0 },
    rightVec: { x: 0, y: 0 }
  };

  constructor(root: HTMLElement) {
    window.addEventListener('keydown', e => this.keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    root.addEventListener('mousemove', e => {
      if (document.pointerLockElement === root) {
        this.look.x += e.movementX * 0.0025;
        this.look.y += e.movementY * 0.0025;
      }
    });
    root.addEventListener('mousedown', e => {
      if (e.button === 2) {
        root.requestPointerLock();
      } else if (e.button === 0) {
        this.firing = true;
      }
    });
    window.addEventListener('mouseup', e => {
      if (e.button === 0) this.firing = false;
    });

    // Mobile touch joystick
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      this.mobile.enabled = true;
      root.addEventListener('touchstart', this.onTouchStart, { passive: false });
      root.addEventListener('touchmove', this.onTouchMove, { passive: false });
      root.addEventListener('touchend', this.onTouchEnd, { passive: false });
    }

    window.addEventListener('gamepadconnected', (e: any) => this.gamepadIndex = e.gamepad.index);
    window.addEventListener('gamepaddisconnected', () => this.gamepadIndex = -1);
  }

  private onTouchStart = (e: TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      const isLeft = t.clientX < window.innerWidth * 0.5;
      if (isLeft && this.mobile.leftId < 0) {
        this.mobile.leftId = t.identifier; this.mobile.leftStart = { x: t.clientX, y: t.clientY };
      } else if (!isLeft && this.mobile.rightId < 0) {
        this.mobile.rightId = t.identifier; this.mobile.rightStart = { x: t.clientX, y: t.clientY };
        this.aiming = true;
      }
    }
  };
  private onTouchMove = (e: TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.mobile.leftId) {
        const dx = t.clientX - this.mobile.leftStart.x;
        const dy = t.clientY - this.mobile.leftStart.y;
        const s = 1 / 60;
        this.mobile.leftVec.x = clamp(dx * s, -1, 1);
        this.mobile.leftVec.y = clamp(dy * s, -1, 1);
      } else if (t.identifier === this.mobile.rightId) {
        const dx = t.clientX - this.mobile.rightStart.x;
        const dy = t.clientY - this.mobile.rightStart.y;
        this.mobile.rightVec.x = clamp(dx * 0.003, -3, 3);
        this.mobile.rightVec.y = clamp(dy * 0.003, -3, 3);
      }
    }
  };
  private onTouchEnd = (e: TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.mobile.leftId) {
        this.mobile.leftId = -1; this.mobile.leftVec = { x: 0, y: 0 };
      } else if (t.identifier === this.mobile.rightId) {
        this.mobile.rightId = -1; this.mobile.rightVec = { x: 0, y: 0 }; this.aiming = false;
      }
    }
  };

  snapshot(): InputSnapshot {
    // Keyboard WASD
    let mx = 0, my = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) my -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) my += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1;
    this.sprinting = this.keys.has('shift');

    // Gamepad
    if (this.gamepadIndex >= 0) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        mx = dead(gp.axes[0] ?? 0);
        my = dead(gp.axes[1] ?? 0);
        this.look.x += (gp.axes[2] ?? 0) * 0.05;
        this.look.y += (gp.axes[3] ?? 0) * 0.05;
        this.firing = (gp.buttons[7]?.pressed || gp.buttons[0]?.pressed) ?? this.firing;
        this.sprinting = (gp.buttons[6]?.pressed || gp.buttons[1]?.pressed) ?? this.sprinting;
      }
    }

    // Mobile blend
    if (this.mobile.enabled) {
      mx = this.mobile.leftVec.x;
      my = this.mobile.leftVec.y;
      this.look.x += this.mobile.rightVec.x;
      this.look.y += this.mobile.rightVec.y;
    }

    const snap: InputSnapshot = {
      moveX: clamp(mx, -1, 1),
      moveY: clamp(my, -1, 1),
      lookX: this.look.x,
      lookY: this.look.y,
      sprint: this.sprinting,
      fire: this.firing,
      aim: this.aiming
    };

    // decay look so deltas don't accumulate infinitely
    this.look.x *= 0.6;
    this.look.y *= 0.6;
    return snap;
  }
}

