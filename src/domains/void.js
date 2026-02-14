/**
 * void.js — Infinite Void domain.
 *
 * Color: ice blue to white
 * Motion: inward spiral — tangential orbit + radial pull.
 * Feel: light collapsing into a singularity.
 */

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

const BG_COLOR = new THREE.Color(0x000011); // deep black-blue

/**
 * Apply Void visuals and motion.
 * Tangential velocity creates orbit; small inward pull creates spiral.
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

    const px = positions[i3];
    const py = positions[i3 + 1];
    const pz = positions[i3 + 2];
    const len = Math.sqrt(px * px + py * py + pz * pz) || 1;

    // Normalized radial direction
    const rx = px / len;
    const ry = py / len;
    const rz = pz / len;

    // Tangential direction (cross product with up vector)
    // If radial is nearly parallel to up, use a different axis
    let tx, ty, tz;
    if (Math.abs(ry) > 0.9) {
      tx = rz;  ty = 0;  tz = -rx; // cross with (1,0,0)
    } else {
      tx = -rz; ty = 0;  tz = rx;  // cross with (0,1,0)
    }
    const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
    tx /= tLen; ty /= tLen; tz /= tLen;

    const speed = 0.3 + Math.random() * 0.5; // slower than shrine
    const inwardPull = -0.2;

    velocities[i3]     = (tx * speed + rx * inwardPull) * 0.4;
    velocities[i3 + 1] = (ty * speed + ry * inwardPull) * 0.4;
    velocities[i3 + 2] = (tz * speed + rz * inwardPull) * 0.4;

    // Ice blue to white palette
    const t = Math.random();
    colors[i3]     = 0.27 + t * 0.67; // R: 0.27..0.93
    colors[i3 + 1] = 0.53 + t * 0.4;  // G: 0.53..0.93
    colors[i3 + 2] = 1.0;              // B: full
  }
}

/**
 * Reset Void: restore base positions, zero velocities, neutral colors.
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
    colors[i] = 0.4;
    colors[i + 1] = 0.4;
    colors[i + 2] = 0.4;
  }
}
