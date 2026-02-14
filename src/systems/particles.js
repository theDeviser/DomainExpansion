/**
 * particles.js — Three.js scene, bloom, and particle system.
 * Owns the render loop. Exposes typed arrays for domains to write into.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CONFIG } from '../core/config.js';

let scene, camera, renderer, composer, bloomPass;
let points, positions, basePositions, velocities, colors;
let onFrame = null; // per-frame hook set by app.js

/** Initialize the full Three.js pipeline. */
export function init(canvas) {
  const { PARTICLE_COUNT, PARTICLE_SIZE, PARTICLE_SPREAD, CAM_DISTANCE, CAM_FOV, BASE_BLOOM } = CONFIG;
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, CONFIG.FOG_DENSITY);

  // Camera
  camera = new THREE.PerspectiveCamera(CAM_FOV, w / h, 0.1, 500);
  camera.position.z = CAM_DISTANCE;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = CONFIG.TONE_EXPOSURE;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Bloom post-processing
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(w, h),
    BASE_BLOOM, // strength
    0.4,        // radius
    0.85        // threshold
  );
  composer.addPass(bloomPass);

  // Particle geometry
  const geo = new THREE.BufferGeometry();
  positions = new Float32Array(PARTICLE_COUNT * 3);
  basePositions = new Float32Array(PARTICLE_COUNT * 3);
  velocities = new Float32Array(PARTICLE_COUNT * 3);
  colors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    // Uniform volume distribution (cube-root) with minimum radius
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = CONFIG.MIN_RADIUS + Math.cbrt(Math.random()) * (PARTICLE_SPREAD - CONFIG.MIN_RADIUS);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;

    // Subtle bluish-white idle tone
    colors[i3]     = CONFIG.IDLE_COLOR[0];
    colors[i3 + 1] = CONFIG.IDLE_COLOR[1];
    colors[i3 + 2] = CONFIG.IDLE_COLOR[2];
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    map: createSpriteTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    alphaTest: 0.01,
  });

  points = new THREE.Points(geo, mat);
  scene.add(points);

  // Handle resize
  window.addEventListener('resize', onResize);

  // Start render loop
  let prev = performance.now();
  (function loop(now) {
    requestAnimationFrame(loop);
    const dt = (now - prev) / 1000;
    prev = now;
    update(dt);
    if (onFrame) onFrame(dt, now / 1000);
    composer.render();
  })(prev);
}

/** Apply velocity → position each frame. */
function update(dt) {
  const len = positions.length;
  for (let i = 0; i < len; i++) {
    positions[i] += velocities[i] * dt;
  }
  points.geometry.attributes.position.needsUpdate = true;
  points.geometry.attributes.color.needsUpdate = true;
}

/** Pre-burst: nudge all particles toward origin. t = 0..1 */
export function chargeInward(t) {
  const strength = t * 0.3;
  const len = CONFIG.PARTICLE_COUNT * 3;
  for (let i = 0; i < len; i++) {
    positions[i] += (0 - positions[i]) * strength * 0.02;
  }
}

/** Update bloom pass strength. */
export function setBloom(strength) {
  if (bloomPass) bloomPass.strength = strength;
}

/** Set per-frame callback (domain ticks, camera orbit). */
export function setOnFrame(fn) {
  onFrame = fn;
}

// ── Accessors ──

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
export function getComposer() { return composer; }

export function getPoints() { return points; }
export function getPositions() { return positions; }
export function getBasePositions() { return basePositions; }
export function getVelocities() { return velocities; }
export function getColors() { return colors; }

// ── Internal ──

/** Create a 128x128 radial gradient sprite texture. */
function createSpriteTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}
