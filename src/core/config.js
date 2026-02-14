/**
 * config.js — Single source of truth for all tunable values.
 * Import CONFIG wherever you need a magic number.
 */

export const CONFIG = {
  // Particles
  PARTICLE_COUNT: 12000,
  PARTICLE_SIZE: 2.0,
  PARTICLE_SPREAD: 50,

  // Timing
  CHARGE_DURATION: 1200, // ms before charging → active

  // Bloom (UnrealBloomPass)
  BASE_BLOOM: 0.8,
  CHARGE_BLOOM: 1.8,
  ACTIVE_BLOOM: 2.5,

  // Camera
  CAM_DISTANCE: 60,
  CAM_FOV: 65,
};
