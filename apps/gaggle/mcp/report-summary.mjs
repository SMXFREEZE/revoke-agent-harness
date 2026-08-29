export const DEFAULT_MIN_CLASSIFIED_READS = 20;
export const DEFAULT_MIN_CLASSIFIED_PCT = 50;

const finiteOr = (...values) => {
  for (const value of values) if (Number.isFinite(value)) return Number(value);
  return 0;
};

export function classificationEvidenceFor(report) {
  const supplied = report?.classificationEvidence || {};
  const retainedReads = Math.max(0, finiteOr(supplied.retainedReads, report?.quality?.reads));
  const classifiedReads = Math.min(
    retainedReads,
    Math.max(0, finiteOr(supplied.classifiedReads, report?.classified)),
  );
  const classifiedPct = retainedReads > 0 ? (100 * classifiedReads) / retainedReads : 0;
  const minClassifiedReads = Math.max(
    DEFAULT_MIN_CLASSIFIED_READS,
    finiteOr(supplied.minClassifiedReads, DEFAULT_MIN_CLASSIFIED_READS),
  );
  const minClassifiedPct = Math.max(
    DEFAULT_MIN_CLASSIFIED_PCT,
    finiteOr(supplied.minClassifiedPct, DEFAULT_MIN_CLASSIFIED_PCT),
  );
  const meetsThreshold = classifiedReads >= minClassifiedReads && classifiedPct >= minClassifiedPct;

  return {
    sufficient: supplied.sufficient === false ? false : meetsThreshold,
    classifiedReads,
    retainedReads,
    classifiedPct,
    minClassifiedReads,
    minClassifiedPct,
  };
}

export function reportEligibility(report) {
  const classificationEvidence = classificationEvidenceFor(report);
  const qualityGatePassed = report?.quality?.qualityGatePassed === true;
  const declaredEligible = report?.reportEligible === true;
  const scoresAvailable = [report?.scores?.scfa, report?.scores?.resilience, report?.scores?.dysbiosis]
    .every(Number.isFinite);
  const eligible = declaredEligible
    && qualityGatePassed
    && classificationEvidence.sufficient
    && scoresAvailable;
  let reason = null;
  if (!qualityGatePassed) reason = "quality_control_failed";
  else if (!classificationEvidence.sufficient) reason = "insufficient_classified_evidence";
  else if (!declaredEligible) reason = "report_not_eligible";
  else if (!scoresAvailable) reason = "scores_unavailable";

  return { eligible, reason, qualityGatePassed, classificationEvidence };
}

export function insufficientEvidenceResponse(report, { analysisId, operation } = {}) {
  const eligibility = reportEligibility(report);
  const response = {
    status: "insufficient_evidence",
    reportEligible: false,
    operation: operation || "get_report",
    reason: eligibility.reason || "report_not_eligible",
    message: "Insufficient quality-controlled taxonomic evidence for an abundance-based gut report.",
    classificationEvidence: eligibility.classificationEvidence,
    qualityEvidence: {
      qualityGatePassed: eligibility.qualityGatePassed,
      rawReads: finiteOr(report?.quality?.rawReads),
      retainedReads: finiteOr(report?.quality?.reads),
      passPct: finiteOr(report?.quality?.passPct),
    },
  };
  if (analysisId) response.analysisId = analysisId;
  return response;
}

export function guardReport(report, context) {
  return reportEligibility(report).eligible ? null : insufficientEvidenceResponse(report, context);
}

const planFor = (report) => (report?.recommendations || []).slice(0, 5).map((recommendation) => ({
  strain: recommendation.strain,
  tag: recommendation.tag,
  why: (recommendation.why || "").replace(/\s*[—–]\s*/g, ", "),
}));

export function summariseReport(report, { analysisId, operation = "get_report" } = {}) {
  const blocked = guardReport(report, { analysisId, operation });
  if (blocked) return blocked;

  const scores = report.scores;
  const diversity = report.diversity || {};
  const flags = (report.abundance || []).filter((taxon) => taxon.status !== "ok");
  return {
    ...(analysisId ? { analysisId } : {}),
    status: "report_ready",
    reportEligible: true,
    gutHealthScore: Math.round((scores.scfa + scores.resilience + (100 - scores.dysbiosis)) / 3),
    reads: report.classified,
    classificationEvidence: classificationEvidenceFor(report),
    diversity: { shannon: Number(diversity.shannon?.toFixed?.(2)), richness: diversity.richness },
    firmicutesToBacteroidetes: Number(report.fbRatio?.toFixed?.(2)),
    enterotype: report.enterotype,
    taxa: (report.abundance || []).map((taxon) => ({
      species: taxon.species,
      phylum: taxon.phylum,
      percent: Number(taxon.pct?.toFixed?.(2)),
      status: taxon.status,
    })),
    flagged: flags.map((taxon) => ({
      species: taxon.species,
      status: taxon.status,
      percent: Number(taxon.pct?.toFixed?.(2)),
    })),
    plan: planFor(report),
  };
}

export function summarisePlan(report, { analysisId, operation = "get_plan" } = {}) {
  const blocked = guardReport(report, { analysisId, operation });
  if (blocked) return blocked;
  return {
    ...(analysisId ? { analysisId } : {}),
    status: "report_ready",
    reportEligible: true,
    classificationEvidence: classificationEvidenceFor(report),
    plan: planFor(report),
  };
}
