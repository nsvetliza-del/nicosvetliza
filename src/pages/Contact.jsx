import React, { useState } from "react";
import MinimalMenu from "../components/MinimalMenu";
import avatar from "../assets/ig-avatar.jpg";

export default function Contact() {
  const [formStatus, setFormStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: formData.get("name")?.toString().trim() ?? "",
      email: formData.get("email")?.toString().trim() ?? "",
      subject: formData.get("subject")?.toString().trim() ?? "",
      message: formData.get("message")?.toString().trim() ?? "",
    };

    setIsSending(true);
    setFormStatus("");

    try {
      const response = await fetch("https://formspree.io/f/xpqkedyz", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Formspree request failed");

      form.reset();
      setFormStatus("message sent.");
    } catch {
      setFormStatus("something went wrong. please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="simple-page contact-page">
      <MinimalMenu />

      <section className="contact-content">
        <a
          className="ig-profile"
          href="https://www.instagram.com/nicosvetliza"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Nico Svetliza Instagram"
        >
          <div className="ig-avatar">
            <img src={avatar} alt="Nico Svetliza" />
          </div>

          <div className="ig-info">
            <span className="ig-username">@nicosvetliza</span>
          </div>
        </a>

        <div className="contact-intro">
          <p>
            For inquiries, collaborations, commissions or sound-driven projects,
            <br />
            feel free to reach out.
          </p>
          <p>You can send me a message directly or find me on Instagram.</p>
        </div>

        <a className="contact-email" href="mailto:nsvetliza@gmail.com">
          nsvetliza@gmail.com
        </a>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="your name" required />
          <input type="email" name="email" placeholder="your email" required />
          <input type="text" name="subject" placeholder="subject" required />
          <textarea name="message" placeholder="your message" rows="4" required />

          <button type="submit" disabled={isSending}>
            {isSending ? "sending..." : "send message"}
          </button>

          {formStatus ? (
            <p className="contact-form-status">{formStatus}</p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
