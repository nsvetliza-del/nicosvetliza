let activeSession = null;

function clearActiveSession() {
  if (!activeSession) return;

  if (activeSession.audio) {
    activeSession.audio.pause();
    activeSession.audio.currentTime = 0;
    activeSession.audio.onended = null;
  }

  activeSession = null;
}

export function stopTimedAudio() {
  clearActiveSession();
}

export function playTimedAudio(
  src,
  {
    volume = 0.45,
    onStart,
    onEnded,
    onError,
  } = {}
) {
  clearActiveSession();

  const audio = new Audio(src);
  audio.volume = volume;
  audio.loop = false;
  audio.currentTime = 0;
  audio.preload = "auto";

  const session = {
    audio,
  };

  activeSession = session;

  return audio
    .play()
    .then(() => {
      onStart?.();
      audio.onended = () => {
        if (activeSession?.audio === audio) {
          activeSession = null;
        }
        onEnded?.();
      };

      return audio;
    })
    .catch((error) => {
      if (activeSession?.audio === audio) {
        clearActiveSession();
      }
      onError?.(error);
      return null;
    });
}
