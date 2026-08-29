import { resolveMicrobeQuery } from "./tool-input.mjs";

const finite = (value) => Number.isFinite(value) ? Number(value) : 0;
const rounded = (value) => Number(finite(value).toFixed(2));

function observed(taxon) {
  return finite(taxon?.reads) > 0 || finite(taxon?.pct) > 0;
}

/** Allocate hundredths with largest remainders so rows reconcile to the rounded total. */
function reconciledPercentages(taxa) {
  const exactHundredths = taxa.map((taxon) => Math.max(0, finite(taxon.pct)) * 100);
  const allocated = exactHundredths.map(Math.floor);
  let remainder = Math.round(exactHundredths.reduce((sum, value) => sum + value, 0))
    - allocated.reduce((sum, value) => sum + value, 0);
  const order = exactHundredths
    .map((value, index) => ({ index, fraction: value - allocated[index] }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);

  for (let index = 0; index < remainder; index += 1) {
    allocated[order[index].index] += 1;
  }

  return allocated.map((value) => value / 100);
}

export function buildMicrobeResult(report, microbeName, { analysisId, clinicalFor } = {}) {
  const match = resolveMicrobeQuery(report?.abundance, microbeName);
  const observedTaxa = match?.taxa.filter(observed) ?? [];
  const found = observedTaxa.length > 0;
  const clinical = typeof clinicalFor === "function"
    ? clinicalFor(match ? match.label : microbeName)
    : null;
  const percentages = match?.scope === "genus" ? reconciledPercentages(observedTaxa) : [];
  const abundance = found && match.scope === "genus"
    ? {
        scope: "genus",
        percent: rounded(percentages.reduce((sum, value) => sum + value, 0)),
        reads: observedTaxa.reduce((sum, taxon) => sum + finite(taxon.reads), 0),
        speciesCount: observedTaxa.length,
        taxa: observedTaxa.map((taxon, index) => ({
          species: taxon.species,
          percent: percentages[index],
          status: taxon.status,
        })),
      }
    : found
      ? {
          scope: "species",
          percent: rounded(observedTaxa[0].pct),
          status: observedTaxa[0].status,
          phylum: observedTaxa[0].phylum,
          healthyRange: `${observedTaxa[0].healthyLo}-${observedTaxa[0].healthyHi}%`,
        }
      : null;

  return {
    ...(analysisId ? { analysisId } : {}),
    status: "report_ready",
    reportEligible: true,
    microbe: match ? match.label : microbeName,
    scope: match?.scope ?? null,
    referenceMatched: !!match,
    found,
    abundance,
    clinical: clinical || "No curated medical context for this microbe.",
  };
}
