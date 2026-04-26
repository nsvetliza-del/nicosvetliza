import React from "react";
import MinimalMenu from "../components/MinimalMenu";

export default function Contact() {
  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString().trim() ?? "";
    const subject = formData.get("subject")?.toString().trim() ?? "";
    const message = formData.get("message")?.toString().trim() ?? "";
    const body = `Name: ${name}\r\n\r\n${message}`;
    const mailto = `mailto:nsvetliza@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  };

  return (
    <main className="simple-page contact-page">
      <section className="simple-page-shell">
        <MinimalMenu />
        <div className="contact-content">
          <div className="contact-intro">
            <p>
              For inquiries, collaborations, commissions or sound-driven projects,
              <br />
              feel free to reach out.
            </p>
            <p>You can send me a message directly or find me on Instagram.</p>
          </div>

          <div className="contact-links" aria-label="Direct contact links">
            <a
              className="instagram-card"
              href="https://www.instagram.com/nicosvetliza"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="instagram-label">Instagram</span>
              <span className="instagram-handle">@nicosvetliza</span>
              <span className="instagram-meta">latest visual work / behind the sound</span>
            </a>
            <a href="mailto:nsvetliza@gmail.com">nsvetliza@gmail.com</a>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="your name" required />
            <input type="text" name="subject" placeholder="subject" required />
            <textarea name="message" placeholder="your message" rows="4" required />
            <button type="submit">send message</button>
          </form>
        </div>
      </section>
    </main>
  );
}
