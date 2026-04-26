import React, { useEffect, useRef } from "react";

const pads = [
  { id: "kick", label: "Kick", frequency: 52, type: "kick" },
  { id: "snare", label: "Snare", frequency: 190, type: "noise" },
  { id: "hat", label: "Hat", frequency: 6200, type: "hat" },
  { id: "clap", label: "Clap", frequency: 900, type: "noise" },
  { id: "tom", label: "Tom", frequency: 116, type: "tone" },
  { id: "rim", label: "Rim", frequency: 1200, type: "tone" },
  { id: "sub", label: "Sub", frequency: 38, type: "kick" },
  { id: "perc", label: "Perc", frequency: 520, type: "tone" },
];

export default function RhythmMachine() {
  const audioContextRef = useRef(null);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close?.();
    };
  }, []);

  const getContext = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  };

  const playPad = async (pad) => {
    const context = await getContext();
    if (!context) return;

    const now = context.currentTime;
    const gainNode = context.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    gainNode.connect(context.destination);

    if (pad.type === "noise" || pad.type === "hat") {
      const buffer = context.createBuffer(1, context.sampleRate * 0.18, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) {
        data[index] = Math.random() * 2 - 1;
      }

      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      filter.type = pad.type === "hat" ? "highpass" : "bandpass";
      filter.frequency.setValueAtTime(pad.frequency, now);
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gainNode);
      source.start(now);
      source.stop(now + 0.18);
      return;
    }

    const oscillator = context.createOscillator();
    oscillator.type = pad.type === "kick" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(pad.frequency, now);
    if (pad.type === "kick") {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(22, pad.frequency * 0.45), now + 0.18);
    }
    oscillator.connect(gainNode);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
  };

  return (
    <section className="rhythm-machine" aria-label="Rhythm machine">
      {pads.map((pad) => (
        <button
          key={pad.id}
          type="button"
          className="rhythm-pad"
          onClick={() => void playPad(pad)}
        >
          {pad.label}
        </button>
      ))}
    </section>
  );
}
