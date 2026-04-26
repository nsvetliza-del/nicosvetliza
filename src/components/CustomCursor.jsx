import React, { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const rafRef = useRef(0);
  const pointerRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return undefined;

    const update = () => {
      pointerRef.current.x += (targetRef.current.x - pointerRef.current.x) * 0.24;
      pointerRef.current.y += (targetRef.current.y - pointerRef.current.y) * 0.24;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${pointerRef.current.x}px, ${pointerRef.current.y}px, 0)`;
      }

      rafRef.current = window.requestAnimationFrame(update);
    };

    const handleMove = (event) => {
      targetRef.current = { x: event.clientX, y: event.clientY };
      setIsVisible(true);

      const clickable = event.target?.closest?.(
        'a, button, [role="button"], input, textarea, select, summary'
      );
      setIsActive(Boolean(clickable));
    };

    const handleLeave = () => setIsVisible(false);

    rafRef.current = window.requestAnimationFrame(update);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${isVisible ? "is-visible" : ""} ${isActive ? "is-active" : ""}`}
      aria-hidden="true"
    />
  );
}
