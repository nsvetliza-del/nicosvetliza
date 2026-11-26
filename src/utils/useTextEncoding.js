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
 * random characters that reshuffle every 45 ms, then resolves after 620 ms.
 */
export function useTextEncoding() {
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
    }, 45);

    timerRef.current = window.setTimeout(() => {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      setText(target);
      setIsEncoding(false);
    }, 620);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      window.clearInterval(intervalRef.current);
    },
    []
  );

  return { text, isEncoding, start };
}
