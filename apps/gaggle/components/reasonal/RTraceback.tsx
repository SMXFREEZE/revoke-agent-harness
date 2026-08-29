"use client";

import { useState } from "react";
import { phylumShares, dominantPhylum } from "@/lib/ggg/phylum";

// AI "Read-to-Report Traceback": click a patient-facing claim and see exactly how
// the app got there from the FASTQ data. Every number below is read from the same
// engine output that drives the rest of the report, so the trace is the truth.

const BUTYRATE = /Faecalibacterium|Roseburia|Eubacterium/;

export function RTraceback({ profile, patient, isUpload }: { profile: any; patient: any; isUpload: boolean }) {
  const [open, setOpen] = useState(false);

  const ab: any[] = profile.abundance || [];
  const classified: number = profile.classified || 0;
  // phylum shares come from the SAME helper as the sunburst legend (normalised
  // over displayed named taxa), so the two views always show the same numbers.
  const shares = phylumShares(ab);
  const domPhylum = dominantPhylum(ab, "Bacteroidetes");
  const shannon = Number(profile.diversity?.shannon ?? 0);
  const lead = (profile.enterotype || "").split(/[\s(-]/)[0] || domPhylum;
  const leadPct = ab.filter((a) => (a.species || "").split(" ")[0] === lead).reduce((s, a) => s + a.pct, 0);
  const bPct = Math.round(shares.Bacteroidetes || 0);
  const fPct = Math.round(shares.Firmicutes || 0);
  const flags = ab.filter((a) => a.status !== "ok");
  const butyrate = ab.filter((a) => BUTYRATE.test(a.species));
  const butyrateLow = butyrate.filter((a) => a.status === "low");
  const reduced = butyrateLow.length > 0;

  const claim = `Your sample shows a ${lead}-led gut profile${reduced ? ", with mildly reduced butyrate-supporting bacteria" : ", with butyrate-supporting bacteria in a healthy range"}.`;

  const top = [...ab]
    .map((a) => ({ ...a, reads: a.reads ?? Math.round((a.pct / 100) * classified) }))
    .filter((a) => a.reads > 0)
    .sort((a, b) => b.reads - a.reads)
    .slice(0, 5);

  // confidence: read depth + abundance strength + how established the finding is
  const depth = classified >= 4000 ? 2 : classified >= 1000 ? 1 : 0;
  const strength = leadPct >= 30 ? 2 : leadPct >= 15 ? 1 : 0;
  const established = 2; // enterotype is a well-established descriptor
  const sum = depth + strength + established;
  const level = profile.representative ? "Illustrative" : sum >= 5 ? "High" : sum >= 3 ? "Moderate" : "Low";
  const levelClass = level === "High" ? "hi" : level === "Moderate" ? "mod" : level === "Low" ? "lo" : "ill";
  const rate = (s: number) => (s >= 2 ? "strong" : s >= 1 ? "moderate" : "limited");

  const context = isUpload
    ? ["No lifestyle questionnaire was provided with this upload, so context was not factored in. The profile is computed from the reads alone."]
    : [
        patient?.diet ? `Diet: ${patient.diet}.` : null,
        patient?.notes ? `History: ${patient.notes}` : null,
        patient?.goals?.length ? `Reported: ${patient.goals.join(", ").toLowerCase()}.` : null,
      ].filter(Boolean) as string[];

  const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <li className="rz-trace__step">
      <span className="rz-trace__num">{n}</span>
      <div className="rz-trace__body">
        <h5>{title}</h5>
        {children}
      </div>
    </li>
  );

  return (
    <div className="rz-trace">
      <div className="rz-trace__head">
        <span className="kick">Read-to-report traceback</span>
        <p className="rz-trace__quote">&ldquo;{claim}&rdquo;</p>
        <button className="rz-trace__why" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5" /><line x1="12" y1="17" x2="12" y2="17" />
          </svg>
          Why does the report say this?
          <span className={`rz-trace__chev${open ? " open" : ""}`} aria-hidden>&rsaquo;</span>
        </button>
      </div>

      {open && (
        <ol className="rz-trace__steps">
          <Step n={1} title="FASTQ evidence">
            <p>Reads from your file were k-mer matched to reference species. The largest assignments:</p>
            <div className="rz-trace__rows">
              {top.map((a) => (
                <div className="rz-trace__row" key={a.id}>
                  <span><b>{a.species}</b></span>
                  <span className="rz-trace__num2">{a.reads.toLocaleString()} reads &middot; {a.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <p className="rz-trace__fine">{classified.toLocaleString()} reads classified{profile.representative ? " (representative profile seeded from your file)" : ""}.</p>
          </Step>

          <Step n={2} title="Computed metrics">
            <div className="rz-trace__chips">
              <span><b>Shannon diversity</b> {shannon.toFixed(2)} {shannon >= 3 ? "(diverse)" : "(lower)"}</span>
              <span><b>{lead}</b> {Math.round(leadPct)}% of reads (largest genus)</span>
              <span><b>Phyla</b> Bacteroidetes {bPct}% / Firmicutes {fPct}%</span>
              <span><b>Enterotype</b> {profile.enterotype}</span>
              <span><b>Dysbiosis flags</b> {flags.length} species out of range</span>
            </div>
          </Step>

          <Step n={3} title="Synthetic patient context">
            <ul className="rz-trace__ctx">
              {context.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </Step>

          <Step n={4} title="Plain-English conclusion">
            <p>
              A {lead}-led profile is common and not a problem on its own.{" "}
              {reduced
                ? `Your main butyrate makers (${butyrateLow.map((a) => a.species.split(" ")[0]).join(" and ")}, which feed the gut lining and calm inflammation) came back a little low${isUpload ? "" : ", a pattern that often tracks with the bloating and irregularity you reported"}.`
                : "Your main butyrate makers came back in range, a good sign for the gut lining."}{" "}
              The plan below is built to act on exactly this.
            </p>
          </Step>

          <Step n={5} title="Confidence score">
            <div className="rz-trace__conf">
              <span className={`rz-trace__pill rz-trace__pill--${levelClass}`}>{level}</span>
              <ul className="rz-trace__factors">
                <li><b>Read depth</b><span>{classified.toLocaleString()} reads</span><em>{rate(depth)}</em></li>
                <li><b>Abundance strength</b><span>{lead} at {Math.round(leadPct)}%</span><em>{rate(strength)}</em></li>
                <li><b>Evidence base</b><span>enterotype is clinically established</span><em>established</em></li>
              </ul>
              {profile.representative && <p className="rz-trace__fine">Marked illustrative because your reads did not map to the demo reference, so this profile was seeded from your file.</p>}
            </div>
          </Step>
        </ol>
      )}
    </div>
  );
}
