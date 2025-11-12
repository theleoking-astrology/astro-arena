// src/engine3d/Renderer.ts
import { WebGLRenderer, SRGBColorSpace, ACESFilmicToneMapping, PCFSoftShadowMap } from 'three'
import type { QualityState } from './Quality'

export function makeRenderer(canvas: HTMLCanvasElement, quality: QualityState) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false, // post AA handles edges
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap

  function applySize(scale = quality.dynamicScale) {
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const dpr = Math.min(pixelRatio, quality.maxDPR)
    renderer.setPixelRatio(dpr)
    const w = Math.floor(window.innerWidth * scale)
    const h = Math.floor(window.innerHeight * scale)
    renderer.setSize(w, h, false)
  }

  applySize()

  let resizeRaf = 0
  const resize = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(() => applySize())
  }
  window.addEventListener('resize', resize, { passive: true })

  function dispose() {
    window.removeEventListener('resize', resize)
    if (resizeRaf) cancelAnimationFrame(resizeRaf)
    renderer.dispose()
  }

  return {
    renderer,
    dispose,
    applySize
  }
}

