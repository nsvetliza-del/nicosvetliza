const videoCache = new Map();
const linkPreloadCache = new Set();

export const optimizeVideoSrc = (src) => {
  if (!src?.includes("/video/upload/")) return src;
  if (src.includes("/video/upload/f_auto,q_auto/")) return src;
  return src.replace("/video/upload/", "/video/upload/f_auto,q_auto/");
};

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
  const optimizedSrc = optimizeVideoSrc(src);
  if (videoCache.has(optimizedSrc)) {
    const cached = videoCache.get(optimizedSrc);
    if (priority === "auto" && cached.preload !== "auto") {
      cached.preload = "auto";
      cached.load();
    }
    return cached;
  }

  const video = createVideoPreload(optimizedSrc, priority);

  videoCache.set(optimizedSrc, video);
  return video;
}

export function preloadVideoLink(src) {
  if (!src || typeof document === "undefined") return null;
  const optimizedSrc = optimizeVideoSrc(src);
  if (linkPreloadCache.has(optimizedSrc)) return null;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "video";
  link.href = optimizedSrc;
  document.head.appendChild(link);
  linkPreloadCache.add(optimizedSrc);
  return link;
}

export function getPreloadedVideo(src) {
  if (!src) return null;
  return videoCache.get(optimizeVideoSrc(src)) ?? null;
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
