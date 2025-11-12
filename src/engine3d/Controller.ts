// src/engine3d/Controller.ts
import { Object3D, Vector3, Raycaster, PerspectiveCamera } from 'three';
import type { InputSnapshot } from './Input';

const tmpV = new Vector3(), right = new Vector3(1, 0, 0);
const UP = new Vector3(0, 1, 0);

export interface TPParams {
  walkSpeed: number;
  sprintSpeed: number;
  accel: number;
  damping: number;
  camDistance: number;
  camHeight: number;
  shoulder: number;
  minPitch: number;
  maxPitch: number;
}

export class ThirdPersonController {
  readonly player: Object3D;
  readonly camera: PerspectiveCamera;
  readonly params: TPParams;

  private vel = new Vector3();
  private yaw = 0;
  private pitch = -0.15;
  private ray = new Raycaster();

  constructor(player: Object3D, camera: PerspectiveCamera, params?: Partial<TPParams>) {
    this.player = player;
    this.camera = camera;
    this.params = {
      walkSpeed: 5,
      sprintSpeed: 8.5,
      accel: 20,
      damping: 10,
      camDistance: 5.5,
      camHeight: 2.0,
      shoulder: 1.2,
      minPitch: -0.9,
      maxPitch:  0.5,
      ...(params || {})
    };
  }

  update(dt: number, input: InputSnapshot) {
    // update yaw/pitch from look input
    this.yaw -= input.lookX * 0.9;
    this.pitch = Math.max(this.params.minPitch, Math.min(this.params.maxPitch, this.pitch - input.lookY * 0.7));

    // camera-space movement vector
    this.camera.getWorldDirection(tmpV).setY(0).normalize(); // forward
    right.crossVectors(tmpV, UP).normalize();

    const desired = new Vector3()
      .addScaledVector(right, input.moveX)
      .addScaledVector(tmpV, -input.moveY);
    if (desired.lengthSq() > 1e-4) desired.normalize();

    const targetSpeed = (input.sprint ? this.params.sprintSpeed : this.params.walkSpeed) * desired.length();
    const desiredVel = desired.multiplyScalar(targetSpeed);

    // accelerate / damp
    this.vel.lerp(desiredVel, 1 - Math.exp(-this.params.accel * dt));
    this.vel.multiplyScalar(Math.exp(-this.params.damping * dt));

    // integrate position (lock to ground y=0)
    this.player.position.addScaledVector(this.vel, dt);
    if (this.player.position.y !== 0) this.player.position.y = 0;

    // face movement direction if moving
    if (this.vel.lengthSq() > 0.0001) {
      this.yaw = Math.atan2(this.vel.x, this.vel.z);
      this.player.rotation.y = this.yaw;
    }

    // camera rig: third-person shoulder offset
    const camTarget = this.player.position.clone().add(new Vector3(0, this.params.camHeight, 0));
    const offset = new Vector3(
      Math.sin(this.yaw) * this.params.shoulder,
      0,
      Math.cos(this.yaw) * this.params.shoulder
    );
    const back = new Vector3(
      Math.sin(this.yaw) * this.params.camDistance,
      0,
      Math.cos(this.yaw) * this.params.camDistance
    );
    const desiredCam = camTarget.clone().add(offset).addScaledVector(back, 1).setY(camTarget.y + this.params.camHeight);

    // simple collision-aware pull-in (ray to target)
    this.ray.set(camTarget, desiredCam.clone().sub(camTarget).normalize());
    // For now we don't have world meshes to test against; left as hook.
    // if (intersect) desiredCam = intersectionPoint *some factor*;

    // smooth camera
    this.camera.position.lerp(desiredCam, 1 - Math.exp(-8 * dt));
    this.camera.lookAt(camTarget.add(new Vector3(0, this.pitch, 0)));
  }
}

