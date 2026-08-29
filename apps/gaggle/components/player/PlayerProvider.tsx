"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Program } from "@/lib/data/catalog";
import { getCategory } from "@/lib/data/catalog";

type Open = (program: Program) => void;
const PlayerContext = createContext<Open>(() => {});
export const usePlayer = () => useContext(PlayerContext);

const EASE = [0.16, 1, 0.3, 1] as const;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Program | null>(null);
  const open = useCallback<Open>((p) => setActive(p), []);
  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close]);

  return (
    <PlayerContext.Provider value={open}>
      {children}
      <AnimatePresence>
        {active && (
          <motion.div
            className="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          >
            <motion.div
              className="player__dialog"
              role="dialog"
              aria-modal="true"
              aria-label={active.title}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.4, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="player__close" onClick={close} aria-label="Close player">
                ✕
              </button>
              <video
                className="player__video"
                src={active.video}
                poster={active.poster}
                controls
                autoPlay
                playsInline
              />
              <div className="player__meta">
                <div>
                  <span className="player__cat" style={{ color: getCategory(active.category)?.accent }}>
                    {getCategory(active.category)?.name}
                  </span>
                  <h3 className="player__title display">{active.title}</h3>
                  <p className="player__desc">{active.description}</p>
                </div>
                <div className="player__tags">
                  <span className="pill">{active.duration}</span>
                  <span className="pill">{active.level}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PlayerContext.Provider>
  );
}
