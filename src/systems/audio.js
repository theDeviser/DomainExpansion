/**
 * audio.js — Domain voice playback.
 * Mapping is configurable in one place so voice files
 * can be changed later without touching other modules.
 */

const VOICE_MAP = {
  shrine: '/assets/audio/shrine_voice.mp3',
  void:   '/assets/audio/void_voice.mp3',
  purple: '/assets/audio/mahito_voice.mp3',
};

let currentAudio = null;

/**
 * Play the voice line for a domain.
 * @param {string} domain — 'shrine' | 'void' | 'purple'
 * @param {function} onEnd — called when playback finishes
 */
export function play(domain, onEnd) {
  stop();

  const src = VOICE_MAP[domain];
  if (!src) {
    console.warn(`[Audio] No voice mapped for domain: "${domain}"`);
    return;
  }

  currentAudio = new Audio(src);
  currentAudio.addEventListener('ended', () => {
    currentAudio = null;
    if (onEnd) onEnd();
  });
  currentAudio.play().catch((err) => {
    console.warn('[Audio] Playback blocked:', err.message);
  });
}

/**
 * Stop current playback immediately.
 */
export function stop() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
