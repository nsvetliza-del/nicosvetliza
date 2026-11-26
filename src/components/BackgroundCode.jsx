import React, { useEffect, useRef, useState } from "react";
import { introWords } from "./EpicIntro";
import { useTextEncoding } from "../utils/useTextEncoding";

const FIRST_DELAY = 4000;
const MIN_GAP = 7000;
const MAX_GAP = 13000;
const VISIBLE_FOR = 3200;

const randomBetween = (min, max) => min + Math.random() * (max - min);

// Occasional, very faint intro words "coded" in the far background,
// each time at a different spot. Reuses the title's encoding effect.
export default function BackgroundCode({ enabled = true }) {
  const { text, start } = useTextEncoding();
  const [shot, setShot] = useState(null);
  const wordIndexRef = useRef(0);
  const lastPositionRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setShot(null);
      return undefined;
    }

    let showTimer = 0;
    let hideTimer = 0;

    const pickPosition = () => {
      let position;
      do {
        position = { x: randomBetween(6, 74), y: randomBetween(14, 82) };
      } while (
        lastPositionRef.current &&
        Math.hypot(position.x - lastPositionRef.current.x, position.y - lastPositionRef.current.y) < 25
      );
      lastPositionRef.current = position;
      return position;
    };

    const show = () => {
      const word = introWords[wordIndexRef.current % introWords.length];
      wordIndexRef.current += 1;
      const label = `${word.marker} ${word.text}`;

      setShot({ key: wordIndexRef.current, ...pickPosition(), visible: true });
      start(label);

      hideTimer = window.setTimeout(() => {
        setShot((current) => (current ? { ...current, visible: false } : current));
      }, VISIBLE_FOR);

      showTimer = window.setTimeout(show, VISIBLE_FOR + randomBetween(MIN_GAP, MAX_GAP));
    };

    showTimer = window.setTimeout(show, FIRST_DELAY);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [enabled, start]);

  if (!shot) return null;

  return (
    <div className="background-code" aria-hidden="true">
      <span
        key={shot.key}
        className={`background-code-text ${shot.visible ? "is-visible" : ""}`}
        style={{ left: `${shot.x}vw`, top: `${shot.y}vh` }}
      >
        {text}
      </span>
    </div>
  );
}
