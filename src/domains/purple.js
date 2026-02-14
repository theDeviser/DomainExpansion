/**
 * purple.js — Hollow Purple domain.
 *
 * Color: purple to magenta
 * Motion: chaotic random directions with sinusoidal pulsation.
 * Feel: a breathing, chaotic energy mass.
 */

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

const BG_COLOR = new THREE.Color(0x0a0015); // dark violet

// Store base velocity magnitudes for pulsation scaling
let baseSpeeds = null;

/**
 * Apply Purple visuals and motion.
 * Random velocity directions with per-particle speed variation.
 */
export function apply(particles) {
  const velocities = particles.getVelocities();
  const colors = particles.getColors();
  const renderer = particles.getRenderer();
  const count = CONFIG.PARTICLE_COUNT;

  renderer.setClearColor(BG_COLOR);

  // Bloom override — purple feels most intense
  particles.setBloom(CONFIG.ACTIVE_BLOOM + 0.3);

  baseSpeeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Random unit vector
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 0.3 + Math.random() * 1.2;

    baseSpeeds[i] = speed;

    velocities[i3]     = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    velocities[i3 + 2] = Math.cos(phi) * speed;

    // Purple-to-magenta palette
    const t = Math.random();
    colors[i3]     = 0.53 + t * 0.47; // R: 0.53..1.0
    colors[i3 + 1] = t * 0.1;         // G: near zero
    colors[i3 + 2] = 0.6 + t * 0.4;   // B: 0.6..1.0
  }
}

/**
 * Per-frame pulsation update.
 * Scale velocities by a sine wave so particles expand and contract.
 * Called by app.js via particles.setOnFrame during purple domain.
 *
 * @param {number} dt — delta time (unused, kept for interface consistency)
 * @param {number} time — elapsed seconds
 * @param {object} particles — particles module reference
 */
export function tick(dt, time, particles) {
  if (!baseSpeeds) return;

  const velocities = particles.getVelocities();
  const count = CONFIG.PARTICLE_COUNT;
  const pulse = Math.sin(time * 3.0) * 0.5 + 0.5; // 0..1 oscillation

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const len = baseSpeeds[i];
    if (len === 0) continue;

    // Get current direction
    const vx = velocities[i3];
    const vy = velocities[i3 + 1];
    const vz = velocities[i3 + 2];
    const curLen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;

    // Scale to pulsating speed
    const scale = (pulse * 0.8 + 0.2) * len / curLen;
    velocities[i3]     = vx * scale;
    velocities[i3 + 1] = vy * scale;
    velocities[i3 + 2] = vz * scale;
  }
}

/**
 * Reset Purple: restore base positions, zero velocities, neutral colors.
 */
export function reset(particles) {
  const positions = particles.getPositions();
  const base = particles.getBasePositions();
  const velocities = particles.getVelocities();
  const colors = particles.getColors();
  const renderer = particles.getRenderer();
  const count = CONFIG.PARTICLE_COUNT * 3;

  renderer.setClearColor(0x000000);
  baseSpeeds = null;

  for (let i = 0; i < count; i++) {
    positions[i] = base[i];
    velocities[i] = 0;
  }
  for (let i = 0; i < count; i += 3) {
    colors[i]     = CONFIG.IDLE_COLOR[0];
    colors[i + 1] = CONFIG.IDLE_COLOR[1];
    colors[i + 2] = CONFIG.IDLE_COLOR[2];
  }
}
