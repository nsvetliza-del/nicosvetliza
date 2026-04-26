import React from 'react'
import { Link } from "react-router-dom";
import { projects } from "../data/projects";

export default function Hero() {
  const heroProjects = projects.slice(0, 5);

  return (
    <section className="hero-section">
      <div className="container hero-stage">
        <div className="hero-collage">
          {heroProjects.map((project, index) => (
            <article
              key={project.slug}
              className={`hero-collage-card is-${index + 1}`}
              style={{
                backgroundImage: project.images?.[0] ? `url(${project.images[0]})` : undefined,
              }}
            />
          ))}
        </div>

        <div className="hero-stage-copy hero-stage-copy-centered">
          <div className="hero-copy">
            <p className="hero-microcopy">Ads / Short Film / Sound</p>
            <p className="hero-description">
              Subtle sonic worlds for campaigns, films and visual atmospheres.
            </p>
            <div className="hero-inline-nav">
              <Link to="/work">Portfolio</Link>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
