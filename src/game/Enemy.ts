// src/game/Enemy.ts
import { Mesh, MeshStandardMaterial, IcosahedronGeometry } from 'three';
import type { EnemyEntity, GameState } from './GameState';

export function createEnemy(gs: GameState, x=3, z=3): EnemyEntity {
  const geom = new IcosahedronGeometry(0.5, 0);
  const mat = new MeshStandardMaterial({
    color: 0x1a1820,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xff00ff,
    emissiveIntensity: 0.8
  });
  const mesh = new Mesh(geom, mat);
  mesh.position.set(x, 0.5, z);
  mesh.castShadow = true;

  return gs.add<EnemyEntity>({
    type: 'Enemy',
    mesh,
    radius: 0.5,
    speed: 3.5
  });
}

