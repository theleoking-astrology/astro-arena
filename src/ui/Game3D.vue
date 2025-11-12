<template>
  <div class="stage" ref="stage">
    <canvas ref="canvas"></canvas>

    <LoadingOverlay
      :ready="isRendererReady"
      :progress="loadProgress"
      :error="bootError"
      headline="Igniting Astro Arena"
      message="Aligning the cosmic render pipeline…"
      @retry="handleOverlayRetry"
    />

    <div class="ui">
      <div class="hud">
        <div class="chip">SCORE {{ scoreDisplay }}</div>
        <div class="chip">STREAK x{{ streak }}</div>
        <div class="chip" :class="{ danger: timeLeft <= 10 }">TIME {{ timeDisplay }}</div>
      </div>
      <button class="exit-btn" @click="handleExit">EXIT</button>
    </div>

    <div v-if="!mode" class="mode-card">
      <h1>3D ARENA</h1>
      <p>Choose how to channel the cosmos.</p>
      <button class="mode-btn" @click="start('zodiac')">ZODIAC TRIALS 3D</button>
      <button class="mode-btn" @click="start('aspects')">ASPECT CLASH 3D</button>
      <button class="mode-link" @click="handleExit">BACK TO 2D</button>
    </div>

    <transition name="fade">
      <div v-if="mode === 'zodiac'" key="zodiac" :class="['panel', 'zodiac', stageClass]">
        <div class="sign-row">
          <div class="card">
            <p class="label">SUN SIGN</p>
            <h3>{{ currentTrial.sunSign }}</h3>
            <p class="traits">{{ currentTrial.sunTraits.join(' • ') }}</p>
          </div>
          <div class="card center">
            <p class="label">{{ stageHeading }}</p>
            <p class="ambient">{{ currentScene?.ambient }}</p>
            <p class="prompt">{{ currentScene?.prompt }}</p>
          </div>
          <div class="card">
            <p class="label">RISING SIGN</p>
            <h3>{{ currentTrial.risingSign }}</h3>
            <p class="traits">{{ currentTrial.risingTraits.join(' • ') }}</p>
          </div>
        </div>

        <div :class="['choices', choiceSideClass]">
          <p class="scroll-hint">SCROLL TO REVEAL ALL OPTIONS ↓</p>
          <div class="choices-header">CHOOSE YOUR ACTION</div>
          <button
            v-for="(option, idx) in currentScene?.options ?? []"
            :key="option.id"
            class="choice-btn"
            :class="choiceClass(option, idx)"
            :disabled="locked || expired"
            @click="resolveZodiac(option, idx)"
          >
            <span class="title">{{ option.label }}</span>
            <span class="desc">{{ option.description }}</span>
          </button>
        </div>

        <div class="narrative" v-if="narrative">
          <p :class="{ success: mood === 'success', fail: mood === 'failure' }">{{ narrative }}</p>
        </div>

        <div class="feedback" v-if="feedback">
          <p :class="{ success: mood === 'success', fail: mood === 'failure' }">{{ feedback }}</p>
          <p v-if="feedbackDetail" class="detail">{{ feedbackDetail }}</p>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="mode === 'aspects'" key="aspects" class="panel aspects">
        <div class="card single">
          <p class="label">ASPECT CHALLENGE</p>
          <p class="ambient">{{ aspectPrompt }}</p>
          <p class="prompt">{{ aspectDescription }}</p>
        </div>

        <div class="choices multi">
          <p class="scroll-hint">SCROLL TO REVEAL ALL OPTIONS ↓</p>
          <div class="choices-header">SELECT THE ASPECT</div>
          <button
            v-for="(option, idx) in aspectOptions"
            :key="option.key"
            class="choice-btn"
            :class="aspectClass(option.key, idx)"
            :disabled="locked || expired"
            @click="resolveAspect(option.key, idx)"
          >
            <span class="title">{{ option.label }}</span>
            <span class="desc">{{ option.window[0] }}° - {{ option.window[1] }}°</span>
          </button>
        </div>

        <div class="feedback" v-if="feedback">
          <p :class="{ success: mood === 'success', fail: mood === 'failure' }">{{ feedback }}</p>
          <p v-if="feedbackDetail" class="detail">{{ feedbackDetail }}</p>
        </div>
      </div>
    </transition>

    <div v-if="mode && expired" class="overlay">
      <div class="overlay-card">
        <h2>TIME'S UP</h2>
        <p>Your final score: {{ scoreDisplay }}</p>
        <button class="mode-btn" @click="restartMode">PLAY AGAIN</button>
        <button class="mode-link" @click="handleExit">BACK TO MENU</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  Clock,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Group,
  CylinderGeometry,
  TorusGeometry,
  PlaneGeometry,
  SphereGeometry,
  ConeGeometry,
  CanvasTexture,
  DoubleSide,
  Material
} from 'three'
import LoadingOverlay from '@/ui/components/LoadingOverlay.vue'
import { detectDeviceQuality } from '@/utils/deviceQuality'
import { makeTrial, type TrialOption, type TrialScene } from '@/data/zodiac'
import { aspectOptions, makeAspect, ASPECTS, type AspectState } from '@/data/aspects'
import type { QualityState } from '@/engine3d/Quality'

type Mode = 'zodiac' | 'aspects'
type PedestalState = 'idle' | 'focus' | 'success' | 'failure'
type PedestalVisualState = PedestalState | 'inactive'
type StagePalette = 'sun' | 'rising' | 'aspects'

type MakeRenderer = typeof import('@/engine3d/Renderer')['makeRenderer']
type BuildScene = typeof import('@/engine3d/SceneGraph')['buildScene']
type RendererHandle = ReturnType<MakeRenderer>

interface Pedestal {
  base: Mesh
  halo: Mesh
  plaque: Mesh
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: CanvasTexture
  palette: number
  labelTitle: string
  labelDesc: string
  labelState: PedestalVisualState
}

interface Avatar {
  group: Group
  body: Mesh
  aura: Mesh
  crest: Mesh
  crestCanvas: HTMLCanvasElement
  crestCtx: CanvasRenderingContext2D
  crestTexture: CanvasTexture
  palette: StagePalette
}

const ROUND_TIME = 75  // Increased from 45s to 75s (+30s) for reading time
const SUN_POINTS = 140
const RISING_POINTS = 110
const ASPECT_POINTS = 100

const PALETTES: Record<StagePalette, number> = {
  sun: 0xff2fd5,
  rising: 0x00f5ff,
  aspects: 0xffd23c
}

// FIXED: Wider spacing to prevent plaque overlap
const LAYOUTS: Record<number, number[]> = {
  1: [0],
  2: [-2.0, 2.0],
  3: [-3.5, 0, 3.5],
  4: [-4.5, -1.5, 1.5, 4.5],
  5: [-5.0, -2.5, 0, 2.5, 5.0]
}

const stage = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const isRendererReady = ref(false)
const loadProgress = ref(0)
const bootError = ref<string | null>(null)
const isContextLost = ref(false)

const mode = ref<Mode | null>(null)
const score = ref(0)
const streak = ref(0)
const timeLeft = ref(ROUND_TIME)
const feedback = ref('')
const feedbackDetail = ref('')
const narrative = ref('')
const mood = ref<'success' | 'failure' | ''>('')
const locked = ref(false)
const expired = ref(false)

const trialStage = ref<'sun' | 'rising'>('sun')
const currentTrial = reactive(makeTrial())
const aspectState = reactive<AspectState>(makeAspect())

const selectedZodiacIndex = ref(-1)
const selectedAspectIndex = ref(-1)
const activePedestals = ref(0)

const scoreDisplay = computed(() => score.value.toString().padStart(6, '0'))
const timeDisplay = computed(() => Math.max(0, timeLeft.value).toString().padStart(2, '0'))

const currentScene = computed<TrialScene | null>(() => {
  if (mode.value !== 'zodiac') return null
  return trialStage.value === 'sun' ? currentTrial.sunScene : currentTrial.risingScene
})

const stageHeading = computed(() => (trialStage.value === 'sun' ? 'SUN INSTINCT' : 'RISING MOVE'))
const stageClass = computed(() => (trialStage.value === 'sun' ? 'zodiac--sun' : 'zodiac--rising'))
const choiceSideClass = computed(() => (trialStage.value === 'sun' ? 'choices--sun' : 'choices--rising'))

const aspectPrompt = computed(() => `${aspectState.planetA} ↔ ${aspectState.planetB}`)
const aspectDescription = computed(() => `${aspectState.angle.toFixed(0)}° — which aspect fits?`)

let timerId: number | null = null
let resumeTimerOnFocus = false
let rendererInstance: RendererHandle | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let raf = 0
let animationActive = false
let animationAttenuation = 1
const clock = new Clock()
const pedestals: Pedestal[] = []
let sunAvatar: Avatar | null = null
let risingAvatar: Avatar | null = null
let starfield: any = null
let backdrop: Mesh | null = null

let initPromise: Promise<void> | null = null
let destroyed = false

const cleanupFns: Array<() => void> = []
let canvasCleanupFns: Array<() => void> = []

function addCleanup(fn: () => void) {
  cleanupFns.push(fn)
}

function clearCanvasCleanups() {
  canvasCleanupFns.forEach((fn) => fn())
  canvasCleanupFns = []
}

function startAnimation() {
  if (animationActive) return
  animationActive = true
  clock.start()
  clock.elapsedTime = 0
  tick()
}

function resumeAnimation() {
  if (animationActive) return
  animationActive = true
  clock.start()
  tick()
}

function stopAnimation() {
  if (!animationActive) return
  animationActive = false
  cancelAnimationFrame(raf)
  clock.stop()
}

function tick() {
  if (!animationActive) return
  raf = requestAnimationFrame(tick)
  if (!rendererInstance || !scene || !camera) return

  const elapsed = clock.getElapsedTime()

  if (starfield) {
    starfield.rotation.y = elapsed * 0.01
    starfield.rotation.x = Math.sin(elapsed * 0.005) * 0.05
  }

  pedestals.forEach((ped, idx) => {
    if (!ped.base.visible) return
    const wave = Math.sin(elapsed * 1.5 + idx * 0.5) * animationAttenuation
    const pulse = Math.sin(elapsed * 3 + idx) * animationAttenuation

    ped.halo.rotation.z = elapsed * 0.8
    ped.halo.position.y = 2.35 + wave * 0.08

    ped.plaque.position.y = 3.15 + wave * 0.12
    if (camera) ped.plaque.lookAt(camera.position)

    const baseMat = ped.base.material as MeshStandardMaterial
    baseMat.emissiveIntensity = 0.6 + pulse * 0.3
  })

  const avatarPulse = Math.sin(elapsed * 1.8)
  const breathe = Math.sin(elapsed * 2.5)

  if (sunAvatar) {
    const isActive = trialStage.value === 'sun'
    sunAvatar.group.position.y =
      2.08 + (isActive ? 0.15 : 0.05) * ((avatarPulse + 1) * 0.5) * animationAttenuation
    sunAvatar.group.rotation.y = Math.sin(elapsed * 0.5) * 0.15 * animationAttenuation
    sunAvatar.aura.rotation.z = elapsed * 0.7
    const scale = isActive ? 1.08 : 0.92
    sunAvatar.group.scale.setScalar(scale + breathe * 0.02 * animationAttenuation)
  }

  if (risingAvatar) {
    const isActive = trialStage.value === 'rising'
    risingAvatar.group.position.y =
      2.08 + (isActive ? 0.15 : 0.05) * ((Math.cos(elapsed * 1.8) + 1) * 0.5) * animationAttenuation
    risingAvatar.group.rotation.y = Math.cos(elapsed * 0.5) * 0.15 * animationAttenuation
    risingAvatar.aura.rotation.z = -elapsed * 0.7
    const scale = isActive ? 1.08 : 0.92
    risingAvatar.group.scale.setScalar(scale + Math.cos(breathe) * 0.02 * animationAttenuation)
  }

  rendererInstance.renderer.render(scene, camera)

  if (!isRendererReady.value && !bootError.value) {
    isRendererReady.value = true
    loadProgress.value = 1
  }
}

function disposeAvatar(avatar: Avatar | null) {
  if (!avatar || !scene) return
  avatar.crestTexture.dispose()
  scene.remove(avatar.group)
  avatar.group.traverse((child) => {
    if (child instanceof Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach((mat: Material | null | undefined) => mat?.dispose?.())
      } else if (child.material) {
        ;(child.material as Material).dispose()
      }
    }
  })
}

function disposePedestals() {
  const sceneRef = scene
  if (!sceneRef) {
    pedestals.length = 0
    return
  }
  pedestals.forEach((ped) => {
    sceneRef.remove(ped.base)
    sceneRef.remove(ped.halo)
    sceneRef.remove(ped.plaque)
    ped.texture.dispose()
    ped.base.geometry.dispose()
    ;(ped.base.material as MeshStandardMaterial).dispose()
    ped.halo.geometry.dispose()
    ;(ped.halo.material as MeshStandardMaterial).dispose()
    ped.plaque.geometry.dispose()
    ;(ped.plaque.material as MeshBasicMaterial).dispose()
  })
  pedestals.length = 0
}

function disposeSceneArtifacts() {
  if (scene && starfield) {
    scene.remove(starfield)
    starfield.geometry.dispose()
    if (Array.isArray(starfield.material)) {
      starfield.material.forEach((mat: Material | null | undefined) => mat?.dispose?.())
    } else if (starfield.material) {
      ;(starfield.material as Material).dispose()
    }
  }
  if (scene && backdrop) {
    scene.remove(backdrop)
    backdrop.geometry.dispose()
    if (Array.isArray(backdrop.material)) {
      backdrop.material.forEach((mat: Material | null | undefined) => mat?.dispose?.())
    } else if (backdrop.material) {
      ;(backdrop.material as Material).dispose()
    }
  }
  starfield = null
  backdrop = null
}

function teardownRenderer() {
  stopAnimation()
  disposeAvatar(sunAvatar)
  disposeAvatar(risingAvatar)
  sunAvatar = null
  risingAvatar = null
  disposePedestals()
  disposeSceneArtifacts()
  scene = null
  camera = null
  rendererInstance?.dispose()
  rendererInstance = null
  clearCanvasCleanups()
}

function attachCanvasHandlers(canvasEl: HTMLCanvasElement) {
  clearCanvasCleanups()
  const onContextLost = (event: Event) => {
    event.preventDefault()
    isContextLost.value = true
    isRendererReady.value = false
    bootError.value = 'Graphics context lost. Restoring cosmic pipeline…'
    loadProgress.value = 0
    stopAnimation()
  }
  const onContextRestored = () => {
    isContextLost.value = false
    bootError.value = null
    loadProgress.value = 0.05
    void initializeRenderer(true)
  }

  canvasEl.addEventListener('webglcontextlost', onContextLost, false)
  canvasEl.addEventListener('webglcontextrestored', onContextRestored, false)

  canvasCleanupFns = [
    () => canvasEl.removeEventListener('webglcontextlost', onContextLost, false),
    () => canvasEl.removeEventListener('webglcontextrestored', onContextRestored, false)
  ]
}

async function initializeRenderer(force = false) {
  if (destroyed) return
  if (initPromise) {
    if (!force) return initPromise
    try {
      await initPromise
    } catch {
      /* swallow */
    }
  }
  const canvasEl = canvas.value
  if (!canvasEl) return

  if (force) {
    teardownRenderer()
  }

  const loader = async () => {
    try {
      bootError.value = null
      isRendererReady.value = false
      loadProgress.value = 0.05
      const [{ makeRenderer }, { buildScene }, { detectQuality }] = await Promise.all([
        import('@/engine3d/Renderer') as Promise<{ makeRenderer: MakeRenderer }>,
        import('@/engine3d/SceneGraph') as Promise<{ buildScene: BuildScene }>,
        import('@/engine3d/Quality') as Promise<{ detectQuality: () => Promise<QualityState> }>
      ])
      if (destroyed) return

      loadProgress.value = 0.25
      const quality = await detectQuality()
      if (destroyed) return
      const deviceProfile = detectDeviceQuality()
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      animationAttenuation = deviceProfile.reduceAnimations || prefersReducedMotion ? 0.65 : 1
      quality.maxDPR = Math.min(quality.maxDPR, deviceProfile.maxDeviceDpr)
      if (deviceProfile.reduceAnimations || prefersReducedMotion) {
        quality.dynamicScale = Math.min(quality.dynamicScale, 0.85)
      }
      loadProgress.value = 0.45

      rendererInstance = makeRenderer(canvasEl, quality)
      attachCanvasHandlers(canvasEl)

      loadProgress.value = 0.65
      const sceneBundle = await buildScene(rendererInstance.renderer, quality)
      if (destroyed) return
      const newScene = sceneBundle.scene
      const newCamera = sceneBundle.camera
      scene = newScene
      camera = newCamera
      starfield = sceneBundle.starfield
      backdrop = sceneBundle.backdrop ?? null
      if (newCamera) {
        newCamera.position.set(0, 2.8, 9.0)
        newCamera.lookAt(0, 3.0, -3.5)
      }

      loadProgress.value = 0.78
      pedestals.length = 0
      buildPedestals(newScene)
      sunAvatar = createAvatar(newScene, -4)
      risingAvatar = createAvatar(newScene, 4)
      updateAvatar(sunAvatar, 'SUN', ['CORE READY'], 'sun', false)
      updateAvatar(risingAvatar, 'RISING', ['ASCEND'], 'rising', false)
      applyPedestalLayout(0, 'sun')

      loadProgress.value = 0.92
      startAnimation()
      await nextTick()
    } catch (err) {
      console.error('[Game3D] Failed to initialize renderer', err)
      bootError.value = 'Graphics initialization failed. Retry to re-launch the arena.'
      teardownRenderer()
    } finally {
      if (!bootError.value) {
        loadProgress.value = 0.98
      }
      initPromise = null
    }
  }

  initPromise = loader()
  return initPromise
}

function setupVisibilityGuards() {
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      resumeTimerOnFocus = timerId !== null
      stopTimer()
      stopAnimation()
    } else {
      if (resumeTimerOnFocus && mode.value && !expired.value) {
        startTimer()
      }
      resumeTimerOnFocus = false
      if (rendererInstance && !animationActive && !isContextLost.value) {
        resumeAnimation()
      }
    }
  }
  const onFocus = () => {
    if (rendererInstance && !animationActive && !isContextLost.value) {
      resumeAnimation()
    }
    if (resumeTimerOnFocus && mode.value && !expired.value) {
      startTimer()
      resumeTimerOnFocus = false
    }
  }

  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('focus', onFocus)

  addCleanup(() => document.removeEventListener('visibilitychange', onVisibility))
  addCleanup(() => window.removeEventListener('focus', onFocus))
}

function handleOverlayRetry() {
  bootError.value = null
  loadProgress.value = 0
  void initializeRenderer(true)
}

function start(newMode: Mode) {
  mode.value = newMode
  score.value = 0
  streak.value = 0
  timeLeft.value = ROUND_TIME
  feedback.value = ''
  feedbackDetail.value = ''
  narrative.value = ''
  mood.value = ''
  expired.value = false
  locked.value = false
  selectedZodiacIndex.value = -1
  selectedAspectIndex.value = -1

  if (newMode === 'zodiac') {
    prepareZodiac()
  } else {
    prepareAspect()
  }
  startTimer()
}

function restartMode() {
  if (!mode.value) return
  start(mode.value)
}

function handleExit() {
  cleanupRun()
  emit('exit')
}

function cleanupRun() {
  stopTimer()
  mode.value = null
  feedback.value = ''
  feedbackDetail.value = ''
  narrative.value = ''
  mood.value = ''
  locked.value = false
  expired.value = false
  selectedZodiacIndex.value = -1
  selectedAspectIndex.value = -1
  applyPedestalLayout(0, 'sun')
  if (sunAvatar) sunAvatar.group.visible = false
  if (risingAvatar) risingAvatar.group.visible = false
}

function startTimer() {
  stopTimer()
  timerId = window.setInterval(() => {
    timeLeft.value = Math.max(0, timeLeft.value - 1)
    if (timeLeft.value === 0) {
      expireRun()
    }
  }, 1000)
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function expireRun() {
  stopTimer()
  expired.value = true
  locked.value = true
  feedback.value = ''
  feedbackDetail.value = ''
  narrative.value = ''
  mood.value = ''
  setAllPedestalsIdle()
}

function prepareZodiac() {
  Object.assign(currentTrial, makeTrial())
  trialStage.value = 'sun'
  locked.value = false
  feedback.value = ''
  feedbackDetail.value = ''
  narrative.value = ''
  mood.value = ''
  selectedZodiacIndex.value = -1
  focusZodiacStage('sun')
}

function prepareAspect() {
  Object.assign(aspectState, makeAspect())
  locked.value = false
  feedback.value = ''
  feedbackDetail.value = ''
  mood.value = ''
  selectedAspectIndex.value = -1
  applyPedestalLayout(aspectOptions.length, 'aspects')
  setAspectPedestalLabels()
  if (sunAvatar) sunAvatar.group.visible = false
  if (risingAvatar) risingAvatar.group.visible = false
}

function resolveZodiac(option: TrialOption, idx: number) {
  if (locked.value || expired.value || mode.value !== 'zodiac') return
  const sceneRef = currentScene.value
  if (!sceneRef) return

  locked.value = true
  selectedZodiacIndex.value = idx
  setPedestalState(idx, 'focus')

  const correct = option.isCorrect
  if (correct) {
    streak.value += 1
    score.value += trialStage.value === 'sun' ? SUN_POINTS : RISING_POINTS
    mood.value = 'success'
    feedback.value = 'ENERGY ALIGNED'
    feedbackDetail.value = trialStage.value === 'sun' ? 'CORE LOCKED +BONUS' : 'RISING VERIFIED +STYLE'
    narrative.value = `${option.reaction} ${sceneRef.success}`
    setPedestalState(idx, 'success')
  } else {
    streak.value = 0
    mood.value = 'failure'
    feedback.value = 'COSMIC MISREAD'
    feedbackDetail.value = trialStage.value === 'sun' ? 'SUN MISFIRE -RESET' : 'RISING MISREAD -RECAL'
    narrative.value = `${option.reaction} ${sceneRef.failure}`
    setPedestalState(idx, 'failure')
    const correctIdx = sceneRef.options.findIndex((opt) => opt.isCorrect)
    if (correctIdx >= 0 && correctIdx !== idx) {
      setPedestalState(correctIdx, 'success')
    }
  }

  window.setTimeout(() => {
    if (expired.value) return
    selectedZodiacIndex.value = -1
    feedback.value = ''
    feedbackDetail.value = ''
    narrative.value = ''
    mood.value = ''

    if (trialStage.value === 'sun') {
      trialStage.value = 'rising'
      locked.value = false
      focusZodiacStage('rising')
    } else {
      prepareZodiac()
    }
  }, 1100)
}

function resolveAspect(key: string, idx: number) {
  if (locked.value || expired.value || mode.value !== 'aspects') return
  locked.value = true
  selectedAspectIndex.value = idx
  setPedestalState(idx, 'focus')

  if (key === aspectState.correct) {
    streak.value += 1
    score.value += ASPECT_POINTS
    mood.value = 'success'
    feedback.value = 'ASPECT LOCKED'
    feedbackDetail.value = 'Perfect read on the cosmic angles.'
    setPedestalState(idx, 'success')
  } else {
    streak.value = 0
    mood.value = 'failure'
    feedback.value = 'ASPECT DRIFT'
    feedbackDetail.value = `Correct: ${ASPECTS[aspectState.correct].label}`
    setPedestalState(idx, 'failure')
    const correctIdx = aspectOptions.findIndex((opt) => opt.key === aspectState.correct)
    if (correctIdx >= 0 && correctIdx !== idx) {
      setPedestalState(correctIdx, 'success')
    }
  }

  window.setTimeout(() => {
    if (expired.value) return
    selectedAspectIndex.value = -1
    feedback.value = ''
    feedbackDetail.value = ''
    mood.value = ''
    prepareAspect()
  }, 1000)
}

function choiceClass(option: TrialOption, idx: number) {
  const isChosen = selectedZodiacIndex.value === idx
  const isCorrect = option.isCorrect
  const lockedNow = locked.value
  const failure = mood.value === 'failure'
  const successNow = mood.value === 'success'
  return {
    chosen: isChosen,
    success: lockedNow && isChosen && successNow,
    fail: lockedNow && isChosen && failure,
    highlight: lockedNow && !isChosen && failure && isCorrect,
    inactive: lockedNow && !isChosen && !(failure && isCorrect)
  }
}

function aspectClass(key: string, idx: number) {
  const isChosen = selectedAspectIndex.value === idx
  const isCorrect = key === aspectState.correct
  return {
    chosen: isChosen,
    success: locked.value && isCorrect && mood.value === 'success' && isChosen,
    fail: locked.value && isChosen && mood.value === 'failure',
    highlight: locked.value && !isChosen && isCorrect && mood.value === 'failure',
    inactive: locked.value && !isChosen && !(isCorrect && mood.value === 'failure')
  }
}

const LABEL_THEMES: Record<PedestalVisualState, { bg: string; border: string; title: string; desc: string }> = {
  inactive: { bg: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)', title: '#ffffff', desc: '#a6b7d4' },
  idle: { bg: 'rgba(10,16,26,0.78)', border: 'rgba(0,245,255,0.45)', title: '#ffffff', desc: '#b7c5e6' },
  focus: { bg: 'rgba(0,245,255,0.16)', border: 'rgba(0,245,255,0.9)', title: '#00f5ff', desc: '#def9ff' },
  success: { bg: 'rgba(0,255,171,0.16)', border: 'rgba(0,255,171,0.8)', title: '#00ffab', desc: '#d5ffef' },
  failure: { bg: 'rgba(255,82,117,0.16)', border: 'rgba(255,82,117,0.8)', title: '#ff4f88', desc: '#ffd1df' }
}

function createAvatar(sceneRef: Scene, x: number): Avatar {
  const group = new Group()
  // Move avatars UP by 2 units so they appear higher in viewport, away from bottom UI
  group.position.set(x, 2.0, -3.8)

  // COSMIC ENERGY RINGS - Multiple rotating halos
  const aura = new Mesh(
    new TorusGeometry(1.6, 0.12, 32, 64),
    new MeshStandardMaterial({
      color: 0x4a90ff,
      emissive: 0x4a90ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85,
      metalness: 0.9,
      roughness: 0.1
    })
  )
  aura.rotation.x = Math.PI / 2
  aura.position.y = 0.05
  group.add(aura)

  // Inner energy ring
  const innerRing = new Mesh(
    new TorusGeometry(1.1, 0.08, 24, 48),
    new MeshStandardMaterial({
      color: 0xff6bff,
      emissive: 0xff6bff,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9
    })
  )
  innerRing.rotation.x = Math.PI / 2
  innerRing.position.y = 0.08
  group.add(innerRing)

  // ASTRO-PERSON BODY - Humanoid form with cosmic materials
  const bodyMat = new MeshStandardMaterial({
    color: 0x2a3f5f,
    metalness: 0.8,
    roughness: 0.25,
    emissive: 0x1a2f4f,
    emissiveIntensity: 0.6
  })

  // Torso - tapered for human-like shape
  const torso = new Mesh(new CylinderGeometry(0.5, 0.65, 1.8, 32), bodyMat)
  torso.position.y = 1.4
  group.add(torso)

  // Shoulders - wider cosmic pauldrons
  const leftShoulder = new Mesh(
    new SphereGeometry(0.35, 24, 24),
    new MeshStandardMaterial({ 
      color: 0x3a4f6f, 
      metalness: 0.9, 
      roughness: 0.15,
      emissive: 0x2a3f5f,
      emissiveIntensity: 0.7
    })
  )
  leftShoulder.position.set(-0.7, 2.1, 0)
  leftShoulder.scale.set(1.2, 0.8, 0.8)
  group.add(leftShoulder)

  const rightShoulder = leftShoulder.clone()
  rightShoulder.position.set(0.7, 2.1, 0)
  group.add(rightShoulder)

  // Arms - cosmic energy limbs
  const armMat = new MeshStandardMaterial({
    color: 0x3a5f7f,
    metalness: 0.7,
    roughness: 0.3,
    emissive: 0x2a4f6f,
    emissiveIntensity: 0.5
  })
  
  const leftArm = new Mesh(new CylinderGeometry(0.18, 0.16, 1.2, 16), armMat)
  leftArm.position.set(-0.75, 1.4, 0)
  leftArm.rotation.z = 0.3
  group.add(leftArm)

  const rightArm = leftArm.clone()
  rightArm.position.set(0.75, 1.4, 0)
  rightArm.rotation.z = -0.3
  group.add(rightArm)

  // Cosmic collar/neckpiece
  const collar = new Mesh(
    new TorusGeometry(0.55, 0.08, 16, 48),
    new MeshStandardMaterial({ 
      color: 0x5a7fff, 
      metalness: 0.95, 
      roughness: 0.1, 
      emissive: 0x4a6fff, 
      emissiveIntensity: 1.0 
    })
  )
  collar.rotation.x = Math.PI / 2
  collar.position.y = 2.35
  group.add(collar)

  // HEAD - Glowing cosmic sphere with star particles
  const head = new Mesh(
    new SphereGeometry(0.48, 32, 32),
    new MeshStandardMaterial({ 
      color: 0xffffff, 
      metalness: 0.3, 
      roughness: 0.15, 
      emissive: 0xffeeff, 
      emissiveIntensity: 0.4 
    })
  )
  head.position.y = 2.85
  group.add(head)

  // Constellation crown - star points
  const crownGroup = new Group()
  crownGroup.position.y = 3.2
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const starPoint = new Mesh(
      new ConeGeometry(0.08, 0.35, 8),
      new MeshStandardMaterial({ 
        color: 0xffff00, 
        emissive: 0xffff00, 
        emissiveIntensity: 1.5,
        metalness: 0.9,
        roughness: 0.1
      })
    )
    starPoint.position.set(Math.cos(angle) * 0.5, 0.2, Math.sin(angle) * 0.5)
    starPoint.lookAt(crownGroup.position)
    crownGroup.add(starPoint)
  }
  group.add(crownGroup)

  // CREST DISPLAY - Larger, more visible with better font loading
  const crestCanvas = document.createElement('canvas')
  crestCanvas.width = 512
  crestCanvas.height = 256
  const crestCtx = crestCanvas.getContext('2d') as CanvasRenderingContext2D
  // Pre-fill with transparent
  crestCtx.clearRect(0, 0, crestCanvas.width, crestCanvas.height)
  
  const crestTexture = new CanvasTexture(crestCanvas)
  crestTexture.needsUpdate = true
  
  const crest = new Mesh(
    new PlaneGeometry(2.2, 1.1),
    new MeshBasicMaterial({ 
      map: crestTexture, 
      transparent: true, 
      toneMapped: false,
      side: DoubleSide,
      depthWrite: false
    })
  )
  crest.position.set(0, 1.6, 0.85)
  crest.renderOrder = 999
  group.add(crest)

  sceneRef.add(group)

  return {
    group,
    body: torso,
    aura,
    crest,
    crestCanvas,
    crestCtx,
    crestTexture,
    palette: 'sun'
  }
}

function updateAvatar(avatar: Avatar | null, signName: string, traits: string[], paletteKey: StagePalette, active: boolean) {
  if (!avatar) return
  avatar.palette = paletteKey
  avatar.group.visible = true
  const paletteColor = PALETTES[paletteKey]
  const inactiveColor = 0x2a3f5f
  const bodyMat = avatar.body.material as MeshStandardMaterial
  bodyMat.color.setHex(active ? paletteColor : inactiveColor)
  bodyMat.emissive.setHex(active ? paletteColor : 0x1a2f4f)
  bodyMat.emissiveIntensity = active ? 1.2 : 0.4

  const auraMat = avatar.aura.material as MeshStandardMaterial
  auraMat.emissive.setHex(paletteColor)
  auraMat.emissiveIntensity = active ? 1.5 : 0.3
  auraMat.opacity = active ? 0.95 : 0.4

  // FIXED: Draw canvas text with fallback fonts and better visibility
  const crestCtx = avatar.crestCtx
  const canvas = avatar.crestCanvas
  crestCtx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Strong background for visibility
  crestCtx.fillStyle = active ? 'rgba(10,15,30,0.95)' : 'rgba(10,15,30,0.6)'
  crestCtx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Glowing border
  crestCtx.strokeStyle = active ? `rgba(${paletteColor >> 16 & 0xff},${paletteColor >> 8 & 0xff},${paletteColor & 0xff},0.9)` : 'rgba(100,120,150,0.4)'
  crestCtx.lineWidth = 8
  crestCtx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)
  
  // Inner glow
  crestCtx.strokeStyle = active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
  crestCtx.lineWidth = 2
  crestCtx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32)
  
  // Text with multiple fallbacks and glow
  crestCtx.textAlign = 'center'
  crestCtx.textBaseline = 'middle'
  crestCtx.shadowColor = active ? `rgba(${paletteColor >> 16 & 0xff},${paletteColor >> 8 & 0xff},${paletteColor & 0xff},0.8)` : 'rgba(0,0,0,0.5)'
  crestCtx.shadowBlur = 20
  crestCtx.fillStyle = '#ffffff'
  crestCtx.font = 'bold 48px "Press Start 2P", "Courier New", monospace'
  crestCtx.fillText(signName.toUpperCase(), canvas.width / 2, 80)
  
  // Traits with smaller font
  crestCtx.shadowBlur = 12
  crestCtx.fillStyle = active ? '#e0f0ff' : '#a0b0c0'
  crestCtx.font = 'bold 28px "Press Start 2P", "Courier New", monospace'
  const traitsLine = traits.slice(0, 2).join(' • ')
  crestCtx.fillText(traitsLine.toUpperCase(), canvas.width / 2, 160)
  
  avatar.crestTexture.needsUpdate = true

  avatar.group.scale.setScalar(active ? 1.08 : 0.92)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ')
  let line = ''
  let cursorY = y
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, cursorY)
      line = word
      cursorY += lineHeight
    } else {
      line = testLine
    }
  }
  if (line) ctx.fillText(line, x, cursorY)
}

function refreshLabel(ped: Pedestal, state: PedestalVisualState, title?: string, desc?: string) {
  if (title !== undefined) ped.labelTitle = title
  if (desc !== undefined) ped.labelDesc = desc
  ped.labelState = state
  const hasContent = ped.labelTitle.trim().length > 0
  if (!hasContent || state === 'inactive') {
    ped.plaque.visible = false
    return
  }
  ped.plaque.visible = true
  const { ctx, canvas } = ped
  const theme = LABEL_THEMES[state] ?? LABEL_THEMES.idle
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)
  
  // IMPROVED: Stronger background for better visibility
  ctx.fillStyle = theme.bg.replace('0.78', '0.95')
  ctx.fillRect(0, 0, width, height)
  
  // Outer glow border
  ctx.strokeStyle = theme.border
  ctx.lineWidth = 10
  ctx.lineJoin = 'round'
  ctx.strokeRect(10, 10, width - 20, height - 20)
  
  // Inner highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 3
  ctx.strokeRect(18, 18, width - 36, height - 36)

  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 15

  // Title with fallback fonts
  ctx.fillStyle = theme.title
  ctx.font = 'bold 32px "Press Start 2P", "Courier New", monospace'
  wrapText(ctx, ped.labelTitle.toUpperCase(), 36, 36, width - 72, 42)

  // Description with better contrast
  ctx.shadowBlur = 10
  ctx.fillStyle = theme.desc
  ctx.font = 'bold 22px "Press Start 2P", "Courier New", monospace'
  wrapText(ctx, ped.labelDesc, 36, 130, width - 72, 32)

  ped.texture.needsUpdate = true
}

function applyPedestalLayout(count: number, paletteKey: StagePalette, offsetX = 0, offsetZ = -3.6) {
  const palette = PALETTES[paletteKey]
  const fallback = LAYOUTS[Math.min(5, Math.max(1, count))] ?? [0]
  const positions: number[] = LAYOUTS[count] ?? fallback
  activePedestals.value = count

  pedestals.forEach((ped, index) => {
    const base = ped.base
    const halo = ped.halo
    const plaque = ped.plaque
    if (index < count) {
      const x = offsetX + (positions[index] ?? 0)
      const z = offsetZ
      base.visible = true
      halo.visible = true
      base.position.set(x, base.position.y, z)
      halo.position.set(x, halo.position.y, z)
      plaque.position.set(x, plaque.position.y, z + 0.05)
      ped.palette = palette
      ped.labelTitle = ''
      ped.labelDesc = ''
      refreshLabel(ped, 'inactive')
    } else {
      base.visible = false
      halo.visible = false
      plaque.visible = false
      ped.labelTitle = ''
      ped.labelDesc = ''
      ped.labelState = 'inactive'
    }
  })
}

function setPedestalContent(index: number, title: string, desc: string, paletteKey: StagePalette) {
  const ped = pedestals[index]
  if (!ped) return
  ped.palette = PALETTES[paletteKey]
  refreshLabel(ped, 'idle', title, desc)
  ped.base.visible = true
  ped.halo.visible = true
  const isZodiac = paletteKey !== 'aspects'
  const scaleFactor = isZodiac ? 0.65 : 1
  ped.base.scale.set(scaleFactor, isZodiac ? 0.55 : 1, scaleFactor)
  ped.halo.scale.setScalar(isZodiac ? 0.85 : 1)
  ped.plaque.position.y = isZodiac ? 2.05 : 1.55
  setPedestalState(index, 'idle')
}

function setAllPedestalsIdle() {
  for (let i = 0; i < activePedestals.value; i++) {
    setPedestalState(i, 'idle')
  }
}

function setPedestalState(index: number, state: PedestalState) {
  const ped = pedestals[index]
  if (!ped || !ped.base.visible) return
  const baseMat = ped.base.material as MeshStandardMaterial
  const haloMat = ped.halo.material as MeshStandardMaterial

  ped.base.scale.y = state === 'success' ? 1.18 : state === 'failure' ? 0.95 : 1
  ped.halo.scale.setScalar(state === 'focus' ? 1.05 : state === 'success' ? 1.08 : 1)

  switch (state) {
    case 'idle':
      baseMat.emissive.setHex(ped.palette)
      baseMat.emissiveIntensity = 0.6
      haloMat.emissive.setHex(ped.palette)
      haloMat.emissiveIntensity = 0.9
      haloMat.opacity = 0.75
      break
    case 'focus':
      baseMat.emissive.setHex(ped.palette)
      baseMat.emissiveIntensity = 1.0
      haloMat.emissive.setHex(ped.palette)
      haloMat.emissiveIntensity = 1.1
      haloMat.opacity = 0.85
      break
    case 'success':
      baseMat.emissive.setHex(0x00ffab)
      baseMat.emissiveIntensity = 1.4
      haloMat.emissive.setHex(0x00fffb)
      haloMat.emissiveIntensity = 1.3
      haloMat.opacity = 1
      break
    case 'failure':
      baseMat.emissive.setHex(0xff3366)
      baseMat.emissiveIntensity = 1.2
      haloMat.emissive.setHex(0xff4f88)
      haloMat.emissiveIntensity = 1.1
      haloMat.opacity = 0.85
      break
  }

  refreshLabel(ped, state)
}

function setZodiacPedestalLabels(sceneRef: TrialScene | null, paletteKey: StagePalette, signName: string, active: boolean) {
  if (!sceneRef) return
  if (!active) {
    pedestals.forEach((ped) => {
      ped.base.visible = false
      ped.halo.visible = false
      ped.plaque.visible = false
      ped.labelTitle = ''
      ped.labelDesc = ''
      ped.labelState = 'inactive'
    })
    return
  }

  sceneRef.options.forEach((option, idx) => {
    const title = `${signName.toUpperCase()} // ${option.label}`
    const desc = option.description
    setPedestalContent(idx, title, desc, paletteKey)
  })
  for (let i = sceneRef.options.length; i < activePedestals.value; i++) {
    const ped = pedestals[i]
    if (!ped) continue
    ped.labelTitle = ''
    ped.labelDesc = ''
    refreshLabel(ped, 'inactive')
  }
}

function focusZodiacStage(stage: 'sun' | 'rising') {
  const sceneRef = stage === 'sun' ? currentTrial.sunScene : currentTrial.risingScene
  const signName = stage === 'sun' ? currentTrial.sunSign : currentTrial.risingSign
  const paletteKey: StagePalette = stage === 'sun' ? 'sun' : 'rising'
  const offsetX = stage === 'sun' ? -4 : 4

  applyPedestalLayout(sceneRef?.options.length ?? 0, paletteKey, offsetX, -3.2)
  setZodiacPedestalLabels(sceneRef, paletteKey, signName, true)
  updateAvatar(sunAvatar, currentTrial.sunSign, currentTrial.sunTraits, 'sun', stage === 'sun')
  updateAvatar(risingAvatar, currentTrial.risingSign, currentTrial.risingTraits, 'rising', stage === 'rising')
  selectedZodiacIndex.value = -1
  pedestals.forEach((_, idx) => {
    if (idx < (sceneRef?.options.length ?? 0)) {
      setPedestalState(idx, 'idle')
    }
  })
}

function setAspectPedestalLabels() {
  aspectOptions.forEach((option, idx) => {
    const desc = `${option.window[0]}° – ${option.window[1]}°`
    setPedestalContent(idx, option.label, desc, 'aspects')
  })
}

function buildPedestals(sceneRef: Scene) {
  const baseGeom = new CylinderGeometry(0.8, 0.8, 0.35, 32)
  const haloGeom = new TorusGeometry(1, 0.08, 16, 48)
  const plaqueGeom = new PlaneGeometry(2.5, 1.3)

  for (let i = 0; i < 5; i++) {
    const baseMat = new MeshStandardMaterial({
      color: 0x131621,
      metalness: 0.7,
      roughness: 0.25,
      emissive: 0x05070d,
      emissiveIntensity: 0.4
    })
    const base = new Mesh(baseGeom, baseMat)
    // RAISED: Move pedestals up by 1.5 units to match elevated floor
    base.position.set((i - 2) * 2.5, 1.68, -3.6)  // 0.18 + 1.5 = 1.68
    base.castShadow = true
    base.receiveShadow = true

    const haloMat = new MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f5ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75
    })
    const halo = new Mesh(haloGeom, haloMat)
    halo.rotation.x = Math.PI / 2
    halo.position.set(base.position.x, 2.35, base.position.z)  // 0.85 + 1.5 = 2.35

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    ctx.fillStyle = 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const texture = new CanvasTexture(canvas)
    const plaqueMat = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
      toneMapped: false
    })
    const plaque = new Mesh(plaqueGeom, plaqueMat)
    plaque.position.set(base.position.x, 3.05, base.position.z)  // 1.55 + 1.5 = 3.05
    plaque.renderOrder = 2
    plaque.visible = false

    sceneRef.add(base)
    sceneRef.add(halo)
    sceneRef.add(plaque)
    pedestals.push({
      base,
      halo,
      plaque,
      canvas,
      ctx,
      texture,
      palette: 0x00f5ff,
      labelTitle: '',
      labelDesc: '',
      labelState: 'inactive'
    })
  }
}

onMounted(async () => {
  destroyed = false
  setupVisibilityGuards()
  if (!scene) {
    await initializeRenderer()
  }
})

onBeforeUnmount(() => {
  destroyed = true
  cleanupRun()
  teardownRenderer()
  clearCanvasCleanups()
  cleanupFns.forEach((fn) => fn())
  cleanupFns.length = 0
  resumeTimerOnFocus = false
})

const emit = defineEmits<{ (e: 'exit'): void }>()
</script>

<style scoped>
.stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: radial-gradient(circle at center, #10131d 0%, #05070c 100%);
  /* Establish stacking context for proper layering */
  isolation: isolate;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  /* Canvas is the base 3D layer - always behind UI */
  z-index: 1;
}

.ui {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  right: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  pointer-events: none;
  z-index: 20;
}

.hud {
  display: flex;
  gap: 0.75rem;
  pointer-events: auto;
}

.chip {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  padding: 0.6rem 0.9rem;
  background: rgba(8, 12, 18, 0.8);
  border: 1px solid rgba(0, 245, 255, 0.4);
  color: #e5f9ff;
  text-shadow: 0 0 8px rgba(0, 245, 255, 0.6);
  box-shadow: 0 0 14px rgba(0, 245, 255, 0.2);
}

.chip.danger {
  border-color: rgba(255, 82, 117, 0.8);
  color: #ff8ca8;
  text-shadow: 0 0 8px rgba(255, 82, 117, 0.6);
  box-shadow: 0 0 16px rgba(255, 82, 117, 0.25);
}

.exit-btn {
  pointer-events: auto;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.65rem;
  padding: 0.65rem 1rem;
  background: rgba(8, 12, 18, 0.85);
  border: 1px solid rgba(255, 0, 153, 0.5);
  color: #ffd9f0;
  text-shadow: 0 0 10px rgba(255, 0, 153, 0.5);
  transition: background 0.2s ease;
}

.exit-btn:hover {
  background: rgba(255, 0, 153, 0.2);
}

.mode-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  background: rgba(3, 5, 9, 0.88);
  backdrop-filter: blur(12px);
  text-align: center;
  z-index: 30;
}

.mode-card h1 {
  font-family: 'Press Start 2P', monospace;
  font-size: 2rem;
  color: #00f5ff;
  text-shadow: 0 0 20px rgba(0, 245, 255, 0.8);
}

.mode-card p {
  font-size: 0.9rem;
  color: #a6b7d4;
  max-width: 22rem;
}

.mode-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  padding: 1rem 2.4rem;
  background: #05070c;
  color: #ffffff;
  border: 2px solid rgba(0, 245, 255, 0.6);
  box-shadow: 0 0 18px rgba(0, 245, 255, 0.35);
  transition: background 0.2s ease, color 0.2s ease;
}

.mode-btn:hover {
  background: #00f5ff;
  color: #05070c;
}

.mode-link {
  font-family: 'Press Start 2P', monospace;
  background: none;
  border: none;
  color: #8aa0ff;
  text-decoration: underline;
  cursor: pointer;
}

.panel {
  position: absolute;
  /* DEFAULT: centered at bottom for aspects mode */
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%) translateZ(0);
  width: min(32rem, 35vw);
  max-width: 28rem;
  background: rgba(3, 6, 12, 0.92);
  border: 1px solid rgba(0, 245, 255, 0.25);
  padding: 1.4rem 1.6rem;
  border-radius: 1rem;
  backdrop-filter: blur(28px);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  z-index: 25;
  pointer-events: auto;
  /* Ensure panel stays in 2D UI layer, never clips into 3D */
  will-change: transform;
  isolation: isolate;
  /* Prevent any possibility of rendering behind 3D */
  -webkit-transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* SUPER WIDE HORIZONTAL LAYOUT - Shows 3D objects clearly above */
.panel.zodiac.zodiac--sun,
.panel.zodiac.zodiac--rising {
  /* Bottom center, SUPER WIDE to stay below 3D objects */
  top: auto !important;
  bottom: 1rem !important;
  left: 50% !important;
  right: auto !important;
  transform: translateX(-50%) translateZ(0) !important;
  /* SUPER WIDE - almost full screen width */
  width: min(95vw, 120rem) !important;
  max-width: 95vw !important;
  /* Compact height since we're going horizontal */
  padding: 1rem 1.5rem !important;
  /* Stronger backdrop to separate from 3D */
  background: rgba(3, 6, 12, 0.95) !important;
  backdrop-filter: blur(32px) !important;
  /* Aggressive shadow to enforce layering */
  box-shadow: 
    0 -4px 48px rgba(0, 0, 0, 0.8),
    0 0 0 2px rgba(0, 245, 255, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.08) !important;
}

.panel.aspects {
  left: 50%;
  top: auto;
  bottom: 1rem;
  transform: translateX(-50%) translateZ(0);
  /* SUPER WIDE for horizontal layout */
  width: min(95vw, 120rem) !important;
  max-width: 95vw !important;
  padding: 1rem 1.5rem;
  gap: 1.2rem;
  box-shadow: 
    0 -4px 48px rgba(0, 0, 0, 0.8),
    0 0 0 2px rgba(0, 245, 255, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.08);
}

.panel.zodiac .sign-row {
  display: grid;
  /* BALANCED: Side cards smaller, center prompt card BIGGER for readability */
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1rem;
  /* Horizontal layout - super wide, compact height */
  align-items: start;
}

.card {
  padding: 0.7rem 0.9rem;
  background: rgba(10, 15, 25, 0.85);
  border-radius: 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 20px rgba(0, 245, 255, 0.05), 0 0 30px rgba(0, 245, 255, 0.08);
  /* Compact cards for horizontal layout */
}

.card.center {
  /* CENTER PROMPT CARD - Larger, more readable */
  border-color: rgba(255, 0, 153, 0.4);
  background: rgba(15, 20, 35, 0.9);
  padding: 1rem 1.3rem;
  box-shadow: 
    inset 0 0 30px rgba(255, 0, 153, 0.08), 
    0 0 40px rgba(255, 0, 153, 0.12);
}

.card.single {
  /* ASPECT CHALLENGE CARD - Prominent and readable */
  align-self: center;
  width: 100%;
  max-width: 60rem;
  padding: 1.2rem 1.8rem;
  background: rgba(15, 20, 35, 0.9);
  border-color: rgba(255, 221, 60, 0.3);
  box-shadow: 
    inset 0 0 30px rgba(255, 221, 60, 0.08), 
    0 0 40px rgba(255, 221, 60, 0.12);
}

.label {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  color: #8aa0ff;
  margin-bottom: 0.4rem;
}

.card h3 {
  font-size: 1rem;
  color: #ffffff;
  margin: 0 0 0.4rem;
  text-shadow: 0 0 12px rgba(255, 0, 153, 0.5);
  line-height: 1.2;
}

.traits {
  font-size: 0.7rem;
  line-height: 1.3;
  color: #c5d4f7;
}

.ambient {
  font-size: 0.8rem;
  line-height: 1.3;
  color: #7ff6ff;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: bold;
}

.prompt {
  /* LARGER for easy reading - this is the main question */
  font-size: 0.9rem;
  line-height: 1.6;
  color: #ffffff;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  margin-top: 0.3rem;
  text-align: left;
}

/* Make center card labels more prominent */
.card.center .label {
  font-size: 0.6rem;
  color: #ff6bff;
  text-align: center;
}

.card.center .ambient {
  font-size: 0.85rem;
  text-align: center;
}

.card.center .prompt {
  /* MAIN QUESTION - Centered, large, easy to read */
  font-size: 1.05rem;
  line-height: 1.8;
  text-align: center;
  margin-top: 0.5rem;
}

/* Aspect card question also centered and large */
.card.single .label {
  text-align: center;
  font-size: 0.65rem;
}

.card.single .ambient {
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.card.single .prompt {
  text-align: center;
  font-size: 1.1rem;
  line-height: 1.8;
}

.choices {
  /* FLEXBOX for perfect centering - grid was stretching buttons */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  /* UNIFIED CONTAINER - Shows these are connected choices */
  padding: 1rem;
  background: rgba(5, 8, 15, 0.6);
  border: 2px solid rgba(0, 245, 255, 0.3);
  border-radius: 0.8rem;
  box-shadow: 
    inset 0 0 20px rgba(0, 245, 255, 0.08),
    0 0 25px rgba(0, 245, 255, 0.15);
  margin-top: 0.8rem;
}

.choices.multi {
  /* Grid for aspect choices (5 columns) */
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.8rem;
  border-color: rgba(255, 221, 60, 0.3);
  box-shadow: 
    inset 0 0 20px rgba(255, 221, 60, 0.08),
    0 0 25px rgba(255, 221, 60, 0.15);
}

.choices--sun {
  /* Sun stage - magenta accent */
  border-color: rgba(255, 47, 213, 0.4);
  box-shadow: 
    inset 0 0 20px rgba(255, 47, 213, 0.08),
    0 0 25px rgba(255, 47, 213, 0.15);
}

.choices--rising {
  /* Rising stage - cyan accent */
  border-color: rgba(0, 245, 255, 0.4);
  box-shadow: 
    inset 0 0 20px rgba(0, 245, 255, 0.08),
    0 0 25px rgba(0, 245, 255, 0.15);
}

.choices-header {
  /* Header spans full width above choices */
  width: 100%;
  flex-basis: 100%;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-align: center;
  color: #00f5ff;
  text-shadow: 0 0 12px rgba(0, 245, 255, 0.6);
  padding-bottom: 0.8rem;
  margin-bottom: 0.2rem;
  border-bottom: 1px solid rgba(0, 245, 255, 0.2);
}

.scroll-hint {
  display: none;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 0.4rem;
}

.choices.multi .choices-header {
  /* Grid version for aspects */
  grid-column: 1 / -1;
}

.choices--sun .choices-header {
  color: #ff2fd5;
  text-shadow: 0 0 12px rgba(255, 47, 213, 0.6);
  border-bottom-color: rgba(255, 47, 213, 0.2);
}

.choices.multi .choices-header {
  color: #ffd23c;
  text-shadow: 0 0 12px rgba(255, 210, 60, 0.6);
  border-bottom-color: rgba(255, 210, 60, 0.2);
}

.choice-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.8rem 1rem;
  background: rgba(8, 12, 20, 0.7);
  border: 1px solid rgba(0, 245, 255, 0.25);
  border-radius: 0.6rem;
  text-align: left;
  color: #e7f7ff;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
  /* Fixed width so buttons stay together centered in flexbox */
  width: min(16rem, 100%);
  flex-shrink: 0;
}

.choices.multi .choice-btn {
  /* Aspect buttons use grid, so width auto */
  width: 100%;
}

.choice-btn:hover:not([disabled]) {
  transform: translateY(-4px);
  border-color: rgba(0, 245, 255, 0.6);
  box-shadow: 0 14px 30px rgba(0, 245, 255, 0.18);
}

.choice-btn[disabled] {
  cursor: default;
  opacity: 0.82;
}

.choice-btn .title {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.65rem;
  margin-bottom: 0.35rem;
  color: #ffffff;
  line-height: 1.3;
}

.choice-btn .desc {
  font-size: 0.75rem;
  color: #a6b7d4;
  line-height: 1.4;
}

.choice-btn.chosen {
  border-color: rgba(255, 0, 153, 0.5);
  box-shadow: 0 12px 28px rgba(255, 0, 153, 0.18);
}

.choice-btn.success {
  border-color: rgba(0, 255, 171, 0.7);
  box-shadow: 0 12px 28px rgba(0, 255, 171, 0.2);
  background: rgba(0, 255, 171, 0.15);
}

.choice-btn.fail {
  border-color: rgba(255, 82, 117, 0.7);
  box-shadow: 0 12px 28px rgba(255, 82, 117, 0.2);
  background: rgba(255, 82, 117, 0.15);
}

.choice-btn.highlight {
  border-color: rgba(255, 221, 109, 0.7);
  box-shadow: 0 12px 28px rgba(255, 221, 109, 0.2);
}

.choice-btn.inactive {
  opacity: 0.6;
}

.narrative {
  margin-top: 0.5rem;
}

.narrative p {
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

.feedback {
  text-align: center;
  margin-top: 0.5rem;
}

.feedback p {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
}

.feedback .detail {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: #a8b8d8;
  line-height: 1.4;
}

.success {
  color: #00ffab;
  text-shadow: 0 0 14px rgba(0, 255, 171, 0.6);
}

.fail {
  color: #ff4f88;
  text-shadow: 0 0 14px rgba(255, 79, 136, 0.6);
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(4, 6, 12, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(14px);
  z-index: 40;
}

.overlay-card {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 2.4rem 2.8rem;
  background: rgba(8, 12, 20, 0.85);
  border: 1px solid rgba(0, 245, 255, 0.3);
  border-radius: 1.2rem;
  text-align: center;
  box-shadow: 0 0 30px rgba(0, 245, 255, 0.22);
}

.overlay-card h2 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.1rem;
  color: #ffffff;
  text-shadow: 0 0 16px rgba(255, 0, 153, 0.55);
}

.overlay-card p {
  font-size: 0.9rem;
  color: #c9d9f5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.28s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 960px) {
  .ui {
    top: 0.85rem;
    left: 0.85rem;
    right: 0.85rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .hud {
    gap: 0.5rem;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .chip {
    flex: 1 1 45%;
    font-size: 0.65rem;
    padding: 0.45rem 0.55rem;
    text-align: center;
  }

  .exit-btn {
    align-self: flex-end;
    padding: 0.5rem 0.85rem;
    font-size: 0.6rem;
  }

  .panel {
    width: 98vw !important;
    max-width: 98vw !important;
    padding: 0.8rem 0.7rem !important;
    max-height: 35vh;
    overflow-y: auto;
    bottom: 0.5rem !important;
  }

  .panel.zodiac.zodiac--sun,
  .panel.zodiac.zodiac--rising {
    /* Stay at bottom center on mobile */
    bottom: 0.5rem !important;
    left: 50% !important;
    transform: translateX(-50%) translateZ(0) !important;
  }

  .panel.zodiac .sign-row {
    /* On mobile, stack vertically but keep center card prominent */
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
  
  .card.center {
    /* Center card stays larger on mobile */
    padding: 0.9rem 1rem;
  }
  
  .card.center .prompt {
    font-size: 0.8rem;
  }

  .choices {
    /* Flexbox stays centered on mobile */
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.8rem;
  }

  .scroll-hint {
    display: block;
    color: rgba(255, 255, 255, 0.75);
    text-align: center;
  }

  .choices.multi {
    grid-template-columns: repeat(2, 1fr);
  }

  .choices.multi .scroll-hint,
  .choices.multi .choices-header {
    grid-column: 1 / -1;
  }
  
  .choice-btn {
    width: 100%;
    max-width: 100%;
  }
  
  .choices-header {
    font-size: 0.6rem;
    padding-bottom: 0.6rem;
  }

  .card {
    padding: 0.6rem 0.7rem;
  }
  
  .card h3 {
    font-size: 0.85rem;
  }
  
  .label {
    font-size: 0.5rem;
  }
  
  .choice-btn {
    padding: 0.6rem 0.8rem;
  }
  
  .choice-btn .title {
    font-size: 0.55rem;
  }
  
  .choice-btn .desc {
    font-size: 0.65rem;
  }
}

@media (max-width: 540px) {
  .chip {
    font-size: 0.55rem;
    letter-spacing: 0.05em;
  }

  .mode-card h1 {
    font-size: 1.6rem;
  }

  .mode-card p {
    font-size: 0.8rem;
  }

  .mode-btn {
    font-size: 0.7rem;
    padding: 0.85rem 1.6rem;
  }

  .choices.multi {
    grid-template-columns: 1fr;
  }

  .choice-btn {
    width: 100%;
  }

  .panel {
    padding: 1rem 0.9rem 1.4rem !important;
  }
}
</style>

