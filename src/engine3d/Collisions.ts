// src/engine3d/Collisions.ts
import { Box3, Sphere, Vector3 } from 'three';

export type ColliderKind = 'Sphere' | 'AABB';

export interface SphereCollider { kind: 'Sphere'; sphere: Sphere; entityId: number; }
export interface AABBCollider   { kind: 'AABB';   box: Box3;    entityId: number; static?: boolean; }

export type Collider = SphereCollider | AABBCollider;

export function testSphereSphere(a: Sphere, b: Sphere): boolean {
  return a.center.distanceToSquared(b.center) <= (a.radius + b.radius) ** 2;
}
export function testSphereAABB(s: Sphere, b: Box3): boolean {
  const clamped = new Vector3(
    Math.max(b.min.x, Math.min(s.center.x, b.max.x)),
    Math.max(b.min.y, Math.min(s.center.y, b.max.y)),
    Math.max(b.min.z, Math.min(s.center.z, b.max.z)),
  );
  return clamped.distanceToSquared(s.center) <= s.radius * s.radius;
}

export class SpatialHash {
  private cellSize: number;
  private cells = new Map<string, Set<Collider>>();
  constructor(cellSize = 3.0) { this.cellSize = cellSize; }

  private key(x: number, y: number, z: number) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  insert(col: Collider) {
    const p = getColliderPoint(col);
    const k = this.key(p.x, p.y, p.z);
    if (!this.cells.has(k)) this.cells.set(k, new Set());
    this.cells.get(k)!.add(col);
  }

  queryNear(col: Collider): Collider[] {
    const p = getColliderPoint(col);
    const cx = Math.floor(p.x / this.cellSize);
    const cy = Math.floor(p.y / this.cellSize);
    const cz = Math.floor(p.z / this.cellSize);
    const out: Collider[] = [];
    for (let x=-1;x<=1;x++) for (let y=-1;y<=1;y++) for (let z=-1;z<=1;z++) {
      const k = `${cx+x},${cy+y},${cz+z}`;
      const set = this.cells.get(k);
      if (set) set.forEach(c => out.push(c));
    }
    return out;
  }

  clear() { this.cells.clear(); }
}

function getColliderPoint(col: Collider): Vector3 {
  return col.kind === 'Sphere' ? col.sphere.center : col.box.getCenter(new Vector3());
}

