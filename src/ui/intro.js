/**
 * intro.js — Intro overlay with title and Enter button.
 * Shows on app start, hides with fade-out on click, calls onEnter.
 */

/**
 * Show the intro screen.
 * @param {function} onEnter — called after fade-out completes
 */
export function show(onEnter) {
  const container = document.getElementById('intro');

  container.innerHTML = `
    <div class="intro-screen">
      <h1 class="intro-title">Domain Expansion</h1>
      <button class="enter-btn">Enter</button>
    </div>
  `;

  const screen = container.querySelector('.intro-screen');
  const btn = container.querySelector('.enter-btn');

  btn.addEventListener('click', () => {
    screen.classList.add('hidden');

    // Wait for CSS fade-out transition to finish
    screen.addEventListener('transitionend', () => {
      container.innerHTML = '';
      if (onEnter) onEnter();
    }, { once: true });
  });
}
