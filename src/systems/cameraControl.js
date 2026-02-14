/**
 * cameraControl.js — Mouse-driven camera orbit.
 * Simple spherical coordinate mapping from mouse position.
 * No dependency on OrbitControls.
 */

import { CONFIG } from '../core/config.js';

let camera = null;
let active = false;
let targetTheta = 0;
let targetPhi = Math.PI / 2;
let sensitivity = 1.0;
let inertia = 0.05;

function onMouseMove(e) {
  if (!active) return;
  const nx = (e.clientX / window.innerWidth) * 2 - 1;
  const ny = -(e.clientY / window.innerHeight) * 2 + 1;

  targetTheta = nx * Math.PI * 0.4 * sensitivity;
  targetPhi = Math.PI / 2 + ny * Math.PI * 0.2 * sensitivity;
}

/**
 * Store the camera reference.
 * @param {THREE.PerspectiveCamera} cam
 */
export function init(cam) {
  camera = cam;
  window.addEventListener('mousemove', onMouseMove);
}

/**
 * Enable camera orbit (called when state → control).
 * @param {Object} [opts] - Optional config
 * @param {number} [opts.sensitivity=1.0] - Mouse angle multiplier
 * @param {number} [opts.inertia=0.05] - Position lerp factor
 */
export function enable(opts) {
  active = true;
  sensitivity = opts?.sensitivity ?? 1.0;
  inertia = opts?.inertia ?? 0.05;
}

/**
 * Disable orbit and reset camera to default position.
 */
export function disable() {
  active = false;
  sensitivity = 1.0;
  inertia = 0.05;
  if (!camera) return;
  camera.position.set(0, 0, CONFIG.CAM_DISTANCE);
  camera.lookAt(0, 0, 0);
}

/**
 * Call each frame to smoothly apply the orbit.
 * Should be invoked from the render loop when active.
 */
export function tick() {
  if (!active || !camera) return;

  const r = CONFIG.CAM_DISTANCE;
  const x = r * Math.sin(targetPhi) * Math.sin(targetTheta);
  const y = r * Math.cos(targetPhi);
  const z = r * Math.sin(targetPhi) * Math.cos(targetTheta);

  // Smooth lerp toward target (uses configurable inertia)
  camera.position.x += (x - camera.position.x) * inertia;
  camera.position.y += (y - camera.position.y) * inertia;
  camera.position.z += (z - camera.position.z) * inertia;
  camera.lookAt(0, 0, 0);
}
