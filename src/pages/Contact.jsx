import React from "react";
import MinimalMenu from "../components/MinimalMenu";

export default function Contact() {
  return (
    <main className="simple-page">
      <section className="simple-page-shell">
        <MinimalMenu />
        <div className="simple-page-copy">
          <p className="simple-page-kicker">Contact</p>
          <h1>For projects, collaborations and commissions.</h1>
          <div className="simple-contact-list">
            {/* Change contact links here */}
            <a href="mailto:hello@nicosvetliza.com">hello@nicosvetliza.com</a>
            <a href="https://instagram.com/nicosvetliza" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://wa.me/5491100000000" target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
