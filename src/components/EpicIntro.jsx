import React, { useCallback, useEffect, useRef, useState } from "react";
import orchestraTuning from "../assets/audios/orchestra-tuning.mp3";

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

  const startIntro = useCallback(() => {
    if (!enabled || hasStartedRef.current) return;

    const audio = audioRef.current;

    console.log("initial play clicked");
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.45;
      audio.loop = false;
      console.log("orchestra play called immediately");
      void audio.play().then(() => {
        console.log("orchestra started");
      }).catch((error) => {
        console.warn("orchestra audio error", error);
      });
    }

    hasStartedRef.current = true;
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

    const audio = new Audio(orchestraTuning);
    audio.preload = "auto";
    audio.onended = () => {
      console.log("orchestra audio ended");
    };
    audio.load();
    audioRef.current = audio;

    setPhase("gate");
    setActiveWord(0);
    setIsLeaving(false);
    hasStartedRef.current = false;

    return () => {
      clearScheduledWork();
      audioRef.current = null;
    };
  }, [clearScheduledWork, enabled]);

  if (!enabled) return null;

  return (
    <div className={`epic-intro ${isLeaving ? "is-leaving" : ""}`}>
      {phase === "gate" ? (
        <button type="button" className="epic-intro-play" onClick={startIntro} aria-label="Play intro">
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
            <span className="epic-intro-word-marker">{introWords[activeWord].marker}</span>
            <span className="epic-intro-word-text">{introWords[activeWord].text}</span>
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
