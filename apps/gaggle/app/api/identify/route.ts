import { NextRequest, NextResponse } from "next/server";
import {
  BlastGuardError,
  FixedWindowRateLimiter,
  blastClientKey,
  readBlastSubmission,
} from "@/lib/ggg/blast-guard";

// Live taxonomic identification agent. Instead of storing a giant reference, we
// search a sample of the uploaded reads against NCBI's real BLAST database on
// demand, so ANY organism can be named, not just the ones we bundle.
// POST { reads:[...], db? }  -> submits a BLAST job, returns { rid }
// GET  ?rid=...              -> polls; returns { status } or { status:"READY", results }

export const maxDuration = 60;

const BLAST = "https://blast.ncbi.nlm.nih.gov/Blast.cgi";
const submitByClient = new FixedWindowRateLimiter(3, 10 * 60_000);
const submitGlobally = new FixedWindowRateLimiter(30, 10 * 60_000, 1);
const pollByClient = new FixedWindowRateLimiter(60, 5 * 60_000);
let activeSubmissions = 0;

function limited(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "rate limit exceeded" },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export async function POST(req: NextRequest) {
  try {
    const { reads, db } = await readBlastSubmission(req);
    const clientKey = blastClientKey(req);
    const clientQuota = submitByClient.consume(clientKey);
    if (!clientQuota.allowed) return limited(clientQuota.retryAfterSeconds);
    const globalQuota = submitGlobally.consume("global");
    if (!globalQuota.allowed) return limited(globalQuota.retryAfterSeconds);
    if (activeSubmissions >= 2) return limited(30);

    const fasta = reads.map((sequence, index) => `>q${index}\n${sequence}`).join("\n");
    const body = new URLSearchParams({
      CMD: "Put",
      PROGRAM: "blastn",
      MEGABLAST: "on",
      DATABASE: db,
      QUERY: fasta,
      HITLIST_SIZE: "1",
    });

    activeSubmissions += 1;
    try {
      const upstream = await fetch(BLAST, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(30_000),
      });
      if (!upstream.ok) return NextResponse.json({ error: "blast service unavailable" }, { status: 502 });
      const txt = await upstream.text();
      const rid = (txt.match(/RID = (\S+)/) || [])[1];
      const rtoe = (txt.match(/RTOE = (\d+)/) || [])[1];
      if (!rid) return NextResponse.json({ error: "blast submit failed" }, { status: 502 });
      return NextResponse.json({ rid, rtoe: rtoe ? Number(rtoe) : null });
    } finally {
      activeSubmissions -= 1;
    }
  } catch (error) {
    if (error instanceof BlastGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "blast request failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const rid = req.nextUrl.searchParams.get("rid");
  if (!rid || !/^[A-Z0-9-]{6,64}$/i.test(rid)) return NextResponse.json({ error: "invalid rid" }, { status: 400 });
  const pollQuota = pollByClient.consume(blastClientKey(req));
  if (!pollQuota.allowed) return limited(pollQuota.retryAfterSeconds);
  try {
    const statusResponse = await fetch(`${BLAST}?CMD=Get&FORMAT_OBJECT=SearchInfo&RID=${encodeURIComponent(rid)}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!statusResponse.ok) return NextResponse.json({ status: "ERROR" }, { status: 502 });
    const st = await statusResponse.text();
    const status = (st.match(/Status=(\w+)/) || [])[1] || "WAITING";
    if (status === "WAITING") return NextResponse.json({ status: "WAITING" });
    if (status !== "READY") return NextResponse.json({ status: "FAILED" });

    const resultsResponse = await fetch(`${BLAST}?CMD=Get&FORMAT_TYPE=JSON2_S&RID=${encodeURIComponent(rid)}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!resultsResponse.ok) return NextResponse.json({ status: "ERROR" }, { status: 502 });
    const js = await resultsResponse.json();
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
  } catch {
    return NextResponse.json({ status: "ERROR" }, { status: 500 });
  }
}
