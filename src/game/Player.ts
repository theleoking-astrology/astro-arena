// src/game/Player.ts
import { CapsuleGeometry, Mesh, MeshStandardMaterial } from 'three';
import type { GameState, PlayerEntity } from './GameState';

export function createPlayer(gs: GameState): PlayerEntity {
  const geom = new CapsuleGeometry(0.35, 0.7, 8, 16);
  const mat = new MeshStandardMaterial({
    color: 0x1b1f27,
    metalness: 0.7,
    roughness: 0.25,
    emissive: 0x00f5ff,
    emissiveIntensity: 1.2
  });
  const mesh = new Mesh(geom, mat);
  mesh.castShadow = true;

  return gs.add<PlayerEntity>({
    type: 'Player',
    mesh,
    speed: 6,
    radius: 0.45
  });
}

