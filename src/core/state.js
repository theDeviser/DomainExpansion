/**
 * state.js — Simple string-based state machine.
 * No class, no framework — just a module-scoped variable + validation.
 */

const STATES = ['intro', 'idle', 'charging', 'active', 'control'];

let current = 'intro';
const listeners = [];

/**
 * Returns the current state string.
 */
export function getState() {
  return current;
}

/**
 * Transition to a new state.
 * Validates against allowed states and logs the transition.
 */
export function setState(newState) {
  if (!STATES.includes(newState)) {
    console.warn(`[State] Invalid state: "${newState}". Allowed: ${STATES.join(', ')}`);
    return;
  }
  if (newState === current) return;

  const prev = current;
  current = newState;
  console.log(`[State] ${prev} → ${current}`);

  for (const fn of listeners) {
    fn(current, prev);
  }
}

/**
 * Register a callback for state transitions.
 * Callback receives (newState, prevState).
 */
export function onStateChange(callback) {
  listeners.push(callback);
}
