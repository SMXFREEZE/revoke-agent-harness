"use client";

import { useEffect, useRef, useState } from "react";

// "Ask your gut" — a conversational coach grounded in the real report. Answers
// are generated from the engine output (abundance, flags, diversity, plan), so
// every reply cites the patient's own numbers. Reads like an AI assistant
// (suggested prompts + streamed typing); designed to drop straight onto an LLM
// for production, but fully self-contained for the demo so it always works.

type Msg = { who: "you" | "coach"; text: string };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (n: number) => `${(n ?? 0).toFixed(1)}%`;

function findTaxon(q: string, abundance: any[]) {
  const ql = " " + q.toLowerCase().replace(/\./g, ". ").replace(/\s+/g, " ") + " ";
  let best: any = null;
  for (const a of abundance) {
    const sp = (a.species || "").toLowerCase();
    const [genus, epithet = ""] = sp.split(" ");
    const abbr = genus.charAt(0) + ". " + epithet; // "e. coli", "f. prausnitzii"
    const hit =
      ql.includes(sp) ||
      (genus.length > 3 && ql.includes(genus)) ||
      (epithet.length > 3 && ql.includes(epithet)) ||
      (epithet && ql.includes(abbr));
    if (hit && (!best || a.pct > best.pct)) best = a;
  }
  return best;
}

function answer(q: string, p: any): string {
  const ql = q.toLowerCase();
  const ab = p.abundance || [];
  const flags = ab.filter((a: any) => a.status !== "ok");
  const lows = flags.filter((a: any) => a.status === "low");
  const highs = flags.filter((a: any) => a.status === "high");
  const recs = (p.recommendations || []).slice(0, 4);
  const div = p.diversity || {};
  const sc = p.scores || {};
  const gutScore = Math.round((sc.scfa + sc.resilience + (100 - sc.dysbiosis)) / 3);
  const ent = (p.enterotype || "").split(/[\s-]/)[0];

  // 1) a specific microbe
  const tx = findTaxon(q, ab);
  if (tx && /(why|what|is|about|level|high|low|tell|mean|\?)/.test(ql)) {
    const verdict = tx.status === "high" ? `Yours is raised at ${pct(tx.pct)}, above the ${pct(tx.healthyHi)} top of the healthy range.`
      : tx.status === "low" ? `Yours is low at ${pct(tx.pct)}, under the ${pct(tx.healthyLo)} you would expect.`
      : `Yours sits at ${pct(tx.pct)}, comfortably inside the healthy range.`;
    const fix = tx.status === "low" ? " Feeding it (more plant fibre, fewer ultra-processed foods) and the matched strains in your plan should help it recover."
      : tx.status === "high" ? " It is usually a sign of mild imbalance rather than infection; rebuilding the species that keep it in check is the lever, and that is what your plan targets."
      : " No action needed here.";
    const fn = cap((tx.function || "").replace(/\s*[—–]\s*/g, ", ").replace(/[.\s]+$/, ""));
    return `${tx.species} is one of your ${tx.phylum} microbes. ${fn}. ${verdict}${fix}`;
  }

  // 2) diet / food
  if (/(eat|food|diet|fibre|fiber|meal|nutrition|prebiotic)/.test(ql)) {
    const lowNames = lows.slice(0, 2).map((a: any) => a.species.split(" ")[0]).join(" and ");
    return `Feed the microbes you are short on. Your fibre fermenters${lowNames ? ` (notably ${lowNames})` : ""} thrive on plant diversity, so aim for 30+ different plants a week: legumes, oats, onions, garlic, leeks, slightly-green bananas and cooked-then-cooled potato or rice (resistant starch). Fermented foods like kefir and sauerkraut add Lactobacillus. Easing back on ultra-processed food and alcohol takes pressure off the species you have flagged.`;
  }

  // 3) diversity
  if (/(diversity|variety|varied|rich|shannon|how many)/.test(ql)) {
    const note = div.shannon >= 3 ? "That is a healthy, resilient spread" : "That is on the lower side, worth nudging up";
    return `Your Shannon diversity is ${Number(div.shannon).toFixed(2)} across ${div.richness} species. ${note}, because a varied community recovers from upsets (a course of antibiotics, travel, a bad week of eating) far better than a narrow one. More plant variety on the plate is the most direct way to raise it.`;
  }

  // 4) balance / enterotype
  if (/(balance|firmicutes|bacteroidetes|f\/b|fb ratio|enterotype|type)/.test(ql)) {
    return `Your Firmicutes-to-Bacteroidetes ratio is ${Number(p.fbRatio).toFixed(2)}, and you read as a ${ent} enterotype, the pattern of a fibre-fed, plant-leaning gut. There is no single "perfect" ratio, but big swings track with diet, so it is a useful dial to watch over time rather than a pass or fail.`;
  }

  // 5) plan / what to do / supplements
  if (/(plan|do|fix|improve|recommend|supplement|probiotic|take|next|action|strain)/.test(ql)) {
    const list = recs.map((r: any, i: number) => `${i + 1}. ${r.strain}, ${(r.why || "").replace(/\s*[—–]\s*/g, ", ")}`).join("  ");
    return `Your matched plan, in order of impact:  ${list}  These are the strains most likely to colonise your gut given who is already there. Re-sample later to see how your community is tracking.`;
  }

  // 6) what is wrong / flags
  if (/(wrong|problem|worst|bad|flag|work on|concern|issue|risk)/.test(ql)) {
    if (!flags.length) return "Nothing is flagged, your community looks balanced. The plan is about reinforcing what is already working.";
    const hi = highs.map((a: any) => a.species.split(" ")[0]).join(", ");
    const lo = lows.map((a: any) => a.species.split(" ")[0]).join(", ");
    return `${flags.length} things to work on. ${lo ? `Running low: ${lo} (the species that calm inflammation and make butyrate). ` : ""}${hi ? `Raised: ${hi} (opportunists that creep up when the helpful microbes thin out). ` : ""}None of this is alarming on a single sample; it is exactly what the plan is built to rebalance.`;
  }

  // 7) what is good / strengths
  if (/(good|going well|strong|best|healthy strength|positive)/.test(ql)) {
    const ok = ab.filter((a: any) => a.status === "ok").slice(0, 3).map((a: any) => a.species.split(" ")[0]).join(", ");
    return `Plenty is going well. ${ok} are all in healthy range, your diversity is solid at ${Number(div.shannon).toFixed(2)}, and you are a fibre-fed ${ent} type. That stable base is why your overall score lands at ${gutScore}/100.`;
  }

  // 8) overall / score / am I healthy
  if (/(score|overall|how am i|healthy|summary|good|result|verdict)/.test(ql)) {
    return `Overall you are at ${gutScore}/100, which reads as mostly healthy with a few things to tune. Your diversity (${Number(div.shannon).toFixed(2)}) and fibre fermenters are a strong base; the ${flags.length} flagged species are the gap, and your plan targets each one. Work through it and re-sample later to see how your gut is tracking.`;
  }

  // fallback
  return `Good question. Here is the short version: you are at ${gutScore}/100 with ${flags.length} things flagged and a ${ent} enterotype. Ask me about a specific microbe (try "why is my E. coli high"), what to eat, your diversity, or your plan, and I will pull the exact numbers from your report.`;
}

const SUGGESTIONS = [
  "Am I healthy overall?",
  "Why is my E. coli high?",
  "What should I eat more of?",
  "Is my diversity good?",
  "What is my plan?",
];

export function RGutCoach({ profile }: { profile: any }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ who: "coach", text: "Hi, I am your gut coach. Ask me anything about your report and I will answer from your own numbers. Try one of the prompts below." }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  useEffect(() => { const b = bodyRef.current; if (b) b.scrollTop = b.scrollHeight; }, [msgs, typing]);

  const ask = (q: string) => {
    if (busy.current || !q.trim()) return;
    busy.current = true;
    setInput("");
    setMsgs((m) => [...m, { who: "you", text: q }]);
    const full = answer(q, profile);
    let i = 0;
    setTyping("");
    const step = () => {
      i += Math.max(2, Math.round(full.length / 90)); // ~90 frames regardless of length
      setTyping(full.slice(0, i));
      if (i < full.length) { setTimeout(step, 18); }
      else { setTyping(null); setMsgs((m) => [...m, { who: "coach", text: full }]); busy.current = false; }
    };
    setTimeout(step, 260);
  };

  return (
    <div className="rz-coach">
      <div className="rz-coach__head">
        <span className="kick">Ask your gut</span>
        <span className="rz-coach__badge">AI coach</span>
      </div>
      <div className="rz-coach__body" ref={bodyRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`rz-coach__msg rz-coach__msg--${m.who}`}>{m.text}</div>
        ))}
        {typing !== null && <div className="rz-coach__msg rz-coach__msg--coach rz-coach__msg--typing">{typing}<i /></div>}
      </div>
      <div className="rz-coach__chips">
        {SUGGESTIONS.map((s) => <button key={s} className="rz-coach__chip" onClick={() => ask(s)} disabled={typing !== null}>{s}</button>)}
      </div>
      <form className="rz-coach__form" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
        <input className="rz-coach__input" placeholder="Ask about a microbe, your diet, diversity, your plan…" value={input} onChange={(e) => setInput(e.target.value)} disabled={typing !== null} />
        <button className="gbtn primary rz-coach__send" type="submit" disabled={typing !== null || !input.trim()}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </form>
      <p className="rz-coach__disc">Answers are generated from your report data for demonstration, and are not medical advice.</p>
    </div>
  );
}
