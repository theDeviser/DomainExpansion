/**
 * shrine.js — Malevolent Shrine domain.
 *
 * Color: red/orange
 * Motion: particles radiate outward from center with downward gravity drift.
 * Feel: embers falling from a collapsing building.
 */

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

const BG_COLOR = new THREE.Color(0x1a0000); // dark crimson

/**
 * Apply Shrine visuals and motion.
 * Writes into the velocity and color typed arrays from particles.
 */
export function apply(particles) {
  const positions = particles.getPositions();
  const velocities = particles.getVelocities();
  const colors = particles.getColors();
  const renderer = particles.getRenderer();
  const count = CONFIG.PARTICLE_COUNT;

  renderer.setClearColor(BG_COLOR);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Radial direction from center
    const px = positions[i3];
    const py = positions[i3 + 1];
    const pz = positions[i3 + 2];
    const len = Math.sqrt(px * px + py * py + pz * pz) || 1;

    // Outward velocity with random speed variation
    const speed = 0.5 + Math.random() * 1.5;
    velocities[i3]     = (px / len) * speed;
    velocities[i3 + 1] = (py / len) * speed - 0.3; // downward gravity drift
    velocities[i3 + 2] = (pz / len) * speed;

    // Red-to-orange palette
    const t = Math.random();
    colors[i3]     = 1.0;                // R: full
    colors[i3 + 1] = 0.13 + t * 0.4;    // G: 0.13..0.53 (red → orange)
    colors[i3 + 2] = t * 0.05;           // B: near zero
  }
}

/**
 * Reset Shrine: restore base positions, zero velocities, neutral colors.
 */
export function reset(particles) {
  const positions = particles.getPositions();
  const base = particles.getBasePositions();
  const velocities = particles.getVelocities();
  const colors = particles.getColors();
  const renderer = particles.getRenderer();
  const count = CONFIG.PARTICLE_COUNT * 3;

  renderer.setClearColor(0x000000);

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
