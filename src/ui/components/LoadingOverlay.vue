<template>
  <transition name="fade">
    <div v-if="!ready || error" class="loading-overlay" role="status" aria-live="polite">
      <div class="loading-card" :class="{ error: Boolean(error) }">
        <div v-if="error" class="error-icon">⚠️</div>
        <h2>{{ error ? 'Graphics Paused' : headline }}</h2>
        <p v-if="error">{{ error }}</p>
        <p v-else>{{ message }}</p>
        <div v-if="!error" class="bar">
          <div class="bar-fill" :style="{ width: progressWidth }"></div>
        </div>
        <button v-if="error" class="retry-btn" type="button" @click="$emit('retry')">
          Retry
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    ready: boolean
    progress?: number
    message?: string
    headline?: string
    error?: string | null
  }>(),
  {
    progress: 0,
    message: 'Aligning the cosmic render pipeline…',
    headline: 'Igniting Astro Arena',
    error: null
  }
)

const progressWidth = computed(() => `${Math.min(100, Math.max(0, Math.round(props.progress * 100)))}%`)

defineEmits<{ (e: 'retry'): void }>()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(3, 5, 12, 0.92);
  backdrop-filter: blur(18px);
  z-index: 50;
}

.loading-card {
  width: min(24rem, 90vw);
  padding: 2rem;
  border-radius: 1.4rem;
  background: linear-gradient(135deg, rgba(10, 18, 36, 0.9), rgba(18, 8, 32, 0.9));
  border: 1px solid rgba(0, 245, 255, 0.3);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
  text-align: center;
  color: #e6f8ff;
}

.loading-card.error {
  border-color: rgba(255, 82, 117, 0.4);
  box-shadow: 0 24px 48px rgba(255, 82, 117, 0.25);
}

h2 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  margin-bottom: 0.8rem;
  text-transform: uppercase;
}

p {
  margin-bottom: 1.4rem;
  font-size: 0.9rem;
  line-height: 1.4;
  color: rgba(231, 247, 255, 0.9);
}

.bar {
  width: 100%;
  height: 0.55rem;
  border-radius: 999rem;
  background: rgba(17, 30, 48, 0.7);
  border: 1px solid rgba(0, 245, 255, 0.2);
  overflow: hidden;
  position: relative;
}

.bar-fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #00f5ff, #ff2fd5);
  transition: width 0.4s ease;
}

.retry-btn {
  padding: 0.75rem 1.8rem;
  margin-top: 0.8rem;
  border-radius: 999rem;
  border: 1px solid rgba(255, 82, 117, 0.6);
  background: rgba(255, 82, 117, 0.18);
  color: #ffe4ea;
  font-family: 'Press Start 2P', monospace;
  letter-spacing: 0.08em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(255, 82, 117, 0.25);
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 0.6rem;
}
</style>


