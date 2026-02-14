/**
 * void.js — Infinite Void domain.
 *
 * Color: ice blue to white
 * Motion: slow inward spiral with strong gravitational pull.
 * Feel: light being consumed by a singularity.
 */

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';

const BG_COLOR  = new THREE.Color(0x000011); // deep black-blue
const FOG_COLOR = new THREE.Color(0x000022); // deep blue fog

/** Apply Void visuals and motion. */
export function apply(particles) {
  const positions = particles.getPositions();
  const velocities = particles.getVelocities();
  const colors = particles.getColors();
  const scene = particles.getScene();
  const count = CONFIG.PARTICLE_COUNT;

  scene.background.copy(BG_COLOR);
  scene.fog.color.copy(FOG_COLOR);

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
    let tx, ty, tz;
    if (Math.abs(ry) > 0.9) {
      tx = rz;  ty = 0;  tz = -rx;
    } else {
      tx = -rz; ty = 0;  tz = rx;
    }
    const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
    tx /= tLen; ty /= tLen; tz /= tLen;

    const speed = 0.3 + Math.random() * 0.5;
    const inwardPull = -0.35; // stronger gravitational collapse

    velocities[i3]     = (tx * speed + rx * inwardPull) * 0.25;
    velocities[i3 + 1] = (ty * speed + ry * inwardPull) * 0.25;
    velocities[i3 + 2] = (tz * speed + rz * inwardPull) * 0.25;

    // Ice blue to white palette
    const t = Math.random();
    colors[i3]     = 0.27 + t * 0.67;
    colors[i3 + 1] = 0.53 + t * 0.4;
    colors[i3 + 2] = 1.0;
  }
}

/** Reset Void: restore base positions, zero velocities, neutral colors. */
export function reset(particles) {
  const positions = particles.getPositions();
  const base = particles.getBasePositions();
  const velocities = particles.getVelocities();
  const colors = particles.getColors();
  const scene = particles.getScene();
  const count = CONFIG.PARTICLE_COUNT * 3;

  scene.background.setHex(0x000000);
  scene.fog.color.setHex(0x000000);

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
