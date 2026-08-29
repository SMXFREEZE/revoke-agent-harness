"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShimmerButton } from "@/components/ui/ShimmerButton";

// Glassy port of ui-layouts' tabbed Login/Register card: an animated sliding
// pill toggle, frosted social buttons, an "or" divider, frosted inputs, and a
// lock-icon submit. Presentational only (wire to a real auth provider to go live).

type Mode = "login" | "signup";
const MODES: { key: Mode; label: string }[] = [
  { key: "login", label: "Log in" },
  { key: "signup", label: "Sign up" },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 84 84" className="authx__soc-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M82.8559 33.8402H79.4997V33.6673H41.9997V50.334H65.5476C62.1122 60.0361 52.8809 67.0006 41.9997 67.0006C28.1934 67.0006 16.9997 55.8069 16.9997 42.0006C16.9997 28.1944 28.1934 17.0007 41.9997 17.0007C48.3726 17.0007 54.1705 19.4048 58.5851 23.3319L70.3705 11.5465C62.9288 4.61107 52.9747 0.333984 41.9997 0.333984C18.9893 0.333984 0.333008 18.9902 0.333008 42.0006C0.333008 65.0111 18.9893 83.6673 41.9997 83.6673C65.0101 83.6673 83.6663 65.0111 83.6663 42.0006C83.6663 39.2069 83.3788 36.4798 82.8559 33.8402Z" fill="#FFC107" />
      <path d="M5.1377 22.6069L18.8273 32.6465C22.5314 23.4757 31.5023 17.0007 42.0002 17.0007C48.3731 17.0007 54.171 19.4048 58.5856 23.3319L70.371 11.5465C62.9294 4.61107 52.9752 0.333984 42.0002 0.333984C25.996 0.333984 12.1169 9.3694 5.1377 22.6069Z" fill="#FF3D00" />
      <path d="M42 83.6661C52.7625 83.6661 62.5417 79.5474 69.9354 72.8495L57.0396 61.937C52.8562 65.1057 47.6562 66.9995 42 66.9995C31.1625 66.9995 21.9604 60.0891 18.4937 50.4453L4.90625 60.9141C11.8021 74.4078 25.8063 83.6661 42 83.6661Z" fill="#4CAF50" />
      <path d="M82.8562 33.8389H79.5V33.666H42V50.3327H65.5479C63.8979 54.9931 60.9 59.0118 57.0333 61.9389L57.0396 61.9348L69.9354 72.8473C69.0229 73.6764 83.6667 62.8327 83.6667 41.9993C83.6667 39.2056 83.3792 36.4785 82.8562 33.8389Z" fill="#1976D2" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 123 143" className="authx__soc-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M83.4565 22.829C88.6693 16.7873 92.1831 8.37251 91.2215 0C83.7095 0.286 74.6213 4.7987 69.2349 10.8332C64.398 16.1885 60.1757 24.7454 61.3108 32.9535C69.6904 33.5755 78.2436 28.8778 83.4565 22.829ZM102.247 75.9687C102.457 97.6115 122.058 104.811 122.275 104.904C122.116 105.412 119.144 115.162 111.95 125.244C105.725 133.952 99.2686 142.626 89.0959 142.811C79.1039 142.99 75.8866 137.135 64.4559 137.135C53.0324 137.135 49.4607 142.625 40.0038 142.99C30.1854 143.34 22.7023 133.568 16.4339 124.888C3.60774 107.134 -6.18897 74.7181 6.96972 52.8395C13.5057 41.9788 25.1822 35.0907 37.8637 34.9191C47.5014 34.7403 56.604 41.1334 62.4965 41.1334C68.389 41.1334 79.451 33.4473 91.0769 34.577C95.9428 34.77 109.608 36.4568 118.378 48.7617C117.669 49.1836 102.074 57.8795 102.247 75.9687Z"
        fill="#1a1233"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 80 80" className="authx__soc-svg" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path d="M40.0003 0.416016C29.5022 0.416016 19.434 4.58639 12.0107 12.0097C4.58737 19.433 0.416992 29.5012 0.416992 39.9993C0.416992 50.4975 4.58737 60.5657 12.0107 67.989C19.434 75.4123 29.5022 79.5827 40.0003 79.5827C50.4985 79.5827 60.5667 75.4123 67.99 67.989C75.4133 60.5657 79.5837 50.4975 79.5837 39.9993C79.5837 29.5012 75.4133 19.433 67.99 12.0097C60.5667 4.58639 50.4985 0.416016 40.0003 0.416016Z" fill="#039BE5" />
      <path d="M45.3581 50.4909H55.6018L57.2102 40.0846H45.356V34.3971C45.356 30.0742 46.7685 26.2409 50.8122 26.2409H57.3101V17.1596C56.1685 17.0055 53.7539 16.668 49.1914 16.668C39.6643 16.668 34.0789 21.6992 34.0789 33.1617V40.0846H24.2852V50.4909H34.0789V79.093C36.0185 79.3846 37.9831 79.5826 39.9997 79.5826C41.8227 79.5826 43.6018 79.4159 45.3581 79.1784V50.4909Z" fill="#fff" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10.5" width="16" height="10" rx="2.4" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AuthCard({ defaultMode = "login" }: { defaultMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const isSignup = mode === "signup";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    // Demo only, no real authentication. Wire to your provider here.
    window.setTimeout(() => setStatus("done"), 700);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setStatus("idle");
  }

  return (
    <div className="authx">
      <div className="authx__tabs" role="tablist" aria-label="Log in or sign up">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            className={`authx__tab${mode === m.key ? " is-active" : ""}`}
            onClick={() => switchMode(m.key)}
          >
            {mode === m.key && (
              <motion.span
                layoutId="authx-pill"
                className="authx__pill"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="authx__tab-label">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="authx__social">
        <button type="button" className="authx__soc" aria-label="Continue with Google">
          <GoogleIcon />
        </button>
        <button type="button" className="authx__soc" aria-label="Continue with Apple">
          <AppleIcon />
        </button>
        <button type="button" className="authx__soc" aria-label="Continue with Facebook">
          <FacebookIcon />
        </button>
      </div>

      <div className="authx__or">
        <span>or</span>
      </div>

      <form className="authx__form" onSubmit={onSubmit} aria-busy={status === "loading"}>
        <AnimatePresence initial={false}>
          {isSignup && (
            <motion.label
              className="authx__field"
              key="name"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: "1rem" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}
            >
              <span className="authx__label">Full name</span>
              <input type="text" autoComplete="name" placeholder="Alex Rivera" required />
            </motion.label>
          )}
        </AnimatePresence>

        <label className="authx__field">
          <span className="authx__label">Email</span>
          <input type="email" autoComplete="email" placeholder="you@school.org" required />
        </label>

        <label className="authx__field">
          <span className="authx__label">Password</span>
          <input
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </label>

        <div className="authx__submit">
          <ShimmerButton type="submit" variant="violet" size="lg">
            <span className="authx__submit-inner">
              {status === "loading" ? "One moment…" : isSignup ? "Create account" : "Log in"}
              <LockIcon />
            </span>
          </ShimmerButton>
        </div>

        <AnimatePresence>
          {status === "done" && (
            <motion.p
              className="authx__note"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
            >
              ✓ Demo only, connect your auth provider to go live.
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <p className="authx__alt">
        {isSignup ? (
          <>
            Already a member?{" "}
            <button type="button" onClick={() => switchMode("login")}>
              Log in
            </button>
          </>
        ) : (
          <>
            New here?{" "}
            <button type="button" onClick={() => switchMode("signup")}>
              Start free
            </button>
          </>
        )}
      </p>
    </div>
  );
}
