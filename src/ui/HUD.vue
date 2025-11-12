<!-- src/ui/HUD.vue -->
<template>
  <div class="hud">
    <div class="row">
      <div class="chip">Score: {{ score }}</div>
      <div class="chip">HP: {{ hp }}</div>
      <div class="chip">FPS: {{ fps.toFixed(0) }}</div>
      <div class="chip">Tier: {{ quality.name }}</div>
      <div class="chip">Scale: {{ quality.dynamicScale.toFixed(2) }}</div>
    </div>
    <div class="row">
      <label class="chip"><input type="checkbox" v-model="ssr" @change="$emit('toggle-ssr', ssr)"> SSR</label>
      <label class="chip"><input type="range" min="0.3" max="1.2" step="0.05" v-model.number="bloom" @input="$emit('bloom', bloom)"> Bloom {{ bloom.toFixed(2) }}</label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, toRefs } from 'vue';

const props = defineProps<{
  score: number;
  hp: number;
  fps: number;
  quality: { name: string; dynamicScale: number; };
  ssrEnabled?: boolean;
  bloomStrength?: number;
}>();
defineEmits<{
  (e:'toggle-ssr', enabled:boolean):void;
  (e:'bloom', intensity:number):void;
}>();

const state = reactive({
  ssr: props.ssrEnabled ?? false,
  bloom: props.bloomStrength ?? 0.7
});

const { ssr, bloom } = toRefs(state);

watch(() => props.ssrEnabled, v => state.ssr = !!v);
watch(() => props.bloomStrength, v => { if (typeof v === 'number') state.bloom = v; });
</script>

<style scoped>
.hud {
  position: absolute; inset: 0; pointer-events: none; padding: 16px;
  display: flex; flex-direction: column; gap: 8px; color: #e6f2ff; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
}
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.chip {
  pointer-events: auto;
  background: rgba(10,12,16,0.6);
  border: 1px solid rgba(0,245,255,0.25);
  padding: 6px 10px; border-radius: 8px; font-size: 12px;
  backdrop-filter: blur(6px);
}
input[type="range"] { width: 140px; }
</style>

