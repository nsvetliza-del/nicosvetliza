import React from 'react'
import Hero from "../components/Hero";
import WorkGrid from "../components/WorkGrid";
import { projects } from "../data/projects";

export default function Home() {
  const featuredProjects = projects.filter((project) => project.featured);

  return (
    <>
      <Hero />

      <section className="home-archive section">
        <div className="container page-shell">
          <WorkGrid projects={featuredProjects} />
        </div>
      </section>
    </>
  );
}
