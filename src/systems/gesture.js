/**
 * gesture.js — Stub gesture system using keyboard shortcuts.
 * Keys 1/2/3 emit domain gestures. Mouse position simulates hand data.
 * When real MediaPipe replaces this, only the internals change —
 * the onGesture / onHandMove callback signatures stay the same.
 */

const KEY_MAP = {
  '1': 'shrine',
  '2': 'void',
  '3': 'purple',
};

let gestureCallback = null;
let handMoveCallback = null;

/**
 * Start listening for gesture inputs.
 * @param {function} onGesture — called with domain name string
 */
export function init(onGesture) {
  gestureCallback = onGesture;

  window.addEventListener('keydown', (e) => {
    const domain = KEY_MAP[e.key];
    if (domain && gestureCallback) {
      gestureCallback(domain);
    }
  });

  // Simulate hand position from mouse (normalized -1..1)
  window.addEventListener('mousemove', (e) => {
    if (!handMoveCallback) return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    handMoveCallback(x, y);
  });
}

/**
 * Register a callback for simulated hand movement.
 * @param {function} callback — called with (x, y) normalized coords
 */
export function onHandMove(callback) {
  handMoveCallback = callback;
}
