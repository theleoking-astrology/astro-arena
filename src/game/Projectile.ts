// src/game/Projectile.ts
import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import type { GameState, ProjectileEntity } from './GameState';

export function createProjectile(gs: GameState, origin: {x:number;y:number;z:number}, dir: {x:number;y:number;z:number}): ProjectileEntity {
  const geom = new SphereGeometry(0.12, 12, 12);
  const mat = new MeshStandardMaterial({ color: 0xffffff, emissive: 0x00f5ff, emissiveIntensity: 2.5, metalness: 0.6, roughness: 0.2 });
  const mesh = new Mesh(geom, mat);
  mesh.position.set(origin.x, origin.y, origin.z);
  mesh.castShadow = true;

  const speed = 16;
  return gs.add<ProjectileEntity>({
    type: 'Projectile',
    mesh,
    radius: 0.15,
    ttl: 2.5,
    velocity: { x: dir.x * speed, y: dir.y * speed, z: dir.z * speed }
  });
}

