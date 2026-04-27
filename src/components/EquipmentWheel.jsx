import React, { useCallback, useEffect, useRef, useState } from "react";

const FRONT_ANGLE = Math.PI / 2;
const DEBUG_EQUIPMENT_FOCUS = false;

function angularDistance(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export default function EquipmentWheel({ items }) {
  const itemRefs = useRef([]);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(null);
  const frameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const isHoveredRef = useRef(false);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const activeIndexRef = useRef(0);
  const labelTimeRef = useRef(0);
  const [activeItem, setActiveItem] = useState(items[0]);

  const updateWheel = useCallback(
    (forceLabel = false) => {
      const total = items.length;
      if (!total || typeof window === "undefined") return;

      const isMobile = window.innerWidth <= 768;
      const radiusX = isMobile ? window.innerWidth * 0.4 : window.innerWidth * 0.28;
      const radiusY = isMobile ? 82 : 115;
      let strongestIndex = 0;
      let strongestFrontness = -1;
      let strongestX = 0;

      items.forEach((item, index) => {
        const element = itemRefs.current[index];
        if (!element) return;

        const baseAngle = (index / total) * Math.PI * 2;
        const angle = baseAngle + rotationRef.current;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;
        const distanceToFront = Math.abs(angularDistance(angle, FRONT_ANGLE));
        const frontness = Math.max(0, 1 - distanceToFront / 1.05);
        const scale = 0.58 + Math.pow(frontness, 2.5) * 0.72;
        const opacity = 0.22 + Math.pow(frontness, 1.25) * 0.78;
        const blur = (1 - frontness) * 6;
        const zIndex = Math.round(frontness * 1000);

        element.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        element.style.opacity = opacity;
        element.style.filter = `blur(${blur}px) grayscale(1)`;
        element.style.zIndex = zIndex;

        if (frontness > strongestFrontness) {
          strongestFrontness = frontness;
          strongestIndex = index;
          strongestX = x;
        }
      });

      if (DEBUG_EQUIPMENT_FOCUS && !isMobile) {
        console.debug("equipment focus x", Math.round(strongestX));
      }

      const now = performance.now();
      if (forceLabel || now - labelTimeRef.current > 150) {
        labelTimeRef.current = now;
        if (activeIndexRef.current !== strongestIndex || forceLabel) {
          activeIndexRef.current = strongestIndex;
          setActiveItem(items[strongestIndex]);
        }
      }
    },
    [items]
  );

  const focusItem = useCallback(
    (index) => {
      const total = items.length;
      if (!total) return;

      const baseAngle = (index / total) * Math.PI * 2;
      const target = FRONT_ANGLE - baseAngle;
      const difference = angularDistance(target, rotationRef.current);
      targetRotationRef.current = rotationRef.current + difference;
    },
    [items.length]
  );

  useEffect(() => {
    rotationRef.current = 0;
    targetRotationRef.current = null;
    setActiveItem(items[0]);

    const animate = () => {
      if (targetRotationRef.current !== null) {
        const distance = targetRotationRef.current - rotationRef.current;
        rotationRef.current += distance * 0.12;

        if (Math.abs(distance) < 0.001) {
          rotationRef.current = targetRotationRef.current;
          targetRotationRef.current = null;
          updateWheel(true);
        }
      } else if (!isDraggingRef.current) {
        const speed = isHoveredRef.current ? 0.0008 : 0.0025;
        rotationRef.current += speed + velocityRef.current;
        velocityRef.current *= 0.92;
      }

      updateWheel();
      frameRef.current = requestAnimationFrame(animate);
    };

    updateWheel(true);
    frameRef.current = requestAnimationFrame(animate);

    const handleResize = () => updateWheel(true);
    window.addEventListener("resize", handleResize);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [items, updateWheel]);

  const handlePointerDown = (event) => {
    isDraggingRef.current = true;
    didDragRef.current = false;
    targetRotationRef.current = null;
    lastXRef.current = event.clientX;
    velocityRef.current = 0;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDraggingRef.current) return;

    const currentX = event.clientX;
    const deltaX = currentX - lastXRef.current;
    const rotationDelta = -deltaX * 0.002;

    if (Math.abs(deltaX) > 2) {
      didDragRef.current = true;
    }

    rotationRef.current += rotationDelta;
    velocityRef.current = rotationDelta * 0.35;
    lastXRef.current = currentX;
    updateWheel();
  };

  const handlePointerUp = (event) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleWheel = (event) => {
    rotationRef.current += event.deltaY * 0.0012;
    targetRotationRef.current = null;
    updateWheel();
  };

  return (
    <section className="equipment-wheel-wrap" aria-label="Equipment logo wheel">
      <div
        className="equipment-wheel"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div className="equipment-wheel-stage">
          {items.map((item, index) => (
            <button
              key={item.name}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              className="equipment-logo-item"
              type="button"
              style={{ "--logo-index": index }}
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }

                focusItem(index);
              }}
              aria-label={`Focus ${item.name}`}
            >
              <img src={item.image} alt={item.name} draggable="false" />
            </button>
          ))}
        </div>
      </div>

      {activeItem ? (
        <p className="equipment-active-label" aria-live="polite">
          <span>{activeItem.name}</span>
          <span>{activeItem.category}</span>
        </p>
      ) : null}
    </section>
  );
}
