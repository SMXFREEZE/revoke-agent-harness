"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    // Demo only, no real authentication. Wire to your provider here.
    window.setTimeout(() => setStatus("done"), 700);
  }

  return (
    <form className="auth ip-form" onSubmit={onSubmit} aria-busy={status === "loading"}>
      {isSignup && (
        <label className="field">
          <span className="field__label">Full name</span>
          <input type="text" autoComplete="name" placeholder="Alex Rivera" required />
        </label>
      )}
      <label className="field">
        <span className="field__label">Email</span>
        <input type="email" autoComplete="email" placeholder="you@school.org" required />
      </label>
      <label className="field">
        <span className="field__label">Password</span>
        <input
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="••••••••"
          required
          minLength={6}
        />
      </label>

      <div className="ip-submit auth__submit">
        <ShimmerButton type="submit" variant="violet" size="lg">
          {status === "loading" ? "One moment…" : isSignup ? "Create account" : "Log in"}
        </ShimmerButton>
      </div>

      <AnimatePresence>
        {status === "done" && (
          <motion.p
            className="auth__note"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
          >
            ✓ Demo only, connect your auth provider to go live.
          </motion.p>
        )}
      </AnimatePresence>

      <p className="auth__alt">
        {isSignup ? (
          <>
            Already a member? <Link href="/login">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/signup">Start free</Link>
          </>
        )}
      </p>
    </form>
  );
}
