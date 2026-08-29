# The Gaggle

**Live scientific courtroom:** https://smxfreeze.github.io/revoke-agent-harness/
**Public implementation PR:** https://github.com/SMXFREEZE/revoke-agent-harness/pull/1

The Gaggle is an adversarial multi-agent microbiome R&D system. Independent AI
scientists argue opposing cases, retrieve provenance-bearing evidence, run a
deterministic experiment, challenge the leader, revise their beliefs, preserve
jury disagreement, and stop for exact scientist approval.

The complete GutGutGoose/MetaScope application imported from the owner's Vercel
deployment is preserved under `apps/gaggle`. The Gaggle is an additive R&D
layer using the same visual architecture, not a replacement for the existing
product.

## Why this needs an agent harness

- TrueForge runs the persistent case, typed tools, bounded specialists,
  approvals, context management, and event trace.
- OpenAI is the model provider inside TrueForge.
- Bright Data performs independent evidence retrieval and demonstrates
  schema-validated extraction drift recovery.
- Daytona runs deterministic candidate scoring and counterfactual analysis.
- Qodo is the mandatory public PR quality gate.

These are decision-path dependencies, not sponsor badges.

## Golden case

Case GGG-0042 asks how to increase predicted support for butyrate-producing
pathways in a synthetic community. Candidate A begins at rank #1 and falls to
#3; Candidate B rises from #2 to #1 after methodology review and Daytona
competition analysis. The initial ranking remains inspectable, jury dissent is
preserved, and the run stops before the guarded write.

This is synthetic experimental R&D. Published records are used only as scoped
evidence with direct provenance. The prototype does not diagnose, prescribe,
recommend treatment, claim clinical validation, or change a real clinical
system.

## Repository map

- `apps/console` — judge-facing scientific courtroom deployed to GitHub Pages.
- `apps/gaggle` — complete imported GutGutGoose/MetaScope Next.js product.
- `services/gaggle-lab-mcp` — read tools plus exact-id-and-hash guarded,
  idempotent synthetic proposal promotion.
- `packages/domain` — typed scoring, belief revision, disagreement, and
  approval rules.
- `agents/gaggle.agent.json` — bounded TrueForge scientific team.
- `fixtures/gaggle/case-0042.json` — deterministic golden case and recovery
  fixture.
- `docs/ARCHITECTURE_GAGGLE.md` — current architecture and trust boundaries.
- `docs/GOLDEN_RUN_EVIDENCE.md` — truthful sponsor-backed execution record.
- `HARD_RULES_AND_WIN_PLAN.md` — binding product, sponsor, safety, and judging
  contract.
- `SOURCE_RULE_TRACEABILITY.md` — supplied-document requirement traceability.

## Run locally

Prerequisites: Node.js 22.14 or newer and approved sponsor credentials.

```powershell
npm install
npm run build --workspace @revoke/console
npm run preview --workspace @revoke/console
```

Sponsor-backed orchestration:

```powershell
npm run dev:gaggle-lab
npm run trueforge:start
npm run trueforge:configure:gaggle
```

Run `npm run check` for lint, type checks, tests, and production builds.

## Credential policy

Never commit credentials. On the owner's machine,
`scripts/import-sponsor-env.ps1` loads the approved
`C:/Users/sami/.config/ai/env.local` into the current process without printing
values. It maps `DAYTONA_API` to `DAYTONA_API_KEY` and `BRIGHT_DATA_API` to
`BRIGHTDATA_API_KEY` only for the current process. The Vercel source importer
reads its token file privately and verifies every downloaded file hash.

## Qodo Code Review Evidence

[Public implementation PR #1](https://github.com/SMXFREEZE/revoke-agent-harness/pull/1)
is the representative review trail. The Qodo GitHub App is the mandatory merge
gate: valid findings are fixed, every dismissal is publicly justified, and a
follow-up review is required. Final dispositions will be recorded here after
review; screenshots are not substitutes for the public PR.

## License

MIT. See `LICENSE` and `ATTRIBUTIONS.md`.
