// src/game/GameState.ts
import { EventBus } from '@/utils/EventBus';
import type { Object3D } from 'three';

export type EntityType = 'Player' | 'Enemy' | 'Pickup' | 'Projectile';

export interface Entity {
  id: number;
  type: EntityType;
  mesh: Object3D;
  alive: boolean;
}

export interface PlayerEntity extends Entity {
  type: 'Player';
  speed: number;
  radius: number;
}

export interface EnemyEntity extends Entity {
  type: 'Enemy';
  radius: number;
  speed: number;
}

export interface PickupEntity extends Entity {
  type: 'Pickup';
  radius: number;
}

export interface ProjectileEntity extends Entity {
  type: 'Projectile';
  radius: number;
  velocity: { x: number; y: number; z: number; };
  ttl: number;
}

export type GameEvents = {
  score: { delta: number, total: number };
  hit: { hp: number };
  pickup: { id: number };
};

export class GameState {
  private nextId = 1;
  entities: Map<number, Entity> = new Map();
  playerId = -1;
  score = 0;
  hp = 100;
  bus = new EventBus<GameEvents>();

  add<T extends Entity>(e: Omit<T, 'id' | 'alive'>): T {
    const ent = { ...e, id: this.nextId++, alive: true } as T;
    this.entities.set(ent.id, ent);
    if (ent.type === 'Player') this.playerId = ent.id;
    return ent;
  }
  remove(id: number) { this.entities.delete(id); }
  forEach(fn: (e: Entity) => void) { this.entities.forEach(fn); }
}

