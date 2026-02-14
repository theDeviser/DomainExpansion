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
const FREEZE_DURATION = 250;
const BURST_TIMESCALE = 1.3;

let spikeStart = 0;
let shakeX = 0, shakeY = 0;
let freezeStart = 0;
let timeScale = 1;
let timeScaleTarget = 1;

/** Per-frame hook — called every frame by the render loop. */
function frameLoop(dt, time) {
  const cam = particles.getCamera();
  const ren = particles.getRenderer();
  const pts = particles.getPoints();
  const scn = particles.getScene();

  // Smooth timeScale interpolation
  timeScale += (timeScaleTarget - timeScale) * 0.1;
  particles.setTimeScale(timeScale);

  // Remove previous frame's shake
  cam.position.x -= shakeX;
  cam.position.y -= shakeY;
  shakeX = 0;
  shakeY = 0;

  cameraControl.tick();

  // Idle: gentle camera parallax drift
  if (getState() === 'idle') {
    cam.position.x = Math.sin(time * 0.15) * 1.5;
    cam.position.y = Math.cos(time * 0.2) * 1.0;
    cam.lookAt(0, 0, 0);
  }

  // Charging: gradual energy compression
  if (getState() === 'charging') {
    const elapsed = performance.now() - chargeStart;
    const t = Math.min(elapsed / CONFIG.CHARGE_DURATION, 1);
    timeScaleTarget = 1.0 - t * 0.3; // slow down to 0.7
    particles.chargeInward(t);
    particles.setBloom(CONFIG.BASE_BLOOM + (CONFIG.CHARGE_BLOOM - CONFIG.BASE_BLOOM) * t);
    pts.material.size = CONFIG.PARTICLE_SIZE * (1 + t * (CHARGE_SIZE_MULT - 1));
    const rotSpeed = activeDomain === 'shrine' ? 0.05 + t * 0.2 : 0.1 + t * 0.5;
    pts.rotation.y += rotSpeed * dt;
    ren.toneMappingExposure = CONFIG.TONE_EXPOSURE * (1 - t * 0.1); // dim during compression
    if (activeDomain === 'shrine') {
      scn.background.setRGB(t * 0.06, t * 0.005, t * 0.005); // deep red-black
    } else {
      scn.background.setRGB(t * 0.02, t * 0.01, t * 0.03);
    }
    shakeX = (Math.random() - 0.5) * t * CHARGE_SHAKE;
    shakeY = (Math.random() - 0.5) * t * CHARGE_SHAKE;
  }

  // Freeze-frame: near-frozen invocation moment
  if (freezeStart > 0) {
    const elapsed = performance.now() - freezeStart;
    if (elapsed < FREEZE_DURATION) {
      timeScaleTarget = 0.1;
      ren.toneMappingExposure = CONFIG.TONE_EXPOSURE * 1.15;
      shakeX = (Math.random() - 0.5) * 0.05;
      shakeY = (Math.random() - 0.5) * 0.05;
    } else {
      freezeStart = 0;
      setState('active');
    }
  }

  // Active spike (burst then settle)
  if (spikeStart > 0) {
    const elapsed = performance.now() - spikeStart;
    if (elapsed < SPIKE_DURATION) {
      const ease = 1 - elapsed / SPIKE_DURATION;
      timeScaleTarget = 1.0 + ease * (BURST_TIMESCALE - 1.0); // 1.3 → 1.0
      pts.material.size = CONFIG.PARTICLE_SIZE * (1 + ease * (SPIKE_SIZE_MULT - 1));
      shakeX = (Math.random() - 0.5) * ease * SPIKE_SHAKE;
      shakeY = (Math.random() - 0.5) * ease * SPIKE_SHAKE;
      const flash = ease * 0.15;
      scn.background.setRGB(flash, flash, flash);
      ren.toneMappingExposure = CONFIG.TONE_EXPOSURE * (1 + ease * 0.5);
    } else {
      spikeStart = 0;
      timeScaleTarget = 1.0;
      pts.material.size = CONFIG.PARTICLE_SIZE;
      ren.toneMappingExposure = CONFIG.TONE_EXPOSURE;
      scn.background.setRGB(0, 0, 0);
    }
  }

  // Apply shake
  cam.position.x += shakeX;
  cam.position.y += shakeY;

  // Purple pulsation + scale oscillation
  const state = getState();
  if (activeDomain === 'purple' && (state === 'active' || state === 'control')) {
    purple.tick(dt, time, particles);
    pts.material.size = CONFIG.PARTICLE_SIZE * (1 + Math.sin(time * 3.0) * 0.15);
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
  chargeTimer = setTimeout(() => { freezeStart = performance.now(); }, CONFIG.CHARGE_DURATION);
}

/** React to state transitions. */
function handleStateChange(newState) {
  switch (newState) {
    case 'active':
      timeScaleTarget = BURST_TIMESCALE;
      spikeStart = performance.now();
      particles.setBloom(CONFIG.ACTIVE_BLOOM);
      if (activeDomain && domains[activeDomain]) {
        domains[activeDomain].apply(particles);
      }
      audio.play(activeDomain, () => { setState('control'); });
      captions.show(activeDomain);
      break;

    case 'control':
      if (activeDomain === 'shrine') {
        cameraControl.enable({ sensitivity: 0.5, inertia: 0.025 });
      } else {
        cameraControl.enable();
      }
      break;

    case 'idle': {
      clearTimeout(chargeTimer);
      cameraControl.disable();
      captions.hide();
      audio.stop();
      spikeStart = 0;
      freezeStart = 0;
      shakeX = 0;
      shakeY = 0;
      timeScale = 1;
      timeScaleTarget = 1;
      particles.setTimeScale(1);
      const pts = particles.getPoints();
      const ren = particles.getRenderer();
      pts.material.size = CONFIG.PARTICLE_SIZE;
      pts.rotation.y = 0;
      ren.toneMappingExposure = CONFIG.TONE_EXPOSURE;
      const scn = particles.getScene();
      scn.background.setRGB(0, 0, 0);
      scn.fog.color.setHex(0x000000);
      particles.setBloom(CONFIG.BASE_BLOOM);
      particles.getCamera().lookAt(0, 0, 0);
      if (activeDomain && domains[activeDomain]) {
        domains[activeDomain].reset(particles);
      }
      activeDomain = null;
      break;
    }
  }
}
