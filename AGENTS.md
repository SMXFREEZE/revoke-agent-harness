# REVOKE agent instructions

Read CODEX.md, HARD_RULES_AND_WIN_PLAN.md, and SOURCE_RULE_TRACEABILITY.md before making changes.

## Sponsor stack is mandatory

The product must use the event sponsor tools as first-class, judge-visible dependencies:

1. TrueForge is the runtime for sessions, MCP tools, subagents, sandbox execution, human approvals, context management, and Generative UI.
2. OpenAI is the configured model provider inside TrueForge.
3. Bright Data supplies live web evidence, reusable version-controlled extraction, drift detection, and recovery.
4. Qodo reviews every important pull request and its findings must be resolved or explicitly justified before merge.

Do not replace a sponsor tool with a custom imitation on the golden path.

## Required workflow

- Keep important implementation off main.
- Use a feature branch and public pull request.
- Run Qodo agentic review on every important pull request.
- Fix valid action-required findings.
- Explain dismissals and obtain a follow-up review.
- Never expose credentials.
- Keep live recall evidence separate from the clearly labeled simulated commerce environment.
- Never invoke a consequential commerce write before TrueForge approval.
- Never allow a fuzzy-only product match to become an executable action.
- Run all checks before requesting review.

## Credential policy

Use the canonical local credential loader defined by C:/Users/sami/AGENTS.md. Never print, copy, commit, or place real credentials in browser code. Only example variable names may exist in this repository.

