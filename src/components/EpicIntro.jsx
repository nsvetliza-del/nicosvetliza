import React, { useCallback, useEffect, useRef, useState } from "react";

const orchestraTuning =
  "https://res.cloudinary.com/dlpmcvfva/video/upload/v1777178051/orchestra-tuning_su2efh.mp3";

const introWords = [
  { text: "soundscape", marker: "—", x: "-13vw", y: "-7vh" },
  { text: "sound design", marker: "[ ]", x: "11vw", y: "-9vh" },
  { text: "composition", marker: "/", x: "-9vw", y: "0vh" },
  { text: "music production", marker: "+", x: "13vw", y: "4vh" },
  { text: "film scoring", marker: "( )", x: "-6vw", y: "10vh" },
  { text: "sound immersion", marker: "·", x: "8vw", y: "-1vh" },
];

export default function EpicIntro({ enabled = true, onComplete }) {
  const [phase, setPhase] = useState("gate");
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeWord, setActiveWord] = useState(0);

  const timeoutRefs = useRef([]);
  const hasStartedRef = useRef(false);
  const audioRef = useRef(null);

  const clearScheduledWork = useCallback(() => {
    timeoutRefs.current.forEach((timer) => window.clearTimeout(timer));
    timeoutRefs.current = [];
  }, []);

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(callback, delay);
    timeoutRefs.current.push(timer);
    return timer;
  }, []);

  const startIntro = useCallback(async () => {
    if (!enabled || hasStartedRef.current) return;

    hasStartedRef.current = true;

    console.log("initial play clicked");

    const audio = audioRef.current;

    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.45;
        audio.loop = false;
        audio.muted = false;

        console.log("orchestra play called immediately");

        await audio.play();

        console.log("orchestra started");
      } catch (error) {
        console.warn("orchestra audio error", error);
      }
    } else {
      console.warn("orchestra audio ref missing");
    }

    setPhase("words");
    setActiveWord(0);
    setIsLeaving(false);
    clearScheduledWork();

    introWords.forEach((_, index) => {
      if (index === 0) return;
      schedule(() => setActiveWord(index), 760 * index);
    });

    schedule(() => {
      setPhase("name");
    }, 4760);

    schedule(() => {
      setIsLeaving(true);
    }, 7200);

    schedule(() => {
      setPhase("done");
      onComplete?.();
    }, 8200);
  }, [clearScheduledWork, enabled, onComplete, schedule]);

  useEffect(() => {
    if (!enabled) return undefined;

    const audio = new Audio();
    audio.src = orchestraTuning;
    audio.preload = "auto";
    audio.volume = 0.45;
    audio.loop = false;

    audio.addEventListener("canplaythrough", () => {
      console.log("orchestra audio can play through");
    });

    audio.addEventListener("ended", () => {
      console.log("orchestra audio ended");
    });

    audio.addEventListener("error", () => {
      console.warn("orchestra audio failed to load");
    });

    audio.load();
    audioRef.current = audio;

    setPhase("gate");
    setActiveWord(0);
    setIsLeaving(false);
    hasStartedRef.current = false;

    return () => {
      clearScheduledWork();

      audio.pause();
      audio.currentTime = 0;

      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [clearScheduledWork, enabled]);

  if (!enabled) return null;

  return (
    <div className={`epic-intro ${isLeaving ? "is-leaving" : ""}`}>
      {phase === "gate" ? (
        <button
          type="button"
          className="epic-intro-play"
          onClick={startIntro}
          aria-label="Play intro"
        >
          <span className="epic-intro-play-icon" aria-hidden="true" />
        </button>
      ) : null}

      {phase === "words" ? (
        <div className="epic-intro-words">
          <div
            key={introWords[activeWord].text}
            className="epic-intro-word-shot is-active"
            style={{
              "--word-x": introWords[activeWord].x,
              "--word-y": introWords[activeWord].y,
            }}
          >
            <span className="epic-intro-word-marker">
              {introWords[activeWord].marker}
            </span>
            <span className="epic-intro-word-text">
              {introWords[activeWord].text}
            </span>
          </div>
        </div>
      ) : null}

      {phase === "name" ? (
        <div className="epic-intro-title is-visible">
          <div className="epic-intro-title-wave" aria-hidden="true" />
          <span className="epic-intro-title-shadow" aria-hidden="true">
            Nico Svetliza
          </span>
          <span className="epic-intro-title-main">Nico Svetliza</span>
        </div>
      ) : null}
    </div>
  );
}