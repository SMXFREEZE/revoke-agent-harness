"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    // Demo only, wire to your inbox / CRM here.
    window.setTimeout(() => setStatus("done"), 700);
  }

  return (
    <form className="contact-form ip-form" onSubmit={onSubmit} aria-busy={status === "loading"}>
      <div className="contact-form__row">
        <label className="field">
          <span className="field__label">Name</span>
          <input type="text" autoComplete="name" placeholder="Your name" required />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input type="email" autoComplete="email" placeholder="you@school.org" required />
        </label>
      </div>
      <label className="field">
        <span className="field__label">School / organisation</span>
        <input type="text" placeholder="Optional" />
      </label>
      <label className="field">
        <span className="field__label">How can we help?</span>
        <textarea rows={5} placeholder="Tell us a little about your class or school…" required />
      </label>

      <div className="ip-submit">
        <ShimmerButton type="submit" variant="violet" size="lg">
          {status === "loading" ? "Sending…" : "Send message"}
        </ShimmerButton>
      </div>

      <AnimatePresence>
        {status === "done" && (
          <motion.p className="auth__note" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} role="status">
            ✓ Thanks! This is a demo form, connect it to your inbox to receive messages.
          </motion.p>
        )}
      </AnimatePresence>
    </form>
  );
}
