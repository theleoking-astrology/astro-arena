import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '@/utils/EventBus'

interface TestEvents {
  ping: { msg: string }
  score: number
}

describe('EventBus', () => {
  it('registers and emits events', () => {
    const bus = new EventBus<TestEvents>()
    const payload = { msg: 'hello' }
    const handler = vi.fn()

    bus.on('ping', handler)
    bus.emit('ping', payload)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(payload)
  })

  it('removes handlers via dispose function', () => {
    const bus = new EventBus<TestEvents>()
    const handler = vi.fn()

    const dispose = bus.on('score', handler)
    dispose()
    bus.emit('score', 42)

    expect(handler).not.toHaveBeenCalled()
  })

  it('supports multiple listeners per event type', () => {
    const bus = new EventBus<TestEvents>()
    const a = vi.fn()
    const b = vi.fn()

    bus.on('ping', a)
    bus.on('ping', b)
    bus.emit('ping', { msg: 'go' })

    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })
})


