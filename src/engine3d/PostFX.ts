// src/engine3d/PostFX.ts
import { WebGLRenderer, PerspectiveCamera, Scene } from 'three';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  SMAAEffect,
  FXAAEffect,
  BloomEffect,
  VignetteEffect,
  NoiseEffect,
} from 'postprocessing';
import type { QualityState } from './Quality';

export type AAMode = 'SMAA' | 'FXAA';

export class PostFX {
  composer: EffectComposer;
  private smaa?: SMAAEffect;
  private fxaa?: FXAAEffect;
  private bloom: BloomEffect;
  private vignette: VignetteEffect;
  private noise: NoiseEffect;
  private aaMode: AAMode;

  constructor(renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, quality: QualityState) {
    this.composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    this.aaMode = quality.aa;
    if (quality.aa === 'SMAA') {
      this.smaa = new SMAAEffect();
    } else {
      this.fxaa = new FXAAEffect();
    }

    this.bloom = new BloomEffect({
      intensity: quality.bloomStrength,
      luminanceThreshold: 0.9,
      luminanceSmoothing: 0.6
    });

    this.vignette = new VignetteEffect({ darkness: 0.35, offset: 0.25 });
    this.noise = new NoiseEffect({ premultiply: true });

    const effects = [
      ...(this.smaa ? [this.smaa] : []),
      ...(this.fxaa ? [this.fxaa] : []),
      this.bloom,
      this.vignette,
      ...(quality.isMobile ? [] : [this.noise])
    ];

    const effectPass = new EffectPass(camera, ...effects);
    effectPass.renderToScreen = true;
    this.composer.addPass(effectPass);
  }

  setSize(width: number, height: number) {
    this.composer.setSize(width, height, false);
  }

  setBloomIntensity(v: number) {
    this.bloom.intensity = v;
  }

  setAA(mode: AAMode) {
    if (this.aaMode === mode) return;
    this.aaMode = mode;
    // Rebuild chain is safest; omitted for brevity
  }

  render(delta: number) {
    this.composer.render(delta);
  }
}

