import React from 'react'
import WorkGrid from "../components/WorkGrid";
import CTA from "../components/CTA";
import { projects } from "../data/projects";

export default function Advertising() {
  const advertisingProjects = projects.filter((project) => project.group === "Advertising");

  return (
    <>
      <section className="page-hero section">
        <div className="container page-shell">
          <div className="archive-page-intro">
            <p className="section-label">Advertising</p>
            <h1>Campaign systems and visual communication.</h1>
            <p>Launches, paid media structures and branded communication assets.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container page-shell">
          <WorkGrid projects={advertisingProjects} />
        </div>
      </section>

      <CTA title="Need stronger campaign structure?" text="From concept to rollout, each piece is designed to feel clear, premium and usable across formats." />
    </>
  );
}
