/**
 * captions.js — Subtitle overlay for domain activation.
 * Shows/hides text in the #captions DOM element.
 */

const CAPTIONS = {
  shrine: 'Malevolent Shrine',
  void:   'Infinite Void',
  purple: 'Hollow Purple',
};

let el = null;

/**
 * Ensure the caption text element exists.
 */
function ensure() {
  if (el) return;
  const container = document.getElementById('captions');
  el = document.createElement('div');
  el.className = 'caption-text';
  container.appendChild(el);
}

/**
 * Show the caption for a domain with a fade-in.
 * @param {string} domain — 'shrine' | 'void' | 'purple'
 */
export function show(domain) {
  ensure();
  const text = CAPTIONS[domain];
  if (!text) {
    console.warn(`[Captions] No caption for domain: "${domain}"`);
    return;
  }
  el.textContent = text;
  // Force reflow so transition fires even if already visible
  el.classList.remove('visible');
  void el.offsetWidth;
  el.classList.add('visible');
}

/**
 * Hide the caption with a fade-out.
 */
export function hide() {
  if (el) {
    el.classList.remove('visible');
  }
}
