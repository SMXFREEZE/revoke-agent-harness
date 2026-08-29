"use client";

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/utils/base-path";

// Pulls REAL research into the report: for each flagged microbe, fetches live
// PubMed papers and ClinicalTrials.gov studies (via /api/evidence) and shows
// them with working links. The result on screen is backed by actual literature.

type Ev = { papers?: any[]; trials?: any[] };

export function RGutEvidence({ profile }: { profile: any }) {
  const flags: string[] = (profile?.abundance || []).filter((a: any) => a.status !== "ok").map((a: any) => a.species);
  const [active, setActive] = useState(flags[0] || "");
  const [data, setData] = useState<Ev | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active) return;
    let live = true;
    setLoading(true); setData(null);
    fetch(withBasePath(`/api/evidence?q=${encodeURIComponent(active + " gut microbiome")}`))
      .then((r) => r.json())
      .then((d) => { if (live) { setData(d); setLoading(false); } })
      .catch(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [active]);

  if (!flags.length) return null;

  return (
    <div className="rz-ev">
      <div className="rz-ev__head">
        <span className="kick">The research behind your flags</span>
        <span className="rz-ev__src">live &middot; PubMed + ClinicalTrials.gov</span>
      </div>
      <p className="rz-ev__intro">Real published studies on the microbes we flagged, pulled from PubMed and ClinicalTrials.gov, so you can read the science yourself.</p>
      <div className="rz-ev__chips">
        {flags.map((f) => (
          <button key={f} className={`rz-ev__chip${active === f ? " on" : ""}`} onClick={() => setActive(f)}>{f}</button>
        ))}
      </div>
      {loading && <p className="rz-ev__loading">Pulling the latest research on {active.split(" ")[0]}&hellip;</p>}
      {data && (
        <div className="rz-ev__grid">
          <div className="rz-ev__col">
            <h5>Recent papers</h5>
            {(data.papers || []).length ? (data.papers as any[]).map((p) => (
              <a key={p.pmid} href={p.url} target="_blank" rel="noreferrer" className="rz-ev__item">
                <b>{p.title}</b><span>{p.journal} &middot; {p.year} &middot; PMID {p.pmid}</span>
              </a>
            )) : <p className="rz-ev__none">No papers found.</p>}
          </div>
          <div className="rz-ev__col">
            <h5>Clinical trials</h5>
            {(data.trials || []).length ? (data.trials as any[]).map((t) => (
              <a key={t.nct} href={t.url} target="_blank" rel="noreferrer" className="rz-ev__item">
                <b>{t.title}</b><span>{t.nct} &middot; {(t.status || "").replace(/_/g, " ").toLowerCase()}</span>
              </a>
            )) : <p className="rz-ev__none">No trials found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
