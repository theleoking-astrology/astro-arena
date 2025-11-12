// src/game/AspectPuzzle.ts
import {
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Group,
  Vector3,
  Scene,
  BufferGeometry,
  LineBasicMaterial,
  Line,
  TorusGeometry
} from 'three';

export interface AspectData {
  planetA: string;
  planetB: string;
  angle: number;
  correct: string;
}

export class AspectPuzzle {
  private scene: Scene;
  private planetGroup: Group;
  private arcLine: Line | null = null;
  currentAspect: AspectData | null = null;
  private planetAMesh: Mesh | null = null;
  private planetBMesh: Mesh | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.planetGroup = new Group();
    scene.add(this.planetGroup);
  }

  loadAspect(aspect: AspectData) {
    this.clearPlanets();
    this.currentAspect = aspect;

    const radius = 6; // distance from center
    const angleRad = (aspect.angle * Math.PI) / 180;

    // Planet A at angle 0 (reference point)
    const posA = new Vector3(0, 1.5, -radius);
    this.planetAMesh = this.createPlanet(posA, 0xff00ff);
    this.planetGroup.add(this.planetAMesh);

    // Planet B at calculated angle
    const posB = new Vector3(
      Math.sin(angleRad) * radius,
      1.5,
      -Math.cos(angleRad) * radius
    );
    this.planetBMesh = this.createPlanet(posB, 0x00ffff);
    this.planetGroup.add(this.planetBMesh);

    // Arc visualization showing angle
    this.createArc(angleRad, radius);

    // Center measurement zone (player proximity activates UI)
    const zoneMat = new MeshStandardMaterial({
      color: 0x0a0d12,
      metalness: 0.5,
      roughness: 0.4,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.3
    });
    const zoneGeom = new TorusGeometry(1.5, 0.1, 16, 32);
    const zone = new Mesh(zoneGeom, zoneMat);
    zone.rotation.x = -Math.PI / 2;
    zone.position.y = 0.05;
    this.planetGroup.add(zone);
  }

  private createPlanet(pos: Vector3, emissive: number): Mesh {
    const geom = new SphereGeometry(0.8, 32, 32);
    const mat = new MeshStandardMaterial({
      color: 0x1a1c24,
      metalness: 0.9,
      roughness: 0.1,
      emissive,
      emissiveIntensity: 1.5
    });
    const mesh = new Mesh(geom, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    
    // Animate rotation
    const animate = () => {
      if (!this.planetGroup.children.includes(mesh)) return;
      mesh.rotation.y += 0.005;
      requestAnimationFrame(animate);
    };
    animate();

    return mesh;
  }

  private createArc(angleRad: number, radius: number) {
    const points: Vector3[] = [];
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * angleRad;
      const x = Math.sin(t) * radius;
      const z = -Math.cos(t) * radius;
      points.push(new Vector3(x, 1.5, z));
    }
    const geom = new BufferGeometry().setFromPoints(points);
    const mat = new LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    this.arcLine = new Line(geom, mat);
    this.planetGroup.add(this.arcLine);
  }

  checkProximity(playerPos: Vector3): boolean {
    if (!this.currentAspect) return false;
    const center = new Vector3(0, 0, 0);
    const dist = new Vector3(playerPos.x, 0, playerPos.z).distanceTo(center);
    return dist < 2.5; // within measurement zone
  }

  clearPlanets() {
    this.planetGroup.clear();
    this.arcLine = null;
    this.planetAMesh = null;
    this.planetBMesh = null;
  }

  dispose() {
    this.clearPlanets();
    this.scene.remove(this.planetGroup);
  }
}

