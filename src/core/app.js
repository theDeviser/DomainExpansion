/** app.js — Orchestrator. Wires all modules together via callbacks. */

import { CONFIG } from './config.js';
import { getState, setState, onStateChange } from './state.js';
import * as particles from '../systems/particles.js';
import * as gesture from '../systems/gesture.js';
import * as audio from '../systems/audio.js';
import * as captions from '../systems/captions.js';
import * as cameraControl from '../systems/cameraControl.js';
import * as intro from '../ui/intro.js';

import * as shrine from '../domains/shrine.js';
import * as voidDomain from '../domains/void.js';
import * as purple from '../domains/purple.js';

const domains = { shrine, void: voidDomain, purple };

let activeDomain = null;
let chargeTimer = null;
let chargeStart = 0;

const SPIKE_DURATION = 200;
const CHARGE_SIZE_MULT = 1.8;
const SPIKE_SIZE_MULT = 2.5;
const CHARGE_SHAKE = 0.3;
const SPIKE_SHAKE = 0.8;

let spikeStart = 0;
let shakeX = 0, shakeY = 0;

/** Per-frame hook — called every frame by the render loop. */
function frameLoop(dt, time) {
  const cam = particles.getCamera();
  const ren = particles.getRenderer();
  const pts = particles.getPoints();
  const scn = particles.getScene();

  // Remove previous frame's shake
  cam.position.x -= shakeX;
  cam.position.y -= shakeY;
  shakeX = 0;
  shakeY = 0;

  cameraControl.tick();

  // Charging: gradual energy buildup
  if (getState() === 'charging') {
    const elapsed = performance.now() - chargeStart;
    const t = Math.min(elapsed / CONFIG.CHARGE_DURATION, 1);
    particles.chargeInward(t);
    particles.setBloom(CONFIG.BASE_BLOOM + (CONFIG.CHARGE_BLOOM - CONFIG.BASE_BLOOM) * t);
    pts.material.size = CONFIG.PARTICLE_SIZE * (1 + t * (CHARGE_SIZE_MULT - 1));
    pts.rotation.y += (0.1 + t * 0.5) * dt;
    ren.toneMappingExposure = CONFIG.TONE_EXPOSURE * (1 + t * 0.3);
    scn.background.setRGB(t * 0.02, t * 0.01, t * 0.03);
    shakeX = (Math.random() - 0.5) * t * CHARGE_SHAKE;
    shakeY = (Math.random() - 0.5) * t * CHARGE_SHAKE;
  }

  // Active spike (first 200ms burst then settle)
  if (spikeStart > 0) {
    const elapsed = performance.now() - spikeStart;
    if (elapsed < SPIKE_DURATION) {
      const ease = 1 - elapsed / SPIKE_DURATION;
      pts.material.size = CONFIG.PARTICLE_SIZE * (1 + ease * (SPIKE_SIZE_MULT - 1));
      shakeX = (Math.random() - 0.5) * ease * SPIKE_SHAKE;
      shakeY = (Math.random() - 0.5) * ease * SPIKE_SHAKE;
      const flash = ease * 0.15;
      scn.background.setRGB(flash, flash, flash);
      ren.toneMappingExposure = CONFIG.TONE_EXPOSURE * (1 + ease * 0.5);
    } else {
      spikeStart = 0;
      pts.material.size = CONFIG.PARTICLE_SIZE;
      ren.toneMappingExposure = CONFIG.TONE_EXPOSURE;
      scn.background.setRGB(0, 0, 0);
    }
  }

  // Apply shake
  cam.position.x += shakeX;
  cam.position.y += shakeY;

  // Purple pulsation
  if (activeDomain === 'purple' && (getState() === 'active' || getState() === 'control')) {
    purple.tick(dt, time, particles);
  }
}

/** Boot the entire application. */
export function init() {
  const canvas = document.getElementById('scene');
  particles.init(canvas);
  cameraControl.init(particles.getCamera());
  particles.setOnFrame(frameLoop);

  intro.show(() => { setState('idle'); });
  gesture.init(onGesture);
  onStateChange(handleStateChange);
}

/** Called when gesture system detects a domain activation. */
function onGesture(domain) {
  if (getState() !== 'idle') return;
  if (!domains[domain]) {
    console.warn(`[App] Unknown domain: "${domain}"`);
    return;
  }
  activeDomain = domain;
  setState('charging');
  chargeStart = performance.now();
  chargeTimer = setTimeout(() => { setState('active'); }, CONFIG.CHARGE_DURATION);
}

/** React to state transitions. */
function handleStateChange(newState) {
  switch (newState) {
    case 'active':
      spikeStart = performance.now();
      particles.setBloom(CONFIG.ACTIVE_BLOOM);
      if (activeDomain && domains[activeDomain]) {
        domains[activeDomain].apply(particles);
      }
      audio.play(activeDomain, () => { setState('control'); });
      captions.show(activeDomain);
      break;

    case 'control':
      cameraControl.enable();
      break;

    case 'idle': {
      clearTimeout(chargeTimer);
      cameraControl.disable();
      captions.hide();
      audio.stop();
      spikeStart = 0;
      shakeX = 0;
      shakeY = 0;
      const pts = particles.getPoints();
      const ren = particles.getRenderer();
      pts.material.size = CONFIG.PARTICLE_SIZE;
      pts.rotation.y = 0;
      ren.toneMappingExposure = CONFIG.TONE_EXPOSURE;
      particles.getScene().background.setRGB(0, 0, 0);
      particles.setBloom(CONFIG.BASE_BLOOM);
      if (activeDomain && domains[activeDomain]) {
        domains[activeDomain].reset(particles);
      }
      activeDomain = null;
      break;
    }
  }
}
