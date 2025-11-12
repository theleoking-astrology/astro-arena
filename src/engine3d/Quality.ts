// src/engine3d/Quality.ts
import { getGPUTier } from 'detect-gpu';

export type QualityName = 'Ultra' | 'High' | 'Med' | 'Low';
export type AAMode = 'SMAA' | 'FXAA';

export interface QualityConfig {
  name: QualityName;
  maxDPR: number;
  renderScale: number;
  shadowSize: number;
  anisotropy: number;
  bloomStrength: number;
  useSSR: boolean;
  aa: AAMode;
  isMobile: boolean;
}

export interface QualityState extends QualityConfig {
  dynamicScale: number; // runtime scaler (0.6 .. 1.0)
}

function mapTier(tier: number, isMobile: boolean): QualityConfig {
  // tier: 0..3+ ; be conservative on mobile
  if (tier >= 3 && !isMobile) {
    return { name: 'Ultra', maxDPR: 2.0, renderScale: 1.0, shadowSize: 2048, anisotropy: 8, bloomStrength: 0.8, useSSR: true, aa: 'SMAA', isMobile };
  }
  if (tier >= 2) {
    return { name: 'High', maxDPR: isMobile ? 1.5 : 2.0, renderScale: isMobile ? 0.9 : 0.95, shadowSize: 1536, anisotropy: 4, bloomStrength: 0.7, useSSR: !isMobile, aa: isMobile ? 'FXAA' : 'SMAA', isMobile };
  }
  if (tier >= 1) {
    return { name: 'Med', maxDPR: isMobile ? 1.25 : 1.5, renderScale: 0.85, shadowSize: 1024, anisotropy: 2, bloomStrength: 0.55, useSSR: false, aa: 'FXAA', isMobile };
  }
  return { name: 'Low', maxDPR: 1.25, renderScale: 0.75, shadowSize: 512, anisotropy: 1, bloomStrength: 0.45, useSSR: false, aa: 'FXAA', isMobile };
}

export async function detectQuality(urlOverride?: string): Promise<QualityState> {
  const params = new URLSearchParams(location.search);
  const qOverride = (urlOverride ?? params.get('q') ?? '').toLowerCase();
  const gpu = await getGPUTier();
  let base = mapTier(gpu.tier ?? 1, gpu.isMobile ?? false);
  if (qOverride === 'ultra') base = mapTier(3, base.isMobile);
  if (qOverride === 'high') base = mapTier(2, base.isMobile);
  if (qOverride === 'med' || qOverride === 'medium') base = mapTier(1, base.isMobile);
  if (qOverride === 'low') base = mapTier(0, base.isMobile);
  return { ...base, dynamicScale: base.renderScale };
}

export class DynamicScaler {
  private scale: number;
  private onChange: (scale: number) => void;
  private hiTimer = 0;
  private loTimer = 0;
  constructor(initial: number, onChange: (scale: number) => void) {
    this.scale = initial;
    this.onChange = onChange;
  }
  update(avgFrameMs: number, dt: number) {
    if (avgFrameMs > 20) {
      this.hiTimer += dt;
      this.loTimer = Math.max(0, this.loTimer - dt);
      if (this.hiTimer > 2.0) {
        this.scale = Math.max(0.6, this.scale * 0.9);
        this.onChange(this.scale);
        this.hiTimer = 0;
      }
    } else if (avgFrameMs < 12) {
      this.loTimer += dt;
      this.hiTimer = Math.max(0, this.hiTimer - dt);
      if (this.loTimer > 4.0) {
        this.scale = Math.min(1.0, this.scale * 1.05);
        this.onChange(this.scale);
        this.loTimer = 0;
      }
    } else {
      this.hiTimer = Math.max(0, this.hiTimer - dt);
      this.loTimer = Math.max(0, this.loTimer - dt);
    }
  }
  getScale() { return this.scale; }
  force(scale: number) { this.scale = scale; this.onChange(this.scale); }
}

