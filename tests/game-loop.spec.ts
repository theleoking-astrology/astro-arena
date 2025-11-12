import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameLoop } from '@/engine3d/Loop'

describe('GameLoop', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>
  let cafSpy: ReturnType<typeof vi.spyOn>
  type RafCallback = Parameters<typeof window.requestAnimationFrame>[0]

  beforeEach(() => {
    let id = 0
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: RafCallback) => {
      id += 1
      setTimeout(() => cb(performance.now()), 0)
      return id
    })
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  afterEach(() => {
    rafSpy.mockRestore()
    cafSpy.mockRestore()
  })

  it('ticks fixed update at configured step', async () => {
    const onFixed = vi.fn()
    const onFrame = vi.fn()
    const loop = new GameLoop(onFixed, onFrame, 60)

    loop.start()
    await new Promise((resolve) => setTimeout(resolve, 20))
    loop.stop()

    expect(onFrame).toHaveBeenCalled()
    expect(onFixed).toHaveBeenCalled()
    expect(cafSpy).toHaveBeenCalled()
  })

  it('ignores repeated start calls', () => {
    const loop = new GameLoop(
      () => {},
      () => {}
    )
    loop.start()
    loop.start()

    expect(rafSpy).toHaveBeenCalledTimes(1)
    loop.stop()
  })
})


