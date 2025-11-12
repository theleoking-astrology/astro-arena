<template>
  <div ref="root" class="game-root">
    <!-- CRT Screen Container -->
    <div class="crt-screen">
      <div class="crt-overlay"></div>
      <div class="scanlines"></div>
      
      <canvas ref="starfield" class="bg-layer"></canvas>
      <canvas ref="particles" class="particle-layer"></canvas>

      <!-- Game Content -->
      <div class="game-container">
        
        <!-- Title Screen -->
        <div v-if="!active" class="title-screen">
          <div class="pixel-title">
            <h1 class="glitch-text">ASTRO ARENA</h1>
            <p class="subtitle-pixel">ZODIAC COMBAT SIMULATOR v1.0</p>
            <p class="blink-text">PRESS START</p>
  </div>

          <div class="mode-select-grid">
            <button class="retro-btn retro-btn--purple" @click="start('aspects')">
              <span class="btn-bracket">[</span> ASPECT CLASH <span class="btn-bracket">]</span>
            </button>
            <button class="retro-btn retro-btn--cyan" @click="start('signs')">
              <span class="btn-bracket">[</span> ZODIAC TRIALS <span class="btn-bracket">]</span>
            </button>
            <button class="retro-btn retro-btn--green" @click="enter3D">
              <span class="btn-bracket">[</span> 3D ARENA <span class="btn-bracket">]</span>
            </button>
          </div>
        </div>

        <!-- Game HUD (always visible when active) -->
        <div v-if="active" class="game-hud">
          <div class="hud-row">
            <div class="hud-stat">
              <span class="hud-label">SCORE</span>
              <span class="hud-value pixel-glow">{{ score.toString().padStart(6, '0') }}</span>
            </div>
            <div class="hud-stat">
              <span class="hud-label">STREAK</span>
              <div class="streak-bar">
                <div class="streak-fill" :style="{ width: Math.min(100, streak * 10) + '%' }"></div>
                <span class="streak-num">x{{ streak }}</span>
              </div>
            </div>
            <div class="hud-stat">
              <span class="hud-label">TIME</span>
              <span class="hud-value" :class="{ critical: timeLeft < 10 }">{{ Math.max(0, timeLeft).toFixed(0).padStart(2, '0') }}</span>
            </div>
            <div class="hud-stat">
              <span class="hud-label">POWER</span>
              <span class="hud-value power-glow">x{{ multiplier.toFixed(2) }}</span>
            </div>
          </div>
          <button class="pixel-btn pixel-btn--small exit-btn" @click="exit">EXIT</button>
          <button class="pixel-btn pixel-btn--small restart-btn" @click="restart">RESTART</button>
        </div>

        <!-- ASPECT CLASH MODE -->
        <transition name="fade-game">
          <div v-if="active && mode === 'aspects'" class="game-scene">
            <div class="scene-title">
              <h2 class="mode-header">== ASPECT CLASH ==</h2>
            </div>
            
            <div class="aspect-display">
              <div class="planet-card">
                <div class="pixel-border"></div>
                <span class="planet-name">{{ aspect.planetA }}</span>
              </div>
              <div class="angle-display">
                <span class="angle-value pixel-glow-pink">{{ aspect.angle.toFixed(0) }}°</span>
              </div>
              <div class="planet-card">
                <div class="pixel-border"></div>
                <span class="planet-name">{{ aspect.planetB }}</span>
              </div>
            </div>

            <div class="choice-list">
              <button
                v-for="a in aspectOptions"
                :key="a.key"
                class="game-choice"
                :class="{ hint: hintState === a.key }"
                @click="guessAspect(a.key, $event)"
              >
                <span class="choice-bracket">&gt;</span> {{ a.label }}
                <span class="choice-hint">{{ a.window[0] }}-{{ a.window[1] }}°</span>
              </button>
            </div>

            <div class="feedback-line">
              <p v-if="feedback === 'correct'" class="msg-success">✓ CORRECT</p>
              <p v-else-if="feedback === 'wrong'" class="msg-fail">✗ WRONG</p>
            </div>
          </div>
        </transition>

        <!-- ZODIAC TRIALS MODE -->
        <transition name="fade-game">
          <div v-if="active && mode === 'signs'" class="game-scene zodiac-scene">
            <div class="scene-title">
              <h2 class="mode-header">== ZODIAC TRIALS ==</h2>
              <p class="stage-label">{{ stageHeading.toUpperCase() }}</p>
            </div>

            <!-- First-Person Viewport -->
            <div class="fp-game-view">
              <!-- Parallax Background Layers -->
              <div class="parallax-bg" :style="{ transform: `translateX(${parallaxOffset}px)` }">
                <div class="bg-layer-far"></div>
                <div class="bg-layer-mid"></div>
                <div class="bg-layer-near"></div>
              </div>

              <!-- Street View with Grid -->
              <div class="street-view">
                <div class="horizon-line"></div>
                <div class="street-grid" :style="{ transform: `translateY(${gridOffset}px)` }">
                  <div v-for="i in 20" :key="i" class="grid-line"></div>
                </div>
              </div>

              <!-- Character/Player Indicator -->
              <div class="player-sprite">
                <div class="sprite-box" :class="{ walking: isWalking }"></div>
              </div>

              <!-- Scene Prompt Box (top) -->
              <div class="prompt-box pixel-panel">
                <div class="panel-header">
                  <span>SUN: {{ currentTrial.sunSign }}</span>
                  <span class="separator">|</span>
                  <span>RISING: {{ currentTrial.risingSign }}</span>
                </div>
                <p class="prompt-text">{{ currentScene?.prompt ?? 'Loading...' }}</p>
                <p class="ambient-text">{{ currentScene?.ambient ?? '' }}</p>
              </div>
            </div>

            <!-- Choice Buttons (bottom) -->
            <div class="choice-panel">
              <p class="instruction-text">{{ stageInstruction }}</p>
              <div class="game-choices">
                <button
                  v-for="(option, idx) in currentScene?.options ?? []"
                  :key="option.id"
                  class="game-choice game-choice--zodiac"
                  :class="{
                    hint: hintState === option.id,
                    focused: focusIndex === idx && !sceneLocked,
                    chosen: selectedOptionId === option.id,
                    correct: selectedOptionId === option.id && option.isCorrect && trialMood === 'success',
                    incorrect: selectedOptionId === option.id && !option.isCorrect && trialMood === 'failure'
                  }"
                  :disabled="sceneLocked"
                  @click="resolveTrialOption(option, $event)"
                >
                  <span class="choice-bracket">&gt;</span>
                  <div class="choice-content">
                    <span class="choice-action">{{ option.label }}</span>
                    <span class="choice-desc">{{ option.description }}</span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Narrative Outcome -->
            <div v-if="trialNarrative" class="narrative-box pixel-panel">
              <p :class="['narrative-text', trialMood === 'success' ? 'success-text' : 'fail-text']">
                {{ trialNarrative }}
              </p>
            </div>

            <!-- Feedback Messages -->
            <div class="feedback-display">
              <p v-if="feedback === 'correct'" class="msg-success pixel-shake">✓ ENERGY ALIGNED</p>
              <p v-else-if="feedback === 'wrong'" class="msg-fail pixel-shake">✗ COSMIC MISREAD</p>
              <p v-if="feedbackDetail" class="msg-detail">{{ feedbackDetail }}</p>
            </div>

            <!-- Power-Ups Display -->
            <div v-if="activePowerUps.length" class="powerup-panel">
              <div v-for="p in activePowerUps" :key="p.kind" class="powerup-pill">
                <span class="powerup-icon">★</span>
                {{ p.kind }} [{{ p.remaining.toFixed(0) }}s]
              </div>
            </div>
          </div>
        </transition>

      </div>
    </div>

    <!-- Flash overlay -->
    <div v-show="flash" class="flash-overlay"></div>

    <!-- Retro Footer -->
    <div v-if="!mode3D" class="retro-footer">
      <p>© 2025 HYPERGATE AI // COSMIC INTELLIGENCE DIVISION</p>
    </div>
  </div>

  <!-- 3D Mode -->
  <Game3D v-if="mode3D" @exit="exit3D" />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import Game3D from './ui/Game3D.vue'
import {
  type SignName,
  type TrialScene,
  type TrialOption,
  makeTrial
} from '@/data/zodiac'
import { ASPECTS, aspectOptions, makeAspect } from '@/data/aspects'

const active = ref(false)
const mode3D = ref(false)
const mode = ref<'aspects' | 'signs'>('aspects')
const feedback = ref<'correct' | 'wrong' | ''>('')
const feedbackDetail = ref('')
const score = ref(0)
const streak = ref(0)
const multiplier = ref(1)
const roundTime = 45
const timeLeft = ref(roundTime)
let timerId: number | null = null

const root = ref<HTMLElement | null>(null)
const particles = ref<HTMLCanvasElement | null>(null)
const starfield = ref<HTMLCanvasElement | null>(null)
let pctx: CanvasRenderingContext2D | null = null
let sctx: CanvasRenderingContext2D | null = null
let rafId = 0
const flash = ref(false)

// Parallax animation state
const parallaxOffset = ref(0)
const gridOffset = ref(0)
const isWalking = ref(false)
let parallaxAnimId = 0

function animateParallax() {
  if (active.value && mode.value === 'signs' && !sceneLocked.value) {
    parallaxOffset.value -= 0.8
    if (parallaxOffset.value < -800) parallaxOffset.value = 0
    gridOffset.value += 2
    if (gridOffset.value > 40) gridOffset.value = 0
    isWalking.value = true
  } else {
    isWalking.value = false
  }
  parallaxAnimId = window.requestAnimationFrame(animateParallax)
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
}
let particlesPool: Particle[] = []

function spawnBurst(x: number, y: number, color: string, count = 60, spread = 2) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = (Math.random() * 2 + 0.5) * spread
    particlesPool.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      max: 1,
      size: Math.random() * 3 + 2,
      color
    })
  }
  flash.value = true
  window.setTimeout(() => (flash.value = false), 80)
}

function renderParticles() {
  if (!pctx || !particles.value) return
  const canvas = particles.value
  pctx.clearRect(0, 0, canvas.width, canvas.height)
  particlesPool = particlesPool.filter((p) => p.life > 0)
  for (const particle of particlesPool) {
    particle.x += particle.vx
    particle.y += particle.vy
    particle.vx *= 0.98
    particle.vy *= 0.98
    particle.life -= 0.02
    pctx.globalAlpha = Math.max(0, particle.life)
    pctx.beginPath()
    pctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    pctx.fillStyle = particle.color
    pctx.fill()
  }
}

interface Star {
  x: number
  y: number
  z: number
}
let stars: Star[] = []

function initStars() {
  const canvas = starfield.value
  if (!canvas) return
  const w = canvas.width
  const h = canvas.height
  stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    z: Math.random() * 1 + 0.2
  }))
}

function renderStars() {
  if (!sctx || !starfield.value) return
  const canvas = starfield.value
  sctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const star of stars) {
    star.x -= star.z * 0.5
    if (star.x < 0) star.x = canvas.width
    sctx.globalAlpha = star.z * 0.8
    sctx.fillStyle = '#a78bfa'
    const size = Math.floor(1.5 * star.z)
    sctx.fillRect(Math.floor(star.x), Math.floor(star.y), size, size)
  }
}

function animationLoop() {
  renderStars()
  renderParticles()
  rafId = window.requestAnimationFrame(animationLoop)
}

function resizeCanvases() {
  const dpr = window.devicePixelRatio || 1
  for (const canvas of [particles.value, starfield.value]) {
    if (!canvas) continue
    canvas.width = Math.floor(canvas.clientWidth * dpr)
    canvas.height = Math.floor(canvas.clientHeight * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  initStars()
}

onMounted(() => {
  if (particles.value) pctx = particles.value.getContext('2d')
  if (starfield.value) sctx = starfield.value.getContext('2d')
  resizeCanvases()
  window.addEventListener('resize', resizeCanvases)
  window.addEventListener('keydown', handleKeydown)
  animationLoop()
  animateParallax()
})

onUnmounted(() => {
  window.cancelAnimationFrame(rafId)
  window.cancelAnimationFrame(parallaxAnimId)
  window.removeEventListener('resize', resizeCanvases)
  window.removeEventListener('keydown', handleKeydown)
  stopAmbient()
})

let audioCtx: AudioContext | null = null

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
}

function tone(freq: number, dur = 0.12, type: OscillatorType = 'sine', gain = 0.06) {
  ensureAudio()
  const ctx = audioCtx!
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.value = freq
  gainNode.gain.value = gain
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + dur)
}

function sfxCorrect() {
  tone(880, 0.08)
  window.setTimeout(() => tone(1108, 0.08), 50)
  window.setTimeout(() => tone(1318, 0.1), 100)
}

function sfxWrong() {
  tone(180, 0.22, 'square', 0.09)
  window.setTimeout(() => tone(140, 0.16, 'square', 0.07), 50)
}

function sfxPower() {
  tone(659.25, 0.08, 'triangle', 0.08)
  window.setTimeout(() => tone(783.99, 0.08, 'triangle', 0.08), 60)
  window.setTimeout(() => tone(987.77, 0.1, 'triangle', 0.08), 120)
}

const aspect = reactive({
  planetA: 'Sun',
  planetB: 'Moon',
  angle: 0,
  correct: 'conjunction' as keyof typeof ASPECTS
})

const activePowerUps = reactive<PowerState[]>([])
let timeDecay = 1

const currentTrial = reactive({
  sunSign: 'Aries' as SignName,
  risingSign: 'Leo' as SignName,
  sunScene: null as TrialScene | null,
  risingScene: null as TrialScene | null,
  sunTraits: [] as string[],
  risingTraits: [] as string[]
})

const trialStage = ref<'sun' | 'rising'>('sun')
const sceneLocked = ref(false)
const trialNarrative = ref('')
const trialMood = ref<'success' | 'failure' | ''>('')
const selectedOptionId = ref('')
const focusIndex = ref(0)

const currentScene = computed(() => {
  if (mode.value !== 'signs') return null
  return trialStage.value === 'sun' ? currentTrial.sunScene : currentTrial.risingScene
})
const sceneOptions = computed(() => currentScene.value?.options ?? [])

watch(currentScene, () => {
  focusIndex.value = 0
})

watch(sceneOptions, (options) => {
  if (!options.length) {
    focusIndex.value = 0
    return
  }
  if (focusIndex.value >= options.length) {
    focusIndex.value = options.length - 1
  }
})

const stageHeading = computed(() => (trialStage.value === 'rising' ? 'RISING MOVE' : 'SUN ACTION'))
const stageInstruction = computed(() =>
  trialStage.value === 'rising'
    ? 'Use WASD/Arrows - Enter to select'
    : 'Choose your core instinct - WASD/Enter'
)

type PowerKind = 'Clairvoyance' | 'Time Warp' | 'Double Aura'
interface PowerState {
  kind: PowerKind
  remaining: number
}

function hasPower(kind: PowerKind) {
  return activePowerUps.some((p) => p.kind === kind)
}

function updateMultiplierFromState() {
  const base = Math.min(5, 1 + streak.value * 0.15)
  multiplier.value = hasPower('Double Aura') ? Math.min(10, base * 2) : base
}

function addPower(kind: PowerKind, duration = 7) {
  activePowerUps.push({ kind, remaining: duration })
  sfxPower()
  if (kind === 'Time Warp') timeDecay = 0.4
  if (kind === 'Double Aura') updateMultiplierFromState()
  if (kind === 'Clairvoyance') hintCorrect()
}

function updatePowers(delta: number) {
  for (const power of [...activePowerUps]) {
    power.remaining = Math.max(0, power.remaining - delta)
    if (power.remaining <= 0) {
      const index = activePowerUps.indexOf(power)
      if (index > -1) activePowerUps.splice(index, 1)
    }
  }
  if (!hasPower('Time Warp')) timeDecay = 1
  if (!hasPower('Double Aura')) updateMultiplierFromState()
}

function rollPowerUp() {
  const r = Math.random()
  if (r < 0.2) addPower('Clairvoyance')
  else if (r < 0.35) addPower('Time Warp')
  else if (r < 0.45) addPower('Double Aura')
}

interface AmbientProfile {
  freq: number
  type: OscillatorType
  gain: number
}

const AMBIENT_PROFILES: Record<SignName, { sun: AmbientProfile; rising: AmbientProfile }> = {
  Aries: {
    sun: { freq: 160, type: 'sawtooth', gain: 0.018 },
    rising: { freq: 120, type: 'square', gain: 0.015 }
  },
  Taurus: {
    sun: { freq: 110, type: 'sine', gain: 0.02 },
    rising: { freq: 90, type: 'triangle', gain: 0.018 }
  },
  Gemini: {
    sun: { freq: 200, type: 'triangle', gain: 0.017 },
    rising: { freq: 170, type: 'sawtooth', gain: 0.014 }
  },
  Cancer: {
    sun: { freq: 130, type: 'sine', gain: 0.021 },
    rising: { freq: 100, type: 'sine', gain: 0.018 }
  },
  Leo: {
    sun: { freq: 220, type: 'square', gain: 0.02 },
    rising: { freq: 190, type: 'sawtooth', gain: 0.017 }
  },
  Virgo: {
    sun: { freq: 140, type: 'triangle', gain: 0.019 },
    rising: { freq: 115, type: 'sine', gain: 0.016 }
  },
  Libra: {
    sun: { freq: 150, type: 'sine', gain: 0.018 },
    rising: { freq: 130, type: 'triangle', gain: 0.016 }
  },
  Scorpio: {
    sun: { freq: 95, type: 'square', gain: 0.019 },
    rising: { freq: 85, type: 'sawtooth', gain: 0.017 }
  },
  Sagittarius: {
    sun: { freq: 210, type: 'sawtooth', gain: 0.018 },
    rising: { freq: 175, type: 'square', gain: 0.016 }
  },
  Capricorn: {
    sun: { freq: 100, type: 'triangle', gain: 0.017 },
    rising: { freq: 85, type: 'sine', gain: 0.015 }
  },
  Aquarius: {
    sun: { freq: 205, type: 'square', gain: 0.018 },
    rising: { freq: 185, type: 'triangle', gain: 0.016 }
  },
  Pisces: {
    sun: { freq: 115, type: 'sine', gain: 0.021 },
    rising: { freq: 95, type: 'triangle', gain: 0.018 }
  }
}

let ambientOsc: OscillatorNode | null = null
let ambientGain: GainNode | null = null

function stopAmbient() {
  if (!ambientOsc || !ambientGain || !audioCtx) return
  const ctx = audioCtx
  try {
    ambientGain.gain.cancelScheduledValues(ctx.currentTime)
    ambientGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
  } catch {
    // ignore
  }
  const osc = ambientOsc
  window.setTimeout(() => {
    try {
      osc.stop()
    } catch {
      // already stopped
    }
    osc.disconnect()
  }, 280)
  ambientOsc = null
  ambientGain = null
}

function startAmbient(profile: AmbientProfile) {
  ensureAudio()
  const ctx = audioCtx!
  stopAmbient()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = profile.type
  osc.frequency.value = profile.freq
  gain.gain.value = 0.0001
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  try {
    gain.gain.linearRampToValueAtTime(profile.gain, ctx.currentTime + 0.6)
  } catch {
    gain.gain.value = profile.gain
  }
  ambientOsc = osc
  ambientGain = gain
}

function updateAmbientForStage() {
  if (!active.value || mode.value !== 'signs') {
    stopAmbient()
    return
  }
  const sign = trialStage.value === 'sun' ? currentTrial.sunSign : currentTrial.risingSign
  const profiles = AMBIENT_PROFILES[sign]
  const profile = profiles?.[trialStage.value]
  if (!profile) {
    stopAmbient()
    return
  }
  startAmbient(profile)
}

function nextAspect() {
  const data = makeAspect()
  Object.assign(aspect, data)
}

function nextTrial() {
  const data = makeTrial()
  Object.assign(currentTrial, data)
  trialStage.value = 'sun'
  sceneLocked.value = false
  trialNarrative.value = ''
  trialMood.value = ''
  selectedOptionId.value = ''
  hintState.value = ''
  feedbackDetail.value = ''
  if (mode.value === 'signs' && active.value) {
    updateAmbientForStage()
  }
}

function nextRound() {
  if (mode.value === 'aspects') nextAspect()
  else nextTrial()
  hintState.value = ''
}

function start(selectedMode: 'aspects' | 'signs') {
  mode.value = selectedMode
  feedback.value = ''
  feedbackDetail.value = ''
  score.value = 0
  streak.value = 0
  updateMultiplierFromState()
  timeLeft.value = roundTime
  timeDecay = 1
  activePowerUps.splice(0, activePowerUps.length)
  stopTimer()
  nextTick(() => {
    nextRound()
    active.value = true
    focusIndex.value = 0
    if (mode.value === 'signs') {
      updateAmbientForStage()
    } else {
      stopAmbient()
    }
    startTimer()
  })
}

function exit() {
  stopTimer()
  stopAmbient()
  active.value = false
  feedbackDetail.value = ''
  parallaxOffset.value = 0
  gridOffset.value = 0
}

function enter3D() {
  mode3D.value = true
}

function exit3D() {
  mode3D.value = false
}

function restart() {
  stopAmbient()
  if (active.value) {
    start(mode.value)
  } else {
    start(mode.value)
  }
}

function startTimer() {
  stopTimer()
  timerId = window.setInterval(() => {
    timeLeft.value -= 1 * timeDecay
    if (timeLeft.value <= 0) {
      timeLeft.value = 0
      stopTimer()
      active.value = false
    }
    updatePowers(1)
  }, 1000)
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function shake(duration = 250) {
  const el = root.value
  if (!el) return
  el.classList.add('shake')
  window.setTimeout(() => el.classList.remove('shake'), duration)
}

const hintState = ref('')

function hintCorrect() {
  if (mode.value === 'aspects') {
    hintState.value = aspect.correct
  } else {
    const scene = currentScene.value
    const correct = scene?.options.find((option) => option.isCorrect)
    hintState.value = correct ? correct.id : ''
  }
  window.setTimeout(() => {
    hintState.value = ''
  }, 1500)
}

function handleCorrect(clickX: number, clickY: number) {
  feedback.value = 'correct'
  streak.value += 1
  updateMultiplierFromState()
  const baseScore = getBaseScore()
  const points = Math.floor(baseScore * multiplier.value)
  score.value += points
  if (mode.value === 'signs') {
    feedbackDetail.value =
      trialStage.value === 'sun'
        ? 'CORE LOCKED +BONUS'
        : 'RISING VERIFIED +STYLE'
  } else {
    feedbackDetail.value = 'ORBITS SYNCED'
  }
  sfxCorrect()
  spawnBurst(clickX, clickY, '#ff00ff')
  if (streak.value === 5 || streak.value === 10) {
    score.value += 250
    flash.value = true
    window.setTimeout(() => (flash.value = false), 120)
    rollPowerUp()
  }
}

function handleWrong() {
  feedback.value = 'wrong'
  sfxWrong()
  shake()
  streak.value = 0
  updateMultiplierFromState()
  if (mode.value === 'signs') {
    feedbackDetail.value =
      trialStage.value === 'sun'
        ? 'SUN MISFIRE -RESET'
        : 'RISING MISREAD -RECAL'
  } else {
    feedbackDetail.value = 'ASPECT DRIFT'
  }
}

function safeMousePosition(event?: MouseEvent) {
  if (event) return { x: event.clientX, y: event.clientY }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

function getBaseScore() {
  if (mode.value === 'signs') {
    return trialStage.value === 'sun' ? 140 : 110
  }
  return 100
}

function guessAspect(key: string, event?: MouseEvent) {
  const { x, y } = safeMousePosition(event)
  if (key === aspect.correct) {
    handleCorrect(x, y)
    window.setTimeout(() => {
      feedback.value = ''
      feedbackDetail.value = ''
      nextAspect()
    }, 400)
  } else {
    handleWrong()
    window.setTimeout(() => {
      feedback.value = ''
      feedbackDetail.value = ''
    }, 600)
  }
}

function resolveTrialOption(option: TrialOption, event?: MouseEvent) {
  if (sceneLocked.value) return
  const scene = currentScene.value
  if (!scene) return
  sceneLocked.value = true
  selectedOptionId.value = option.id
  const { x, y } = safeMousePosition(event)
  if (option.isCorrect) {
    handleCorrect(x, y)
    trialMood.value = 'success'
    trialNarrative.value = `${option.reaction} ${scene.success}`
  } else {
    handleWrong()
    trialMood.value = 'failure'
    trialNarrative.value = `${option.reaction} ${scene.failure}`
  }

  if (trialStage.value === 'sun') {
    window.setTimeout(() => {
      trialStage.value = 'rising'
      sceneLocked.value = false
      selectedOptionId.value = ''
      trialNarrative.value = ''
      trialMood.value = ''
      feedback.value = ''
      feedbackDetail.value = ''
      if (hintState.value) hintCorrect()
      focusIndex.value = 0
      updateAmbientForStage()
    }, 900)
  } else {
    window.setTimeout(() => {
      feedback.value = ''
      feedbackDetail.value = ''
      nextTrial()
    }, 1100)
  }
}

watch(active, (state) => {
  if (!state) {
    stopTimer()
    stopAmbient()
    feedbackDetail.value = ''
  } else if (mode.value === 'signs') {
    updateAmbientForStage()
  }
})

watch(mode, (value) => {
  if (value !== 'signs') {
    stopAmbient()
  } else if (active.value) {
    updateAmbientForStage()
  }
  if (active.value) nextRound()
})

watch(
  () => trialStage.value,
  () => {
    if (mode.value === 'signs' && active.value) {
      updateAmbientForStage()
    }
  }
)

watch(
  () => [currentTrial.sunSign, currentTrial.risingSign],
  () => {
    if (mode.value === 'signs' && active.value) {
      updateAmbientForStage()
    }
  }
)

function moveFocus(delta: number) {
  const options = sceneOptions.value
  if (!options.length) return
  const next = (focusIndex.value + delta + options.length) % options.length
  focusIndex.value = next
}

function handleKeydown(event: KeyboardEvent) {
  if (!active.value) return
  
  if (mode.value === 'aspects') {
    const key = event.key.toLowerCase()
    const numKeys = ['1', '2', '3', '4', '5']
    const idx = numKeys.indexOf(key)
    if (idx >= 0 && idx < aspectOptions.length) {
      event.preventDefault()
      const option = aspectOptions[idx]
      if (option) {
        guessAspect(option.key, undefined)
      }
    }
    return
  }
  
  if (mode.value === 'signs') {
    if (sceneLocked.value) return
    const options = sceneOptions.value
    if (!options.length) return

    const key = event.key.toLowerCase()
    if (['arrowup', 'w'].includes(key)) {
      event.preventDefault()
      moveFocus(-1)
      return
    }
    if (['arrowdown', 's'].includes(key)) {
      event.preventDefault()
      moveFocus(1)
      return
    }
    if (['arrowleft', 'a'].includes(key)) {
      event.preventDefault()
      moveFocus(-1)
      return
    }
    if (['arrowright', 'd'].includes(key)) {
      event.preventDefault()
      moveFocus(1)
      return
    }
    if (key === 'enter' || key === ' ') {
      event.preventDefault()
      const option = options[focusIndex.value]
      if (option) {
        resolveTrialOption(option)
      }
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.game-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
  font-family: 'Press Start 2P', monospace;
  color: #fff;
  overflow: hidden;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* CRT Screen Effects */
.crt-screen {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, #0a0010 0%, #000000 100%);
  overflow: hidden;
}

.crt-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
  z-index: 100;
}

.crt-overlay {
  position: absolute;
  inset: 0;
  background: 
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.15),
      rgba(0, 0, 0, 0.15) 1px,
      transparent 1px,
      transparent 2px
    );
  pointer-events: none;
  z-index: 99;
  animation: flicker 0.15s infinite;
}

.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(18, 16, 16, 0.1),
    rgba(18, 16, 16, 0.1) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 98;
}

@keyframes flicker {
  0% { opacity: 0.97; }
  50% { opacity: 0.99; }
  100% { opacity: 0.98; }
}

.bg-layer, .particle-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.bg-layer {
  opacity: 0.4;
  z-index: 1;
}

.particle-layer {
  z-index: 50;
  mix-blend-mode: screen;
}

.game-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

/* Title Screen */
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 4rem;
  animation: fadeIn 0.8s ease;
}

.pixel-title h1 {
  font-size: clamp(1.4rem, 5vw, 3rem);
  text-align: center;
  color: #ff00ff;
  text-shadow: 
    3px 3px 0 #00ffff,
    -2px -2px 0 #ff00ff,
    0 0 20px #ff00ff;
  margin: 0;
  letter-spacing: 0.15em;
}

.subtitle-pixel {
  font-size: clamp(0.5rem, 1.5vw, 0.8rem);
  color: #00ffff;
  text-align: center;
  margin-top: 1rem;
  letter-spacing: 0.2em;
}

.blink-text {
  font-size: clamp(0.6rem, 1.8vw, 1rem);
  color: #ffff00;
  text-align: center;
  margin-top: 2rem;
  animation: blink 1.2s infinite;
  letter-spacing: 0.2em;
}

@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.glitch-text {
  animation: glitch 2s infinite;
}

@keyframes glitch {
  0%, 90%, 100% { transform: translate(0); }
  91% { transform: translate(-2px, 2px); }
  93% { transform: translate(2px, -2px); }
  95% { transform: translate(-1px, 1px); }
}

.mode-select-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

.retro-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(0.6rem, 1.5vw, 0.9rem);
  padding: 1.5rem 3rem;
  background: #000;
  color: #fff;
  border: 4px solid;
  cursor: pointer;
  position: relative;
  letter-spacing: 0.1em;
  transition: all 0.1s;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.retro-btn--purple {
  border-color: #a855f7;
  box-shadow: 0 0 20px #a855f7, inset 0 0 20px rgba(168, 85, 247, 0.1);
}

.retro-btn--cyan {
  border-color: #06b6d4;
  box-shadow: 0 0 20px #06b6d4, inset 0 0 20px rgba(6, 182, 212, 0.1);
}

.retro-btn--green {
  border-color: #00ff00;
  box-shadow: 0 0 20px #00ff00, inset 0 0 20px rgba(0, 255, 0, 0.1);
}

.retro-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 0 0 30px currentColor, inset 0 0 30px rgba(255, 255, 255, 0.1), 4px 4px 0 rgba(0, 0, 0, 0.8);
}

.retro-btn:active {
  transform: translate(0, 0);
}

.btn-bracket {
  color: #ffff00;
}

/* Game HUD */
.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 80;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent);
}

.hud-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.hud-stat {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.hud-label {
  font-size: clamp(0.4rem, 1vw, 0.55rem);
  color: #00ffff;
  letter-spacing: 0.15em;
}

.hud-value {
  font-size: clamp(0.7rem, 2vw, 1.2rem);
  color: #fff;
  text-shadow: 0 0 8px currentColor;
}

.hud-value.critical {
  color: #ff0000;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.pixel-glow {
  color: #ff00ff;
  text-shadow: 0 0 10px #ff00ff;
}

.power-glow {
  color: #00ff00;
  text-shadow: 0 0 10px #00ff00;
}

.streak-bar {
  position: relative;
  height: 12px;
  background: #222;
  border: 2px solid #444;
  overflow: hidden;
}

.streak-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #ff00ff, #00ffff);
  transition: width 0.3s;
}

.streak-num {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  color: #fff;
  text-shadow: 1px 1px 0 #000;
  z-index: 1;
}

.exit-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.restart-btn {
  position: absolute;
  top: 1rem;
  right: 7rem;
}

.pixel-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: #000;
  color: #fff;
  border: 2px solid #fff;
  cursor: pointer;
  letter-spacing: 0.1em;
}

.pixel-btn--small {
  font-size: 0.4rem;
  padding: 0.5rem 1rem;
}

.pixel-btn:hover {
  background: #fff;
  color: #000;
}

/* Game Scene */
.game-scene {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 5rem 2rem 2rem;
  animation: fadeIn 0.4s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.scene-title {
  text-align: center;
  margin-bottom: 2rem;
}

.mode-header {
  font-size: clamp(0.8rem, 2.5vw, 1.4rem);
  color: #00ffff;
  margin: 0;
  text-shadow: 0 0 15px #00ffff;
  letter-spacing: 0.15em;
}

.stage-label {
  font-size: clamp(0.5rem, 1.5vw, 0.7rem);
  color: #ffff00;
  margin: 0.5rem 0 0;
  letter-spacing: 0.2em;
}

/* Aspect Display */
.aspect-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem auto;
}

.planet-card {
  position: relative;
  padding: 1.5rem 2rem;
  background: #0a0a0a;
  border: 3px solid #a855f7;
  box-shadow: 0 0 20px #a855f7, inset 0 0 20px rgba(168, 85, 247, 0.2);
}

.pixel-border {
  position: absolute;
  inset: -6px;
  border: 2px solid #ff00ff;
  pointer-events: none;
}

.planet-name {
  font-size: clamp(0.7rem, 2vw, 1.1rem);
  color: #fff;
  text-shadow: 0 0 10px #fff;
}

.angle-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.angle-value {
  font-size: clamp(1.5rem, 5vw, 3rem);
  color: #ff00ff;
  text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff;
}

.pixel-glow-pink {
  animation: glow-pulse 1.5s infinite;
}

@keyframes glow-pulse {
  0%, 100% { text-shadow: 0 0 20px #ff00ff; }
  50% { text-shadow: 0 0 40px #ff00ff, 0 0 60px #ff00ff; }
}

/* First-Person View for Zodiac */
.zodiac-scene {
  padding: 4rem 1rem 1rem;
}

.fp-game-view {
  position: relative;
  width: min(100%, 900px);
  height: clamp(300px, 50vh, 400px);
  margin: 0 auto 1rem;
  border: 4px solid #00ffff;
  box-shadow: 
    0 0 20px #00ffff,
    inset 0 0 30px rgba(0, 255, 255, 0.1);
  background: #000;
  overflow: hidden;
}

/* Parallax Backgrounds */
.parallax-bg {
  position: absolute;
  inset: 0;
  display: flex;
  transition: transform 0.05s linear;
}

.bg-layer-far,
.bg-layer-mid,
.bg-layer-near {
  position: absolute;
  inset: 0;
  background-size: 800px 100%;
  background-repeat: repeat-x;
  opacity: 0.6;
}

.bg-layer-far {
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 150px,
    rgba(138, 43, 226, 0.15) 150px,
    rgba(138, 43, 226, 0.15) 152px
  );
}

.bg-layer-mid {
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 100px,
    rgba(255, 0, 255, 0.2) 100px,
    rgba(255, 0, 255, 0.2) 102px
  );
}

.bg-layer-near {
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 60px,
    rgba(0, 255, 255, 0.25) 60px,
    rgba(0, 255, 255, 0.25) 62px
  );
}

/* Street View */
.street-view {
  position: absolute;
  inset: 0;
  perspective: 400px;
}

.horizon-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ffff 20%, #00ffff 80%, transparent);
  box-shadow: 0 0 10px #00ffff;
}

.street-grid {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 50%;
  transform-style: preserve-3d;
}

.grid-line {
  position: absolute;
  left: 50%;
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, transparent, rgba(255, 0, 255, 0.4) 50%, rgba(255, 0, 255, 0.8));
  transform: translateX(-50%) rotateX(75deg);
}

.grid-line:nth-child(even) {
  background: linear-gradient(180deg, transparent, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0.7));
}

/* Player Sprite */
.player-sprite {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.sprite-box {
  width: 40px;
  height: 60px;
  background: linear-gradient(180deg, #ff00ff, #a855f7);
  border: 2px solid #fff;
  box-shadow: 
    0 0 15px #ff00ff,
    inset 0 0 10px rgba(255, 255, 255, 0.3);
  position: relative;
}

.sprite-box.walking {
  animation: walk-bob 0.6s infinite;
}

@keyframes walk-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.sprite-box::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 8px;
  width: 8px;
  height: 8px;
  background: #ffff00;
  box-shadow: 
    0 0 10px #ffff00,
    16px 0 0 #ffff00,
    16px 0 10px #ffff00;
}

/* Prompt Box */
.pixel-panel {
  background: rgba(0, 0, 0, 0.85);
  border: 3px solid #00ffff;
  padding: 1rem;
  box-shadow: 
    0 0 15px #00ffff,
    inset 0 0 15px rgba(0, 255, 255, 0.1);
}

.prompt-box {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 30;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  font-size: clamp(0.4rem, 1vw, 0.55rem);
  color: #ffff00;
  margin-bottom: 0.8rem;
  letter-spacing: 0.1em;
}

.separator {
  color: #00ffff;
}

.prompt-text {
  font-size: clamp(0.5rem, 1.2vw, 0.7rem);
  line-height: 1.6;
  color: #fff;
  margin: 0 0 0.5rem;
}

.ambient-text {
  font-size: clamp(0.4rem, 1vw, 0.5rem);
  color: #a855f7;
  margin: 0;
  font-style: italic;
}

/* Choice Panel */
.choice-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.95), transparent);
  z-index: 60;
}

.instruction-text {
  text-align: center;
  font-size: clamp(0.4rem, 1vw, 0.5rem);
  color: #00ff00;
  margin: 0 0 1rem;
  letter-spacing: 0.15em;
}

.choice-list,
.game-choices {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-width: 700px;
  margin: 0 auto;
}

.game-choice {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(0.5rem, 1.2vw, 0.65rem);
  padding: 1rem 1.5rem;
  background: #000;
  color: #fff;
  border: 2px solid #666;
  cursor: pointer;
  text-align: left;
  position: relative;
  letter-spacing: 0.08em;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.game-choice:hover {
  border-color: #ff00ff;
  box-shadow: 0 0 15px #ff00ff;
  transform: translateX(4px);
}

.game-choice:disabled {
  cursor: default;
  opacity: 0.7;
}

.game-choice.focused {
  border-color: #00ffff;
  box-shadow: 0 0 20px #00ffff;
  background: rgba(0, 255, 255, 0.05);
  transform: translateX(6px);
}

.game-choice.hint {
  border-color: #ffff00;
  box-shadow: 0 0 25px #ffff00;
  animation: hint-pulse 0.8s infinite;
}

@keyframes hint-pulse {
  0%, 100% { box-shadow: 0 0 25px #ffff00; }
  50% { box-shadow: 0 0 35px #ffff00, 0 0 50px #ffff00; }
}

.game-choice.correct {
  border-color: #00ff00;
  box-shadow: 0 0 30px #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

.game-choice.incorrect {
  border-color: #ff0000;
  box-shadow: 0 0 30px #ff0000;
  background: rgba(255, 0, 0, 0.1);
}

.choice-bracket {
  color: #ffff00;
  font-size: 1em;
}

.game-choice--zodiac {
  flex-direction: row;
  align-items: flex-start;
}

.choice-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.choice-action {
  color: #fff;
  text-shadow: 0 0 8px currentColor;
}

.choice-desc {
  font-size: clamp(0.4rem, 0.9vw, 0.5rem);
  color: #aaa;
  line-height: 1.5;
}

.choice-hint {
  font-size: 0.45rem;
  color: #888;
  margin-left: 0.5rem;
}

/* Narrative Box */
.narrative-box {
  max-width: 700px;
  margin: 1rem auto;
  position: relative;
  z-index: 40;
}

.narrative-text {
  font-size: clamp(0.5rem, 1.2vw, 0.65rem);
  line-height: 1.8;
  margin: 0;
}

.success-text {
  color: #00ff00;
  text-shadow: 0 0 10px #00ff00;
}

.fail-text {
  color: #ff6666;
  text-shadow: 0 0 10px #ff6666;
}

/* Feedback Display */
.feedback-display {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 90;
  pointer-events: none;
}

.feedback-line {
  text-align: center;
  margin: 2rem 0;
}

.msg-success {
  font-size: clamp(1rem, 3vw, 1.8rem);
  color: #00ff00;
  text-shadow: 
    0 0 20px #00ff00,
    0 0 40px #00ff00,
    3px 3px 0 rgba(0, 0, 0, 0.8);
  margin: 0;
  animation: success-pop 0.5s;
}

.msg-fail {
  font-size: clamp(1rem, 3vw, 1.8rem);
  color: #ff0000;
  text-shadow: 
    0 0 20px #ff0000,
    0 0 40px #ff0000,
    3px 3px 0 rgba(0, 0, 0, 0.8);
  margin: 0;
  animation: fail-shake 0.5s;
}

@keyframes success-pop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fail-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.pixel-shake {
  animation: pixel-shake 0.4s;
}

@keyframes pixel-shake {
  0%, 100% { transform: translate(0); }
  10% { transform: translate(-2px, 2px); }
  20% { transform: translate(2px, -2px); }
  30% { transform: translate(-2px, -2px); }
  40% { transform: translate(2px, 2px); }
  50% { transform: translate(-2px, 0); }
  60% { transform: translate(2px, 0); }
  70% { transform: translate(0, -2px); }
  80% { transform: translate(0, 2px); }
  90% { transform: translate(-1px, 1px); }
}

.msg-detail {
  font-size: clamp(0.45rem, 1vw, 0.55rem);
  color: #00ffff;
  margin-top: 0.5rem;
  letter-spacing: 0.15em;
}

/* Power-Ups */
.powerup-panel {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 70;
}

.powerup-pill {
  font-size: clamp(0.4rem, 0.9vw, 0.5rem);
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #ffff00;
  color: #ffff00;
  box-shadow: 0 0 15px #ffff00;
  letter-spacing: 0.1em;
}

.powerup-icon {
  color: #ff00ff;
  margin-right: 0.3rem;
}

/* Flash Overlay */
.flash-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  pointer-events: none;
  animation: flash 0.12s ease-out;
  z-index: 999;
}

@keyframes flash {
  from { opacity: 0.8; }
  to { opacity: 0; }
}

/* Screen Shake */
.shake {
  animation: screen-shake 0.25s;
}

@keyframes screen-shake {
  10% { transform: translate(-4px, 3px); }
  20% { transform: translate(3px, -4px); }
  30% { transform: translate(-3px, 3px); }
  40% { transform: translate(4px, -3px); }
  50% { transform: translate(-4px, 4px); }
  60% { transform: translate(3px, -3px); }
  70% { transform: translate(-3px, 4px); }
  80% { transform: translate(4px, -4px); }
  90% { transform: translate(-3px, 3px); }
  100% { transform: translate(0, 0); }
}

/* Transitions */
.fade-game-enter-active,
.fade-game-leave-active {
  transition: opacity 0.3s;
}

.fade-game-enter-from,
.fade-game-leave-to {
  opacity: 0;
}

/* Retro Footer */
.retro-footer {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 5;
}

.retro-footer p {
  font-size: clamp(0.35rem, 0.8vw, 0.45rem);
  color: #666;
  margin: 0;
  letter-spacing: 0.15em;
}

/* Responsive */
@media (max-width: 640px) {
  .hud-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .game-scene {
    padding: 4rem 0.5rem 0.5rem;
  }
  
  .game-choice {
    font-size: 0.45rem;
    padding: 0.8rem 1rem;
  }
  
  .fp-game-view {
    height: 250px;
  }
}
</style>
