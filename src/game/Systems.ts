// src/game/Systems.ts
import { Box3, Sphere, Vector3 } from 'three';
import type { GameState, Entity, PlayerEntity, EnemyEntity, PickupEntity, ProjectileEntity } from './GameState';
import { SpatialHash, testSphereSphere, testSphereAABB } from '@/engine3d/Collisions';

const tmpV = new Vector3();

export interface Systems {
  update(dt: number): void;
}

export function makeSystems(gs: GameState, worldBounds: Box3[]): Systems {
  const hash = new SpatialHash(3.0);

  function sphereFor(e: Entity): Sphere | null {
    switch (e.type) {
      case 'Player':    return new Sphere(e.mesh.position, (e as PlayerEntity).radius);
      case 'Enemy':     return new Sphere(e.mesh.position, (e as EnemyEntity).radius);
      case 'Pickup':    return new Sphere(e.mesh.position, (e as PickupEntity).radius);
      case 'Projectile':return new Sphere(e.mesh.position, (e as ProjectileEntity).radius);
    }
    return null;
  }

  function moveProjectile(p: ProjectileEntity, dt: number) {
    p.mesh.position.x += p.velocity.x * dt;
    p.mesh.position.y += p.velocity.y * dt;
    p.mesh.position.z += p.velocity.z * dt;
    p.ttl -= dt;
    if (p.ttl <= 0) p.alive = false;
  }

  function moveEnemy(e: EnemyEntity, player: PlayerEntity, dt: number) {
    tmpV.copy(player.mesh.position).sub(e.mesh.position).setY(0);
    const dist = tmpV.length();
    if (dist > 0.001) {
      tmpV.normalize().multiplyScalar(e.speed * dt);
      e.mesh.position.add(tmpV);
    }
  }

  function resolveWorldSphere(s: Sphere) {
    // keep within a 40x40 arena (simple bounds)
    for (const b of worldBounds) {
      if (testSphereAABB(s, b)) {
        // push out along the smallest axis
        const dx = Math.min(Math.abs(s.center.x - b.min.x), Math.abs(b.max.x - s.center.x));
        const dz = Math.min(Math.abs(s.center.z - b.min.z), Math.abs(b.max.z - s.center.z));
        if (dx < dz) s.center.x += (s.center.x < b.getCenter(new Vector3()).x ? -1 : 1) * (s.radius - 0.0);
        else s.center.z += (s.center.z < b.getCenter(new Vector3()).z ? -1 : 1) * (s.radius - 0.0);
      }
    }
  }

  return {
    update(dt: number) {
      // rebuild spatial hash
      hash.clear();
      const entities = Array.from(gs.entities.values()).filter(e => e.alive);
      entities.forEach(e => {
        const s = sphereFor(e);
        if (s) hash.insert({ kind: 'Sphere', sphere: s, entityId: e.id });
      });

      const player = gs.entities.get(gs.playerId) as PlayerEntity;

      // enemies gravitate to player
      entities.filter(e => e.type === 'Enemy').forEach(e => moveEnemy(e as EnemyEntity, player, dt));

      // projectiles fly
      entities.filter(e => e.type === 'Projectile').forEach(e => moveProjectile(e as ProjectileEntity, dt));

      // world bounds for player (simple)
      const ps = sphereFor(player)!;
      resolveWorldSphere(ps);
      player.mesh.position.copy(ps.center);

      // interactions
      entities.forEach(a => {
        if (!a.alive) return;
        const sa = sphereFor(a);
        if (!sa) return;
        // Check near
        const near = hash.queryNear({ kind: 'Sphere', sphere: sa, entityId: a.id });
        for (const col of near) {
          if (col.entityId === a.id) continue;
          const b = gs.entities.get(col.entityId);
          if (!b || !b.alive) continue;
          const sb = sphereFor(b)!;
          if (testSphereSphere(sa, sb)) {
            // player vs pickup
            if (a.type === 'Player' && b.type === 'Pickup') {
              b.alive = false; gs.score += 10; gs.bus.emit('pickup', { id: b.id }); gs.bus.emit('score', { delta: 10, total: gs.score });
            }
            // projectile vs enemy
            if ((a.type === 'Projectile' && b.type === 'Enemy') || (a.type === 'Enemy' && b.type === 'Projectile')) {
              a.alive = false; b.alive = false; gs.score += 25; gs.bus.emit('score', { delta: 25, total: gs.score });
            }
            // player vs enemy
            if ((a.type === 'Player' && b.type === 'Enemy') || (a.type === 'Enemy' && b.type === 'Player')) {
              gs.hp = Math.max(0, gs.hp - 5); gs.bus.emit('hit', { hp: gs.hp });
            }
          }
        }
      });

      // prune dead
      Array.from(gs.entities.entries()).forEach(([id, e]) => { if (!e.alive) gs.entities.delete(id); });
    }
  };
}

