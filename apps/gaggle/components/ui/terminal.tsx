"use client";

import { useEffect, useRef, useState } from "react";

export interface TerminalProps {
  commands: string[];
  outputs?: Record<number, string[]>;
  typingSpeed?: number;
  delayBetweenCommands?: number;
  prompt?: string;
  title?: string;
  className?: string;
  onComplete?: () => void;
}

type Line = { kind: "cmd" | "out"; text: string };

/**
 * A typed terminal, the same console UI we use in the Lexie Console. Types each
 * command character by character, prints its outputs, then moves to the next.
 * Lines beginning with a check become green. Fires onComplete when the last
 * command has printed.
 */
export function Terminal({
  commands,
  outputs = {},
  typingSpeed = 45,
  delayBetweenCommands = 900,
  prompt = "$",
  title = "metascope",
  className = "",
  onComplete,
}: TerminalProps) {
  const [committed, setCommitted] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const [idx, setIdx] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  // restart whenever the command set changes identity
  useEffect(() => {
    setCommitted([]);
    setTyping("");
    setIdx(0);
    doneRef.current = false;
  }, [commands]);

  useEffect(() => {
    if (idx >= commands.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete?.();
      }
      return;
    }
    const cmd = commands[idx] ?? "";
    let ch = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      ch++;
      setTyping(cmd.slice(0, ch));
      if (ch < cmd.length) {
        t = setTimeout(step, typingSpeed);
      } else {
        t = setTimeout(() => {
          setCommitted((prev) => [
            ...prev,
            { kind: "cmd", text: cmd },
            ...(outputs[idx] || []).map((o) => ({ kind: "out" as const, text: o })),
          ]);
          setTyping("");
          setIdx((i) => i + 1);
        }, delayBetweenCommands);
      }
    };
    t = setTimeout(step, typingSpeed);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, commands]);

  useEffect(() => {
    const b = bodyRef.current;
    if (b) b.scrollTop = b.scrollHeight;
  }, [committed, typing]);

  const out = (text: string) => {
    const ok = text.trimStart().startsWith("✔");
    return <span className={ok ? "term__ok" : undefined}>{text}</span>;
  };

  return (
    <div className={`term ${className}`}>
      <div className="term__bar">
        <span className="term__dot term__dot--r" aria-hidden />
        <span className="term__dot term__dot--y" aria-hidden />
        <span className="term__dot term__dot--g" aria-hidden />
        <span className="term__title">{title}</span>
      </div>
      <div className="term__body" ref={bodyRef}>
        {committed.map((ln, i) =>
          ln.kind === "cmd" ? (
            <div className="term__line" key={i}>
              <span className="term__prompt">{prompt}</span>
              <span className="term__cmd">{ln.text}</span>
            </div>
          ) : (
            <div className="term__line term__outline" key={i}>
              {out(ln.text)}
            </div>
          )
        )}
        {idx < commands.length && (
          <div className="term__line">
            <span className="term__prompt">{prompt}</span>
            <span className="term__cmd">{typing}</span>
            <span className="term__caret" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}

export default Terminal;
