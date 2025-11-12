// src/utils/EventBus.ts
export type Handler<T> = (payload: T) => void;

export class EventBus<TEvents extends Record<string, any>> {
  private map = new Map<keyof TEvents, Set<Handler<any>>>();
  on<K extends keyof TEvents>(type: K, h: Handler<TEvents[K]>) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type)!.add(h);
    return () => this.off(type, h);
  }
  off<K extends keyof TEvents>(type: K, h: Handler<TEvents[K]>) {
    this.map.get(type)?.delete(h);
  }
  emit<K extends keyof TEvents>(type: K, payload: TEvents[K]) {
    this.map.get(type)?.forEach(fn => fn(payload));
  }
}

