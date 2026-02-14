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

function onMouseMove(e) {
  if (!active) return;
  // Map mouse to spherical angles
  const nx = (e.clientX / window.innerWidth) * 2 - 1;   // -1..1
  const ny = -(e.clientY / window.innerHeight) * 2 + 1;  // -1..1

  targetTheta = nx * Math.PI * 0.4;          // ±72° horizontal
  targetPhi = Math.PI / 2 + ny * Math.PI * 0.2; // ±36° vertical
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
 */
export function enable() {
  active = true;
}

/**
 * Disable orbit and reset camera to default position.
 */
export function disable() {
  active = false;
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

  // Smooth lerp toward target
  camera.position.x += (x - camera.position.x) * 0.05;
  camera.position.y += (y - camera.position.y) * 0.05;
  camera.position.z += (z - camera.position.z) * 0.05;
  camera.lookAt(0, 0, 0);
}
