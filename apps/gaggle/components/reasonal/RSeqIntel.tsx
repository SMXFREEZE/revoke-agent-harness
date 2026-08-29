"use client";

import { RLiveId } from "./RLiveId";

// Shown when an uploaded FASTQ does not map to our gut-species reference (a 16S/18S
// amplicon, or a non-gut sample). No fabricated profile: every value here is measured
// directly from the uploaded reads by the engine's QC pass.

export function RSeqIntel({ profile, label }: { profile: any; label?: string }) {
  const q = profile.quality || {};
  const reads = q.reads || 0;
  const mbp = (q.totalBases || 0) / 1e6;
  const hist: number[] = q.qHist || [];
  const maxBin = Math.max(1, ...hist);

  const tiles = [
    { v: reads.toLocaleString(), k: "Reads", s: "sequences in the file" },
    { v: `${mbp.toFixed(1)} Mbp`, k: "Total bases", s: "base pairs sequenced" },
    { v: `${Math.round(q.meanLen || 0)} bp`, k: "Mean read length", s: `${q.minLen || 0} to ${(q.maxLen || 0).toLocaleString()} bp` },
    { v: `${(q.gcPct || 0).toFixed(1)}%`, k: "GC content", s: "guanine + cytosine" },
    { v: `Q${(q.meanQ || 0).toFixed(1)}`, k: "Mean quality", s: "Phred base quality" },
    { v: `${Math.round(q.q30Pct || 0)}%`, k: "High quality", s: "bases at Q30 or better" },
    { v: (profile.uniqueKmers || 0).toLocaleString(), k: "Sequence complexity", s: "distinct 21-mers" },
    { v: (profile.mapped || 0).toLocaleString(), k: "Identified reads", s: "matched our reference panel" },
  ];
  const identified: any[] = profile.identified || [];

  return (
    <div className="rz-seq">
      <div className="rz-seq__head">
        <span className="kick">Sequence intelligence</span>
        <h3 className="rz-seq__title">We read every base of {label ? <code>{label}</code> : "your file"}.</h3>
        <p className="rz-seq__assay"><b>Detected:</b> {profile.assay}</p>
      </div>

      <div className="rz-seq__grid">
        {tiles.map((t) => (
          <div className="rz-seq__tile" key={t.k}>
            <b>{t.v}</b>
            <span>{t.k}</span>
            <i>{t.s}</i>
          </div>
        ))}
      </div>

      {hist.length > 0 && (
        <div className="rz-seq__qc">
          <span className="rz-seq__qclabel">Per-read quality distribution (Q{q.qLo} to Q{q.qHi})</span>
          <div className="rz-seq__spark" aria-hidden>
            {hist.map((c, i) => <span key={i} style={{ height: `${Math.max(4, (c / maxBin) * 100)}%` }} />)}
          </div>
        </div>
      )}

      {identified.length > 0 && (
        <div className="rz-seq__id">
          <span className="rz-seq__qclabel">Closest local matches in these reads (preliminary, confirmed live by BLAST below)</span>
          <div className="rz-seq__idrows">
            {identified.map((t) => (
              <div className="rz-seq__idrow" key={t.species}>
                <span><b>{t.species}</b></span>
                <span className="rz-seq__num2">{(t.reads || 0).toLocaleString()} reads</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <RLiveId reads={profile.sampleReads} />

      <p className="rz-seq__note">
        We routed your file through the real marker-gene reference (16S for bacteria, 18S for eukaryotes). Against a small demo reference the local matches above are only a first pass, so we do not turn them into a confident community profile or gut score; the live NCBI BLAST search is the authority.
        Everything here is measured straight from your reads, never guessed. For a full taxonomic report, run a sample our panel covers, like <b>Jordan&rsquo;s sample</b> above.
      </p>
    </div>
  );
}
