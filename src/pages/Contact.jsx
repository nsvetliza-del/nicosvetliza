import React, { useState } from "react";
import MinimalMenu from "../components/MinimalMenu";

export default function Contact() {
  const [formStatus, setFormStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const subject = formData.get("subject")?.toString().trim() ?? "";
    const message = formData.get("message")?.toString().trim() ?? "";

    setIsSending(true);
    setFormStatus("");

    try {
      const response = await fetch("https://formspree.io/f/xpqkedyz", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Formspree request failed");
      }

      event.currentTarget.reset();
      setFormStatus("message sent.");
    } catch (error) {
      setFormStatus("something went wrong. please try again.");
    } finally {
      setIsSending(false);
    }
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
            <input type="email" name="email" placeholder="your email" required />
            <input type="text" name="subject" placeholder="subject" required />
            <textarea name="message" placeholder="your message" rows="4" required />
            <button type="submit" disabled={isSending}>
              {isSending ? "sending..." : "send message"}
            </button>
            {formStatus ? <p className="contact-form-status">{formStatus}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
