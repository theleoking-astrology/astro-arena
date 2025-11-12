// src/game/ZodiacWorld.ts
import {
  Mesh,
  MeshStandardMaterial,
  CylinderGeometry,
  SphereGeometry,
  Group,
  Vector3,
  Scene
} from 'three';

export interface ZodiacChoice {
  id: string;
  label: string;
  description: string;
  position: { x: number; z: number };
  isCorrect: boolean;
  reaction: string;
  mesh?: Group;
}

export interface ZodiacRound {
  sunSign: string;
  risingSign: string;
  stage: 'sun' | 'rising';
  prompt: string;
  ambient: string;
  choices: ZodiacChoice[];
  success: string;
  failure: string;
}

export class ZodiacWorld {
  private scene: Scene;
  private choiceMeshes: Group[] = [];
  currentRound: ZodiacRound | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  loadRound(round: ZodiacRound) {
    this.clearChoices();
    this.currentRound = round;

    // Spawn 3D choice objects at designated positions
    round.choices.forEach((choice, idx) => {
      const group = new Group();
      
      // Base pedestal
      const pedestalGeom = new CylinderGeometry(0.8, 1.0, 0.3, 6);
      const pedestalMat = new MeshStandardMaterial({
        color: 0x0a0d12,
        metalness: 0.7,
        roughness: 0.3,
        emissive: choice.isCorrect ? 0x00ff00 : 0xff00ff,
        emissiveIntensity: 0.3
      });
      const pedestal = new Mesh(pedestalGeom, pedestalMat);
      pedestal.castShadow = true;
      group.add(pedestal);

      // Interaction sphere (hovering)
      const sphereGeom = new SphereGeometry(0.5, 16, 16);
      const sphereMat = new MeshStandardMaterial({
        color: 0x1a1c24,
        metalness: 0.8,
        roughness: 0.2,
        emissive: choice.isCorrect ? 0x00ffff : 0xff00ff,
        emissiveIntensity: 1.2
      });
      const sphere = new Mesh(sphereGeom, sphereMat);
      sphere.position.y = 1.2;
      sphere.castShadow = true;
      group.add(sphere);

      // Position in world
      group.position.set(choice.position.x, 0, choice.position.z);
      choice.mesh = group;
      this.scene.add(group);
      this.choiceMeshes.push(group);

      // Animate float
      const animate = () => {
        if (!choice.mesh || !this.scene.children.includes(choice.mesh)) return;
        sphere.position.y = 1.2 + Math.sin(Date.now() * 0.002 + idx) * 0.2;
        sphere.rotation.y += 0.01;
        requestAnimationFrame(animate);
      };
      animate();
    });
  }

  clearChoices() {
    this.choiceMeshes.forEach(m => this.scene.remove(m));
    this.choiceMeshes = [];
  }

  checkProximity(playerPos: Vector3): ZodiacChoice | null {
    if (!this.currentRound) return null;
    const proximityThreshold = 2.0;
    
    for (const choice of this.currentRound.choices) {
      if (!choice.mesh) continue;
      const dist = playerPos.distanceTo(choice.mesh.position);
      if (dist < proximityThreshold) {
        return choice;
      }
    }
    return null;
  }

  dispose() {
    this.clearChoices();
  }
}

