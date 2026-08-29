# The Gaggle agent instructions

Read CODEX.md, HARD_RULES_AND_WIN_PLAN.md, and SOURCE_RULE_TRACEABILITY.md before making changes.

## Current mission

Build the additive biotech target defined at the top of
HARD_RULES_AND_WIN_PLAN.md. Preserve the imported GutGutGoose/MetaScope product
under `apps/gaggle`; implement The Gaggle as the adversarial scientific R&D
layer. The historical recall workflow is not the current submission target.

## Sponsor stack is mandatory

The product must use the event sponsor tools as first-class, judge-visible dependencies:

1. TrueForge is the runtime for sessions, MCP tools, subagents, sandbox execution, human approvals, context management, and Generative UI.
2. OpenAI is the configured model provider inside TrueForge.
3. Bright Data supplies independent scientific web evidence, reusable version-controlled extraction, drift detection, and recovery.
4. Qodo reviews every important pull request and its findings must be resolved or explicitly justified before merge.
5. Daytona executes deterministic experiments and counterfactual calculations.

Do not replace a sponsor tool with a custom imitation on the golden path.

## Required workflow

- Keep important implementation off main.
- Use a feature branch and public pull request.
- Run Qodo agentic review on every important pull request.
- Fix valid action-required findings.
- Explain dismissals and obtain a follow-up review.
- Never expose credentials.
- Keep scientific evidence separate from the clearly labeled synthetic R&D case.
- Never imply clinical validity, diagnosis, treatment, or patient-specific advice.
- Never promote an experimental proposal before exact id-and-hash TrueForge approval.
- Preserve prior beliefs, dissent, tool provenance, and audit receipts.
- Run all checks before requesting review.

## Credential policy

For this project, use C:/Users/sami/.config/ai/env.local as explicitly directed by
the project owner. Load it only into the current process with
scripts/import-sponsor-env.ps1. Never print, copy, commit, or place real
credentials in browser code. Only example variable names may exist in this
repository.
