/**
 * config.js — Single source of truth for all tunable values.
 * Import CONFIG wherever you need a magic number.
 */

export const CONFIG = {
  // Particles
  PARTICLE_COUNT: 12000,
  PARTICLE_SIZE: 1.2,
  PARTICLE_SPREAD: 50,
  MIN_RADIUS: 2,
  IDLE_COLOR: [0.7, 0.8, 1.0],

  // Timing
  CHARGE_DURATION: 1200, // ms before charging → active

  // Bloom (UnrealBloomPass)
  BASE_BLOOM: 0.8,
  CHARGE_BLOOM: 1.8,
  ACTIVE_BLOOM: 2.5,

  // Renderer
  FOG_DENSITY: 0.02,
  TONE_EXPOSURE: 0.9,

  // Camera
  CAM_DISTANCE: 60,
  CAM_FOV: 65,
};
