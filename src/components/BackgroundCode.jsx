import React, { useEffect, useRef, useState } from "react";
import { introWords } from "./EpicIntro";
import { useTextEncoding } from "../utils/useTextEncoding";

// Faster than the title (45 ms / 620 ms).
const ENCODING = { interval: 28, duration: 260 };
const FIRST_DELAY = 1200;
const MIN_GAP = 900;
const MAX_GAP = 2200;
const VISIBLE_FOR = 2600;
const FADE_OUT = 700;
const MAX_WORDS = 4;

const randomBetween = (min, max) => min + Math.random() * (max - min);

function CodeWord({ label, x, y, isLeaving }) {
  const { text, start } = useTextEncoding(ENCODING);

  useEffect(() => {
    start(label);
  }, [label, start]);

  return (
    <span
      className={`background-code-text ${isLeaving ? "" : "is-visible"}`}
      style={{ left: `${x}vw`, top: `${y}vh` }}
    >
      {text}
    </span>
  );
}

// Intro words "coded" in the far background, several at once, each at a new
// spot. Colour comes from --text, so it flips with the background.
export default function BackgroundCode({ enabled = true }) {
  const [words, setWords] = useState([]);
  const counterRef = useRef(0);
  const recentPositionsRef = useRef([]);

  useEffect(() => {
    if (!enabled) {
      setWords([]);
      return undefined;
    }

    const timers = new Set();
    const later = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };

    const pickPosition = () => {
      let position;
      let tries = 0;
      do {
        position = { x: randomBetween(4, 78), y: randomBetween(10, 86) };
        tries += 1;
      } while (
        tries < 20 &&
        recentPositionsRef.current.some(
          (previous) => Math.hypot(position.x - previous.x, position.y - previous.y) < 18
        )
      );
      recentPositionsRef.current = [position, ...recentPositionsRef.current].slice(0, 6);
      return position;
    };

    let activeCount = 0;

    const spawn = () => {
      later(spawn, randomBetween(MIN_GAP, MAX_GAP));
      if (activeCount >= MAX_WORDS) return;

      const word = introWords[counterRef.current % introWords.length];
      counterRef.current += 1;
      const id = counterRef.current;
      const entry = { id, label: `${word.marker} ${word.text}`, ...pickPosition(), isLeaving: false };
      activeCount += 1;
      setWords((list) => [...list, entry]);

      later(() => {
        activeCount -= 1;
        setWords((list) => list.map((item) => (item.id === id ? { ...item, isLeaving: true } : item)));
      }, VISIBLE_FOR);
      later(() => {
        setWords((list) => list.filter((item) => item.id !== id));
      }, VISIBLE_FOR + FADE_OUT);
    };

    later(spawn, FIRST_DELAY);

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [enabled]);

  if (!words.length) return null;

  return (
    <div className="background-code" aria-hidden="true">
      {words.map((word) => (
        <CodeWord key={word.id} {...word} />
      ))}
    </div>
  );
}
