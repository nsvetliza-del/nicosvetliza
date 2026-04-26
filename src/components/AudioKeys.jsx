import React, { useEffect, useMemo, useRef } from "react";

const naturalNotes = [
  ["C4", 261.63],
  ["D4", 293.66],
  ["E4", 329.63],
  ["F4", 349.23],
  ["G4", 392.0],
  ["A4", 440.0],
  ["B4", 493.88],
  ["C5", 523.25],
  ["D5", 587.33],
  ["E5", 659.25],
  ["F5", 698.46],
  ["G5", 783.99],
  ["A5", 880.0],
  ["B5", 987.77],
];

const accidentalNotes = [
  ["C#4", 277.18, 0],
  ["D#4", 311.13, 1],
  ["F#4", 369.99, 3],
  ["G#4", 415.3, 4],
  ["A#4", 466.16, 5],
  ["C#5", 554.37, 7],
  ["D#5", 622.25, 8],
  ["F#5", 739.99, 10],
  ["G#5", 830.61, 11],
  ["A#5", 932.33, 12],
];

export default function AudioKeys() {
  const audioContextRef = useRef(null);

  const naturals = useMemo(
    () =>
      naturalNotes.map(([id, note], index) => ({
        id,
        note,
        cx: 42 + index * 44,
        cy: 88 + (index % 2 === 0 ? 0 : 2),
      })),
    []
  );

  const accidentals = useMemo(
    () =>
      accidentalNotes.map(([id, note, whiteIndex]) => ({
        id,
        note,
        cx: 64 + whiteIndex * 44,
        cy: 36 + (whiteIndex % 2 === 0 ? -2 : 2),
      })),
    []
  );

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close?.();
    };
  }, []);

  const playTone = async (frequency) => {
    if (typeof window === "undefined") return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      await context.resume();
    }

    const now = context.currentTime;
    const sine = context.createOscillator();
    const triangle = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gainNode = context.createGain();

    sine.type = "sine";
    triangle.type = "triangle";
    sine.frequency.setValueAtTime(frequency, now);
    triangle.frequency.setValueAtTime(frequency, now);
    triangle.detune.setValueAtTime(5, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600, now);
    filter.Q.setValueAtTime(0.55, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.45, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.11, now + 0.24);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    sine.connect(filter);
    triangle.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);

    sine.start(now);
    triangle.start(now);
    sine.stop(now + 0.95);
    triangle.stop(now + 0.95);
  };

  const handleKeyDown = (event, note) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    void playTone(note);
  };

  return (
    <section className="audio-keys-wrap" aria-label="Notes keyboard">
      <svg className="audio-keys-sketch" viewBox="0 0 660 132" role="group" aria-label="Two octave notes">
        <g className="audio-notes-natural">
          {naturals.map((key) => (
            <g
              key={key.id}
              className="audio-note audio-note-natural"
              role="button"
              tabIndex="0"
              aria-label={`Play ${key.id}`}
              onClick={() => void playTone(key.note)}
              onKeyDown={(event) => handleKeyDown(event, key.note)}
            >
              <circle cx={key.cx} cy={key.cy} r="14" />
              <circle className="audio-note-echo" cx={key.cx + 1.1} cy={key.cy + 1.2} r="14" />
            </g>
          ))}
        </g>

        <g className="audio-notes-accidental">
          {accidentals.map((key) => (
            <g
              key={key.id}
              className="audio-note audio-note-accidental"
              role="button"
              tabIndex="0"
              aria-label={`Play ${key.id}`}
              onClick={() => void playTone(key.note)}
              onKeyDown={(event) => handleKeyDown(event, key.note)}
            >
              <circle cx={key.cx} cy={key.cy} r="10.5" />
            </g>
          ))}
        </g>
      </svg>
    </section>
  );
}
