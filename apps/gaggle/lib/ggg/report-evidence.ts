export const MIN_REPRESENTATIVE_CLASSIFIED_READS = 20;
export const MIN_REPRESENTATIVE_CLASSIFIED_PCT = 50;
export const MIN_BACTERIAL_DOMINANCE_PCT = 55;

type ReportEvidenceInput = {
  retainedReads: unknown;
  classifiedReads: unknown;
  bacterialReads: unknown;
};

function finiteCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Decides whether matched reads represent the QC-retained sample. Bacterial
 * dominance is deliberately measured against every retained read, never only
 * against the subset that happened to match the local reference.
 */
export function assessReportEvidence(input: ReportEvidenceInput) {
  const retainedReads = finiteCount(input.retainedReads);
  const classifiedReads = Math.min(finiteCount(input.classifiedReads), retainedReads);
  const bacterialReads = Math.min(finiteCount(input.bacterialReads), classifiedReads);
  const classifiedPct = retainedReads ? (100 * classifiedReads) / retainedReads : 0;
  const bacterialPct = retainedReads ? (100 * bacterialReads) / retainedReads : 0;
  const representative = classifiedReads >= MIN_REPRESENTATIVE_CLASSIFIED_READS
    && classifiedPct >= MIN_REPRESENTATIVE_CLASSIFIED_PCT;

  return {
    retainedReads,
    classifiedReads,
    bacterialReads,
    classifiedPct,
    bacterialPct,
    representative,
    bacterialDominant: representative && bacterialPct >= MIN_BACTERIAL_DOMINANCE_PCT,
  };
}
