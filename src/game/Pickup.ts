// src/game/Pickup.ts
import { Mesh, MeshStandardMaterial, TorusKnotGeometry } from 'three';
import type { GameState, PickupEntity } from './GameState';

export function createPickup(gs: GameState, x=-2, z=2): PickupEntity {
  const geom = new TorusKnotGeometry(0.35, 0.12, 64, 8);
  const mat = new MeshStandardMaterial({
    color: 0x0f1217,
    metalness: 0.8,
    roughness: 0.15,
    emissive: 0x00f5ff,
    emissiveIntensity: 1.8
  });
  const mesh = new Mesh(geom, mat);
  mesh.position.set(x, 0.5, z);
  mesh.castShadow = true;

  return gs.add<PickupEntity>({
    type: 'Pickup',
    mesh,
    radius: 0.45
  });
}

