import { NextRequest, NextResponse } from "next/server";

// Live taxonomic identification agent. Instead of storing a giant reference, we
// search a sample of the uploaded reads against NCBI's real BLAST database on
// demand, so ANY organism can be named, not just the ones we bundle.
// POST { reads:[...], db? }  -> submits a BLAST job, returns { rid }
// GET  ?rid=...              -> polls; returns { status } or { status:"READY", results }

export const maxDuration = 60;

const BLAST = "https://blast.ncbi.nlm.nih.gov/Blast.cgi";

export async function POST(req: NextRequest) {
  try {
    const { reads, db } = await req.json();
    if (!Array.isArray(reads) || !reads.length) return NextResponse.json({ error: "no reads" }, { status: 400 });
    // up to 12 reads, capped at 1000 bp each, as one multi-FASTA job
    const fasta = reads.slice(0, 12).map((s: string, i: number) => `>q${i}\n${String(s).replace(/[^ACGTNacgtn]/g, "").slice(0, 1000)}`).join("\n");
    const body = new URLSearchParams({ CMD: "Put", PROGRAM: "blastn", MEGABLAST: "on", DATABASE: db || "core_nt", QUERY: fasta, HITLIST_SIZE: "1" });
    const txt = await fetch(BLAST, { method: "POST", body }).then((r) => r.text());
    const rid = (txt.match(/RID = (\S+)/) || [])[1];
    const rtoe = (txt.match(/RTOE = (\d+)/) || [])[1];
    if (!rid) return NextResponse.json({ error: "blast submit failed" }, { status: 502 });
    return NextResponse.json({ rid, rtoe: rtoe ? Number(rtoe) : null });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const rid = req.nextUrl.searchParams.get("rid");
  if (!rid) return NextResponse.json({ error: "no rid" }, { status: 400 });
  try {
    const st = await fetch(`${BLAST}?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=${encodeURIComponent(rid)}`).then((r) => r.text());
    const status = (st.match(/Status=(\w+)/) || [])[1] || "WAITING";
    if (status === "WAITING") return NextResponse.json({ status: "WAITING" });
    if (status !== "READY") return NextResponse.json({ status: "FAILED" });

    const js = await fetch(`${BLAST}?CMD=Get&FORMAT_TYPE=JSON2_S&RID=${encodeURIComponent(rid)}`).then((r) => r.json());
    const reports = Array.isArray(js?.BlastOutput2) ? js.BlastOutput2 : js?.BlastOutput2 ? [js.BlastOutput2] : [];
    const results = reports.map((b: any) => {
      const search = b?.report?.results?.search;
      const q = search?.query_title || search?.query_id || "read";
      const hit = (search?.hits || [])[0];
      if (!hit) return { query: q, organism: null };
      const d = (hit.description || [])[0] || {};
      const hsp = (hit.hsps || [])[0] || {};
      const pctId = hsp.align_len ? +((100 * hsp.identity) / hsp.align_len).toFixed(1) : null;
      return { query: q, organism: d.sciname || d.title || null, pctId, accession: d.accession || null, len: hsp.align_len || null };
    });
    return NextResponse.json({ status: "READY", results });
  } catch (e: any) {
    return NextResponse.json({ status: "ERROR", error: String(e?.message || e) }, { status: 500 });
  }
}
