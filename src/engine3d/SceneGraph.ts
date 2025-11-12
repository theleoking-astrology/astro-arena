// src/engine3d/SceneGraph.ts
import {
  Scene,
  PerspectiveCamera,
  Color,
  HemisphereLight,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  PMREMGenerator,
  EquirectangularReflectionMapping,
  Texture,
  WebGLRenderer,
  AdditiveBlending
} from 'three';
import { RGBELoader } from 'three-stdlib';
import type { QualityState } from './Quality';

export async function buildScene(renderer: WebGLRenderer, quality: QualityState) {
  const scene = new Scene();
  scene.background = new Color(0x050810);  // Darker for better star visibility

  const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3.5, 6);

  // Lights
  const hemi = new HemisphereLight(0xddeeff, 0x080820, 0.8);
  scene.add(hemi);

  const dir = new DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 8, 3);
  dir.castShadow = true;
  const s = quality.shadowSize;
  dir.shadow.mapSize.set(s, s);
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 50;
  scene.add(dir);

  // Floor (glossy for reflections look; roughness not too low to avoid mirror)
  // RAISED: Move floor up by 1.5 units to match elevated avatars
  const floorMat = new MeshStandardMaterial({ color: 0x101316, metalness: 0.1, roughness: 0.3 });
  const floor = new Mesh(new PlaneGeometry(200, 200), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 1.5;  // Raised to match avatars
  floor.receiveShadow = true;
  scene.add(floor);

  // Neon lanes (emissive)
  function neonStrip(width: number, height: number, color: number, z = 0, x = 0) {
    const m = new MeshStandardMaterial({ color: 0x111214, emissive: color, emissiveIntensity: 2.5, metalness: 0.6, roughness: 0.25 });
    const g = new PlaneGeometry(width, height);
    const mesh = new Mesh(g, m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 1.502, z);  // Raised to sit on elevated floor
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    scene.add(mesh);
    return mesh;
  }
  neonStrip(40, 0.3, 0x00f5ff, -2);
  neonStrip(40, 0.3, 0xff00ff,  2);

  // HDRI environment (optional: gracefully skip if asset missing)
  const envUrl = `${import.meta.env.BASE_URL}env/arena.hdr`;
  try {
    const head = await fetch(envUrl, { method: 'HEAD' });
    if (head.ok) {
      const pmrem = new PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();

      const hdrTex: Texture = await new RGBELoader().loadAsync(envUrl);
      if (hdrTex.image) {
        hdrTex.mapping = EquirectangularReflectionMapping;
        const envMap = pmrem.fromEquirectangular(hdrTex).texture;
        scene.environment = envMap;
      } else {
        console.warn('[SceneGraph] Loaded HDR lacks image data, skipping environment map.');
      }
      hdrTex.dispose();
      pmrem.dispose();
      // Optional: scene.background = envMap; // uncomment for visible HDRI
    } else {
      console.info(`[SceneGraph] No HDR environment found at ${envUrl} (status ${head.status}). Using solid background.`);
    }
  } catch (err) {
    console.warn('[SceneGraph] Failed to load HDR environment.', err);
  }

  // STARFIELD BACKGROUND - Animated cosmic stars
  function createStarfield() {
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    // Star color palettes (cosmic colors)
    const starColors = [
      { r: 1.0, g: 1.0, b: 1.0 },      // White
      { r: 0.8, g: 0.9, b: 1.0 },      // Blue-white
      { r: 1.0, g: 0.9, b: 0.7 },      // Yellow-white
      { r: 1.0, g: 0.7, b: 0.9 },      // Pink
      { r: 0.7, g: 0.9, b: 1.0 },      // Cyan
      { r: 0.9, g: 0.7, b: 1.0 }       // Purple
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Distribute stars in a large sphere around the scene
      const radius = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Random star color
      const colorIndex = Math.floor(Math.random() * starColors.length);
      const colorPalette = starColors[colorIndex]!;
      colors[i3] = colorPalette.r;
      colors[i3 + 1] = colorPalette.g;
      colors[i3 + 2] = colorPalette.b;

      // Random star size (some bigger, most smaller)
      sizes[i] = Math.random() < 0.1 ? 3.0 + Math.random() * 2.0 : 1.0 + Math.random() * 1.5;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    geometry.setAttribute('size', new BufferAttribute(sizes, 1));

    const material = new PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    const starfield = new Points(geometry, material);
    starfield.renderOrder = -1;  // Render behind everything
    scene.add(starfield);

    return starfield;
  }

  const starfield = createStarfield();

  // COSMIC BACKDROP SPHERE - Deep space gradient
  const backdropGeometry = new SphereGeometry(180, 32, 32);
  const backdropMaterial = new MeshBasicMaterial({
    color: 0x0a0c18,
    side: 2,  // BackSide
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });
  const backdrop = new Mesh(backdropGeometry, backdropMaterial);
  backdrop.renderOrder = -2;  // Behind starfield
  scene.add(backdrop);

  return { scene, camera, lights: { hemi, dir }, floor, starfield, backdrop };
}

