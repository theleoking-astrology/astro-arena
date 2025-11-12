// src/engine3d/Loaders.ts
import { GLTFLoader } from 'three-stdlib';
import { DRACOLoader } from 'three-stdlib';
import { KTX2Loader } from 'three-stdlib';
import { MeshoptDecoder } from 'three-stdlib';
import type { WebGLRenderer } from 'three';

export function makeGLTFLoader(renderer: WebGLRenderer) {
  const loader = new GLTFLoader();

  // DRACO (optional)
  const draco = new DRACOLoader();
  // Put DRACO decoder files in /public/draco/ (from three/examples/jsm/libs/draco/)
  draco.setDecoderPath('/draco/');
  loader.setDRACOLoader(draco);

  // Meshopt (optional)
  if (MeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder);

  // KTX2 (optional compressed textures)
  try {
    const ktx2 = new KTX2Loader();
    // Put BasisU transcoder in /public/basis/ (from three/examples/jsm/libs/basis/)
    ktx2.setTranscoderPath('/basis/');
    ktx2.detectSupport(renderer);
    loader.setKTX2Loader(ktx2);
  } catch {}

  return loader;
}

