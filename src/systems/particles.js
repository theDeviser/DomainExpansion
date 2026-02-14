/**
 * particles.js — Three.js scene, camera, renderer, bloom, and particle system.
 * Owns the render loop. Exposes typed arrays for domains to write into.
 * Does NOT decide how particles move — only applies velocity each frame.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CONFIG } from '../core/config.js';

let scene, camera, renderer, composer, bloomPass;
let points, positions, basePositions, velocities, colors;

// External per-frame hook (set by app.js for domain ticks)
let onFrame = null;

/**
 * Initialize the full Three.js pipeline.
 */
export function init(canvas) {
  const { PARTICLE_COUNT, PARTICLE_SIZE, PARTICLE_SPREAD, CAM_DISTANCE, CAM_FOV, BASE_BLOOM } = CONFIG;
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera
  camera = new THREE.PerspectiveCamera(CAM_FOV, w / h, 0.1, 500);
  camera.position.z = CAM_DISTANCE;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
    // Random point in sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * PARTICLE_SPREAD;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;

    // Neutral gray
    colors[i3] = 0.4;
    colors[i3 + 1] = 0.4;
    colors[i3 + 2] = 0.4;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
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

/**
 * Apply velocity → position each frame.
 */
function update(dt) {
  const len = positions.length;
  for (let i = 0; i < len; i++) {
    positions[i] += velocities[i] * dt;
  }
  points.geometry.attributes.position.needsUpdate = true;
  points.geometry.attributes.color.needsUpdate = true;
}

/**
 * Pre-burst charging: nudge all particles toward origin.
 * @param {number} t — normalized progress 0..1
 */
export function chargeInward(t) {
  const strength = t * 0.3;
  const len = CONFIG.PARTICLE_COUNT * 3;
  for (let i = 0; i < len; i++) {
    positions[i] += (0 - positions[i]) * strength * 0.02;
  }
}

/**
 * Update bloom pass strength.
 */
export function setBloom(strength) {
  if (bloomPass) bloomPass.strength = strength;
}

/**
 * Set per-frame callback (used by app.js for domain ticks like purple pulsation).
 */
export function setOnFrame(fn) {
  onFrame = fn;
}

// ── Accessors ──

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
export function getComposer() { return composer; }

export function getPositions() { return positions; }
export function getBasePositions() { return basePositions; }
export function getVelocities() { return velocities; }
export function getColors() { return colors; }

// ── Internal ──

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}
