import { NextRequest, NextResponse } from "next/server";

// Live medical-platform lookup for the report: real PubMed papers + real
// ClinicalTrials.gov studies for a microbe/topic. No key needed; server-side so
// there are no CORS issues. Same sources the MCP server exposes to agents.

async function pubmed(q: string, n: number) {
  const es = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=${n}&retmode=json&sort=relevance`,
    { next: { revalidate: 3600 } }
  ).then((r) => r.json());
  const ids: string[] = es.esearchresult?.idlist || [];
  if (!ids.length) return [];
  const sum = await fetch(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`,
    { next: { revalidate: 3600 } }
  ).then((r) => r.json());
  const res = sum.result || {};
  return (res.uids || []).map((u: string) => ({
    pmid: u, title: res[u]?.title, year: (res[u]?.pubdate || "").slice(0, 4),
    journal: res[u]?.source, url: `https://pubmed.ncbi.nlm.nih.gov/${u}/`,
  }));
}

async function trials(q: string, n: number) {
  const j = await fetch(
    `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(q)}&pageSize=${n}&format=json`,
    { next: { revalidate: 3600 } }
  ).then((r) => r.json());
  return (j.studies || []).map((st: any) => {
    const id = st.protocolSection?.identificationModule || {};
    const stat = st.protocolSection?.statusModule || {};
    return { nct: id.nctId, title: id.briefTitle, status: stat.overallStatus, url: `https://clinicaltrials.gov/study/${id.nctId}` };
  });
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q) return NextResponse.json({ papers: [], trials: [] });
  try {
    const [papers, studies] = await Promise.all([pubmed(q, 3), trials(q, 3)]);
    return NextResponse.json({ papers, trials: studies });
  } catch {
    return NextResponse.json({ papers: [], trials: [], error: "lookup failed" });
  }
}
