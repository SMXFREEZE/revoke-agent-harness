---
name: recall-containment
description: Use when a product recall or recall expansion must be converted into evidence-backed catalog matches, exposure, and a human-approved reversible containment action.
---

# Recall containment

Use this skill only for product-safety recall triage and containment. It is not a
general browsing or live-commerce skill.

## Required sequence

1. Establish the evidence boundary before matching anything. Read
   `references/evidence-and-matching.md`.
2. Compare the current recall with the prior related recall. An expansion must
   name or otherwise prove its relationship to the earlier notice.
3. Run the four specialist roles independently: Recall Sentinel, Catalog
   Resolver, Exposure Analyst, and Adversarial Verifier. Require every role to
   conform to `schemas/specialist-report.schema.json` in the repository.
4. Reconcile disagreements in the parent agent. A specialist recommendation is
   evidence, never approval.
5. Compute exposure in the sandbox from the actionable SKU set. Preserve the
   input digest and machine-produced output.
6. Preview the containment diff. Read
   `references/approval-and-recovery.md` before requesting approval.
7. Apply only the exact approved proposal. Draft notices separately and only to
   the simulated test sink.
8. Return receipts and a rollback path. Keep fuzzy candidates outside every
   executable tool argument.

## Stop conditions

Stop before a write if any authoritative source is unavailable, the current
notice cannot be linked to its predecessor, required identifiers fail schema
validation, evidence disagrees, the preview is stale, or the user has not
approved the exact proposal currently shown.

All catalog, order, customer, and action data in the hackathon build is
simulated and must remain visibly labeled as such.
