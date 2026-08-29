"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * A front-door that plays once per session, then irises away (sun-rising wipe)
 * to reveal the home. Bright and on-brand, leading with the real logo.
 */
export function IntroCurtain() {
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem("xm-intro");
    } catch {
      /* private mode */
    }
    if (seen) return;
    setShow(true);
    document.documentElement.style.overflow = "hidden";
    // let the controls appear, then auto-enter as a safety net
    timers.current.push(window.setTimeout(() => setReady(true), 1900));
    timers.current.push(window.setTimeout(() => enter(), 6500));
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enter = () => {
    try {
      sessionStorage.setItem("xm-intro", "1");
    } catch {
      /* ignore */
    }
    timers.current.forEach(clearTimeout);
    document.documentElement.style.overflow = "";
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="intro"
          initial={{ clipPath: "circle(150% at 50% 58%)" }}
          exit={{ clipPath: "circle(0% at 50% 58%)" }}
          transition={{ duration: 0.95, ease: EASE }}
          aria-label="Welcome to X Movement"
        >
          <span className="pg-blob" style={{ background: "var(--sun)", width: 120, height: 120, top: "16%", left: "12%", opacity: 0.5 }} aria-hidden />
          <span className="pg-blob" style={{ background: "var(--pink)", width: 70, height: 70, bottom: "20%", right: "16%", opacity: 0.45, animationDelay: "1.4s" }} aria-hidden />
          <span className="pg-blob" style={{ background: "var(--teal)", width: 90, height: 90, bottom: "14%", left: "20%", opacity: 0.3, animationDelay: "2.6s" }} aria-hidden />

          <button className="intro__skip" onClick={enter}>
            Skip intro
          </button>

          <div className="intro__stage">
            {/* crisp vector mark + live wordmark (was a blurry png) */}
            <motion.span
              className="intro__logo"
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 14, delay: 0.15 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/brand/x-mark.svg" alt="" aria-hidden />
              <span className="logo__word">X Movement Classroom</span>
            </motion.span>
            <motion.p
              className="intro__tag"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.7, ease: EASE }}
            >
              Where every classroom comes alive.
            </motion.p>

            <AnimatePresence>
              {ready && (
                <motion.button
                  className="intro__go"
                  onClick={enter}
                  initial={{ opacity: 0, y: 16, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                >
                  Let&rsquo;s go ▶
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
