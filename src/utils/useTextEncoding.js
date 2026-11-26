import { useCallback, useEffect, useRef, useState } from "react";

const randomTitleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#<>_-.";

export const encodeTitle = (title) =>
  title
    .split("")
    .map((char) =>
      char === " "
        ? " "
        : randomTitleChars[Math.floor(Math.random() * randomTitleChars.length)]
    )
    .join("");

/**
 * The "coding" text effect used by the carousel title: the text is shown as
 * random characters that reshuffle every `interval` ms, then resolves after
 * `duration` ms. Defaults are the title's timings (45 ms / 620 ms).
 */
export function useTextEncoding({ interval = 45, duration = 620 } = {}) {
  const [text, setText] = useState("");
  const [isEncoding, setIsEncoding] = useState(false);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const start = useCallback((target) => {
    setIsEncoding(true);
    setText(encodeTitle(target));

    window.clearTimeout(timerRef.current);
    window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setText(encodeTitle(target));
    }, interval);

    timerRef.current = window.setTimeout(() => {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      setText(target);
      setIsEncoding(false);
    }, duration);
  }, [interval, duration]);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      window.clearInterval(intervalRef.current);
    },
    []
  );

  return { text, isEncoding, start };
}
