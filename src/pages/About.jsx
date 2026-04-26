import React from "react";
import MinimalMenu from "../components/MinimalMenu";

export default function About() {
  return (
    <main className="simple-page about-page">
      <section className="simple-page-shell">
        <MinimalMenu />
        <div className="simple-page-copy">
          <p className="simple-page-kicker">About</p>
          <h1>Nico Svetliza works across audiovisual creation, advertising, sound and visual identity.</h1>
          <p>
            {/* Change this short bio here */}
            Nico Svetliza trabaja en la creación audiovisual, publicidad, sonido e identidad
            visual para marcas, artistas y proyectos que buscan una forma propia.
          </p>
        </div>
      </section>
    </main>
  );
}
