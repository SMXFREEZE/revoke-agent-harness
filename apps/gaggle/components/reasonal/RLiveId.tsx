"use client";

import { useState } from "react";
import { withBasePath } from "@/lib/utils/base-path";
import { RNetwork } from "./RNetwork";
import { RSunburst } from "./RSunburst";

// Live identification agent: sends a sample of the uploaded reads to NCBI BLAST
// (via /api/identify), names the real organisms against the whole database, and
// builds a real taxonomic diagram from what it finds. No giant database stored.

// rough kingdom from the organism name, just for colouring the diagram
function kingdomOf(s: string): string {
  const n = (s || "").toLowerCase();
  if (/amoeba|vermamoeba|paramecium|tetrahymena|blastocyst|giardia|entamoeba|dientamoeba|ciliate|protist|acanthamoeba|naegleria|cercozoa|cryptosporidium|plasmodium/.test(n)) return "Protozoa";
  if (/fungus|fungi|yeast|candida|saccharomyces|malassezia|aspergillus|penicillium|mould|mold|mucor|cladosporium|basidiomy|ascomy|cryptococc/.test(n)) return "Fungi";
  if (/alga|algae|chlorella|diatom|thalassiosira|bacillariophy|chlamydomonas|cyanobacter|phytoplankton/.test(n)) return "Algae";
  if (/homo sapiens|human/.test(n)) return "Host";
  if (/caenorhabditis|nematode|worm|drosophila|insect|fish|mammal|rotifer|arthropod|metazoa|daphnia/.test(n)) return "Metazoa";
  if (/escherichia|bacteroides|prevotella|firmicut|proteobacter|bacteri|coccus|bacillus|clostrid|pseudomonas|lactobacill/.test(n)) return "Bacteria";
  return "Other";
}

export function RLiveId({ reads }: { reads?: string[] }) {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [list, setList] = useState<any[]>([]);
  const [abundance, setAbundance] = useState<any[] | null>(null);
  const [msg, setMsg] = useState("");

  const run = async () => {
    if (!reads?.length) return;
    setState("running"); setList([]); setAbundance(null); setMsg("Submitting your reads to NCBI BLAST…");
    try {
      const boundedReads = reads
        .slice(0, 12)
        .map((read) => String(read).trim().toUpperCase().slice(0, 1_000))
        .filter((read) => read.length >= 20 && /^[ACGTRYSWKMBDHVN]+$/.test(read));
      if (!boundedReads.length) {
        setState("error"); setMsg("No valid DNA reads were available for the live search."); return;
      }
      const submitResponse = await fetch(withBasePath("/api/identify"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reads: boundedReads }),
      });
      if (!submitResponse.ok) throw new Error("BLAST submission rejected");
      const sub = await submitResponse.json();
      if (!sub.rid) { setState("error"); setMsg("Could not start the live search. Please try again."); return; }
      setMsg("Searching NCBI live against the whole database, this usually takes 30 to 90 seconds…");
      const start = Date.now();
      while (Date.now() - start < 180000) {
        await new Promise((r) => setTimeout(r, 5000));
        const st = await fetch(withBasePath(`/api/identify?rid=${encodeURIComponent(sub.rid)}`)).then((r) => r.json()).catch(() => ({ status: "WAITING" }));
        if (st.status === "READY") {
          const hits = (st.results || []).filter((x: any) => x.organism);
          // group reads by organism into a real abundance profile
          const by: Record<string, any> = {};
          hits.forEach((h: any) => {
            const k = h.organism;
            if (!by[k]) by[k] = { species: k, count: 0, pctId: h.pctId || 0, accession: h.accession };
            by[k].count++;
            if ((h.pctId || 0) > by[k].pctId) by[k].pctId = h.pctId;
          });
          const grouped = Object.values(by).sort((a: any, b: any) => b.count - a.count);
          const totalN = grouped.reduce((s: number, o: any) => s + o.count, 0) || 1;
          const ab = grouped.map((o: any, i: number) => ({ id: "blast" + i, species: o.species, full: o.species, phylum: kingdomOf(o.species), pct: (100 * o.count) / totalN, reads: o.count, status: "ok" }));
          setList(grouped); setAbundance(ab.length ? ab : null); setState("done");
          setMsg(grouped.length ? "" : "No confident match was found for this sample of reads.");
          return;
        }
        if (st.status === "FAILED" || st.status === "ERROR") { setState("error"); setMsg("The live search did not complete. Please try again."); return; }
      }
      setState("error"); setMsg("The live search timed out. Please try again.");
    } catch { setState("error"); setMsg("The live search failed. Please try again."); }
  };

  if (!reads?.length) return null;

  return (
    <div className="rz-live">
      <div className="rz-live__head">
        <div>
          <span className="rz-seq__qclabel">Identify these reads live</span>
          <p className="rz-live__sub">No giant database stored. We search a sample of your reads against NCBI&rsquo;s real database and build a diagram of whatever it finds.</p>
        </div>
        <button className="rz-live__btn" onClick={run} disabled={state === "running"}>
          {state === "running" ? <><span className="rz-rep__spin" aria-hidden /> Searching NCBI</> : "Search NCBI BLAST live"}
        </button>
      </div>
      {msg && <p className="rz-live__msg">{msg}</p>}

      {list.length > 0 && (
        <div className="rz-live__rows">
          {list.map((o, i) => (
            <a key={i} className="rz-live__row" href={o.accession ? `https://www.ncbi.nlm.nih.gov/nuccore/${o.accession}` : undefined} target="_blank" rel="noreferrer">
              <span><b>{o.species}</b></span>
              <span className="rz-seq__num2">{o.count} read{o.count === 1 ? "" : "s"}{o.pctId ? ` · ${o.pctId}% id` : ""}{o.accession ? ` · ${o.accession}` : ""}</span>
            </a>
          ))}
        </div>
      )}

      {abundance && abundance.length > 0 && (
        <div className="rz-live__viz">
          <span className="rz-seq__qclabel">Live taxonomic profile, built from this NCBI search</span>
          <div className="rz-live__stage"><RNetwork abundance={abundance} /></div>
          <RSunburst abundance={abundance} />
        </div>
      )}
    </div>
  );
}
