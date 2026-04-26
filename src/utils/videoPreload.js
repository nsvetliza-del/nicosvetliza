const videoCache = new Map();

function createVideoPreload(src, priority = "auto") {
  const video = document.createElement("video");
  video.src = src;
  video.preload = priority;
  video.muted = true;
  video.playsInline = true;
  video.load();
  return video;
}

export function preloadVideo(src, { priority = "auto" } = {}) {
  if (!src || typeof document === "undefined") return null;
  if (videoCache.has(src)) {
    const cached = videoCache.get(src);
    if (priority === "auto" && cached.preload !== "auto") {
      cached.preload = "auto";
      cached.load();
    }
    return cached;
  }

  const video = createVideoPreload(src, priority);

  videoCache.set(src, video);
  return video;
}

export function getPreloadedVideo(src) {
  if (!src) return null;
  return videoCache.get(src) ?? null;
}

export function preloadVideoBatch(sources, { priority = "metadata", delay = 0 } = {}) {
  if (typeof window === "undefined") return;

  const uniqueSources = [...new Set(sources.filter(Boolean))];
  if (!uniqueSources.length) return;

  const run = () => {
    uniqueSources.forEach((src) => {
      preloadVideo(src, { priority });
    });
  };

  if (delay > 0) {
    window.setTimeout(run, delay);
    return;
  }

  const idleCallback = window.requestIdleCallback;
  if (typeof idleCallback === "function") {
    idleCallback(run, { timeout: 1200 });
    return;
  }

  window.setTimeout(run, 180);
}
