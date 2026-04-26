const videoCache = new Map();

export function preloadVideo(src) {
  if (!src || typeof document === "undefined") return null;
  if (videoCache.has(src)) return videoCache.get(src);

  const video = document.createElement("video");
  video.src = src;
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.load();

  videoCache.set(src, video);
  return video;
}

export function getPreloadedVideo(src) {
  if (!src) return null;
  return videoCache.get(src) ?? null;
}
