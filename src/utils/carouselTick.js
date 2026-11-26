// Short mechanical "tick" when a new item becomes the centred/active one in the
// carousel. Independent from the piano (AudioKeys): own AudioContext, own file.

// ── Tuning ───────────────────────────────────────────────────────────────────
export const TICK_MASTER_VOLUME = 0.25; // the file is mastered hot (0 dB)
export const TICK_RATE_MIN = 0.95; // random playbackRate per play…
export const TICK_RATE_MAX = 1.05; // …between these two values
export const TICK_GAIN_VARIATION = 0.1; // ±10 % random gain per play
export const TICK_MIN_INTERVAL_MS = 60; // at most one tick per 60 ms
// ─────────────────────────────────────────────────────────────────────────────

const TICK_SRC = "/sounds/tick-gear.wav";
const UNLOCK_EVENTS = ["pointerdown", "touchstart", "wheel", "keydown"];

let context = null;
let buffer = null;
let fileRequest = null;
let decodeRequest = null;
let lastPlayTime = 0;
let isListening = false;

const randomBetween = (min, max) => min + Math.random() * (max - min);

const fetchFile = () => {
  if (!fileRequest) {
    fileRequest = fetch(TICK_SRC)
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .catch(() => null);
  }
  return fileRequest;
};

const decodeOnce = () => {
  if (!decodeRequest && context) {
    decodeRequest = fetchFile().then((data) =>
      data
        ? context
            .decodeAudioData(data)
            .then((decoded) => {
              buffer = decoded;
            })
            .catch(() => {})
        : null
    );
  }
  return decodeRequest;
};

// Runs on user interaction only: creates/resumes the single AudioContext.
const unlock = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!context) context = new AudioContextClass();
  if (context.state === "suspended") void context.resume().catch(() => {});
  void decodeOnce();

  if (context.state === "running") stopListening();
};

const stopListening = () => {
  if (!isListening) return;
  UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlock, true));
  isListening = false;
};

/** Call once from the carousel: prefetches the file and waits for a user interaction. */
export function initCarouselTick() {
  if (typeof window === "undefined") return;
  void fetchFile();
  if (isListening || context?.state === "running") return;
  UNLOCK_EVENTS.forEach((type) =>
    window.addEventListener(type, unlock, { capture: true, passive: true })
  );
  isListening = true;
}

/** Plays one tick (silently skipped before the first interaction or within the rate limit). */
export function playCarouselTick() {
  if (!context || context.state !== "running" || !buffer) return;

  const now = performance.now();
  if (now - lastPlayTime < TICK_MIN_INTERVAL_MS) return;
  lastPlayTime = now;

  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.playbackRate.value = randomBetween(TICK_RATE_MIN, TICK_RATE_MAX);
  gain.gain.value =
    TICK_MASTER_VOLUME * randomBetween(1 - TICK_GAIN_VARIATION, 1 + TICK_GAIN_VARIATION);

  source.connect(gain);
  gain.connect(context.destination);
  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };
  source.start();
}
