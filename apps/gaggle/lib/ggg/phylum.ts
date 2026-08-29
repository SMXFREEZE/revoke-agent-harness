// Shared phylum-percentage math. Both the sunburst legend ("From phylum to
// species") and the read-to-report traceback normalise over the SAME set: the
// displayed named taxa (pct > 0.05). Keeping one source of truth here means the
// two views can never show different denominators (e.g. 36/54 vs 44/44).

type Tax = { phylum: string; pct: number };

/** phylum -> percentage, normalised over displayed named taxa (pct > 0.05). */
export function phylumShares(abundance: Tax[]): Record<string, number> {
  const sums: Record<string, number> = {};
  let total = 0;
  (abundance || []).forEach((a) => {
    if (a.pct > 0.05) {
      sums[a.phylum] = (sums[a.phylum] || 0) + a.pct;
      total += a.pct;
    }
  });
  const out: Record<string, number> = {};
  for (const ph of Object.keys(sums)) out[ph] = (sums[ph] / (total || 1)) * 100;
  return out;
}

/** [phylum, percent] pairs, largest first, normalised like phylumShares. */
export function phylumLegend(abundance: Tax[]): [string, number][] {
  const shares = phylumShares(abundance);
  return Object.keys(shares)
    .sort((x, y) => shares[y] - shares[x])
    .map((ph) => [ph, shares[ph]] as [string, number]);
}

/** the dominant phylum by the same normalised shares. */
export function dominantPhylum(abundance: Tax[], fallback = "Firmicutes"): string {
  return phylumLegend(abundance)[0]?.[0] || fallback;
}
