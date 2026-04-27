import React, { useEffect, useRef } from "react";
import MinimalMenu from "../components/MinimalMenu";
import { equipment } from "../data/equipment";

export default function Equipment() {
  const itemRefs = useRef([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      itemRefs.current.forEach((item) => item?.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.22 }
    );

    itemRefs.current.forEach((item) => {
      if (item) observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="equipment-page page-enter-active">
      <MinimalMenu />

      <section className="equipment-content">
        <header className="equipment-intro">
          <p className="equipment-kicker">equipment / tools</p>
          <h1>selected tools, instruments and systems I use to shape sound.</h1>
        </header>

        <div className="equipment-grid" aria-label="Equipment and tools">
          {equipment.map((item, index) => (
            <a
              key={item.name}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              className="equipment-item"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ "--reveal-delay": `${index * 55}ms` }}
            >
              <div className="equipment-logo-wrap" aria-hidden="true">
                <img
                  src={item.image}
                  alt=""
                  className="equipment-logo"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                <span className="equipment-wordmark">{item.name}</span>
              </div>
              <span className="equipment-name">{item.name}</span>
              <span className="equipment-category">{item.category}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
