/**
 * app.js — Orchestrator.
 * Wires all modules together via callbacks.
 * No module imports another system module — only app.js knows about all of them.
 */

import { CONFIG } from './config.js';
import { getState, setState, onStateChange } from './state.js';
import * as particles from '../systems/particles.js';
import * as gesture from '../systems/gesture.js';
import * as audio from '../systems/audio.js';
import * as captions from '../systems/captions.js';
import * as cameraControl from '../systems/cameraControl.js';
import * as intro from '../ui/intro.js';

// Domain modules
import * as shrine from '../domains/shrine.js';
import * as voidDomain from '../domains/void.js';
import * as purple from '../domains/purple.js';

const domains = { shrine, void: voidDomain, purple };

let activeDomain = null;
let chargeTimer = null;
let chargeStart = 0;

/**
 * Per-frame hook — called every frame by the render loop.
 */
function frameLoop(dt, time) {
  cameraControl.tick();

  // Charging: compress particles inward + ramp bloom
  if (getState() === 'charging') {
    const elapsed = performance.now() - chargeStart;
    const t = Math.min(elapsed / CONFIG.CHARGE_DURATION, 1);
    particles.chargeInward(t);
    const bloom = CONFIG.BASE_BLOOM + (CONFIG.CHARGE_BLOOM - CONFIG.BASE_BLOOM) * t;
    particles.setBloom(bloom);
  }

  // Purple pulsation tick
  if (activeDomain === 'purple' && (getState() === 'active' || getState() === 'control')) {
    purple.tick(dt, time, particles);
  }
}

/**
 * Boot the entire application.
 */
export function init() {
  const canvas = document.getElementById('scene');

  // 1. Initialize Three.js scene + particles + bloom
  particles.init(canvas);

  // 2. Initialize camera control (needs camera ref)
  cameraControl.init(particles.getCamera());

  // 3. Wire per-frame hook
  particles.setOnFrame(frameLoop);

  // 4. Show intro screen
  intro.show(() => {
    setState('idle');
  });

  // 5. Initialize gesture system
  gesture.init(onGesture);

  // 6. React to state transitions
  onStateChange(handleStateChange);
}

/**
 * Called when gesture system detects a domain activation.
 */
function onGesture(domain) {
  if (getState() !== 'idle') return;
  if (!domains[domain]) {
    console.warn(`[App] Unknown domain: "${domain}"`);
    return;
  }

  activeDomain = domain;
  setState('charging');

  // Start charge timer
  chargeStart = performance.now();
  chargeTimer = setTimeout(() => {
    setState('active');
  }, CONFIG.CHARGE_DURATION);
}

/**
 * React to state transitions.
 */
function handleStateChange(newState) {
  switch (newState) {
    case 'active':
      // Snap bloom to active level
      particles.setBloom(CONFIG.ACTIVE_BLOOM);

      // Apply domain visuals (burst)
      if (activeDomain && domains[activeDomain]) {
        domains[activeDomain].apply(particles);
      }

      // Play voice line — when it ends, transition to control
      audio.play(activeDomain, () => {
        setState('control');
      });

      // Show caption
      captions.show(activeDomain);
      break;

    case 'control':
      cameraControl.enable();
      break;

    case 'idle':
      // Clean up everything
      clearTimeout(chargeTimer);
      cameraControl.disable();
      captions.hide();
      audio.stop();
      particles.setBloom(CONFIG.BASE_BLOOM);

      // Reset domain visuals
      if (activeDomain && domains[activeDomain]) {
        domains[activeDomain].reset(particles);
      }
      activeDomain = null;
      break;
  }
}
