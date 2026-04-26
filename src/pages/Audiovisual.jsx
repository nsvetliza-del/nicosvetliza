import React from 'react'
import VideoCard from "../components/VideoCard";
import CTA from "../components/CTA";
import { projects } from "../data/projects";

export default function Audiovisual() {
  const audiovisualProjects = projects.filter((project) => project.group === "Audiovisual");

  return (
    <>
      <section className="page-hero section">
        <div className="container page-shell">
          <div className="archive-page-intro">
            <p className="section-label">Audiovisual</p>
            <h1>Moving image, edit rhythm and controlled atmosphere.</h1>
            <p>Films, sessions and visual pieces built for branded contexts.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container page-shell">
          <div className="video-grid">
            {audiovisualProjects.map((project) => (
              <VideoCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>

      <CTA title="Need a film with stronger visual control?" text="Direction, rhythm and moving image systems built to feel sharp, clear and memorable." />
    </>
  );
}
