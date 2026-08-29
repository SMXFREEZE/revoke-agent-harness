# REVOKE

REVOKE is a human-approved stop-sale command center. When a consumer-safety
recall expands, it verifies current evidence, matches newly affected products
to a simulated merchant catalog and orders, executes exposure calculations in
an isolated sandbox, and pauses before containment.

## Sponsor stack

- TrueForge runs the persistent agent session, MCP tools, specialist subagents,
  sandboxed Code Mode, approvals, context management, and Generative UI.
- OpenAI is the model provider configured in TrueForge.
- Bright Data supplies fresh structured web evidence and demonstrated
  extraction drift recovery.
- Qodo reviews every important pull request and provides the public quality
  evidence required by the hackathon.

These are architectural dependencies, not decorative integrations.

## Data disclosure

Recall evidence can be live and always includes provenance. Catalog, inventory,
orders, customers, and containment mutations run in a clearly labeled simulated
commerce environment. REVOKE does not modify a real retailer or contact real
customers.

## Status

The repository policy and judging plan are complete. Implementation is being
built on a feature branch and will remain unmerged until Qodo review is active.

## Documents

- HARD_RULES_AND_WIN_PLAN.md — complete product, architecture, demo, safety, and judging plan.
- SOURCE_RULE_TRACEABILITY.md — every source requirement mapped to supplied PDF pages.
- CODEX.md and AGENTS.md — binding implementation instructions.
- ATTRIBUTIONS.md — upstream projects and licenses.

## Local prerequisites

- Node.js 22.14 or newer
- TrueForge
- OpenAI provider credential
- Bright Data API credential
- Daytona API credential with sandbox and snapshot permissions
- Qodo account, API key for Agent Skills, and GitHub App installation

Never commit credentials. Use .env.local only for local services; configure
model, MCP, and sandbox credentials in TrueForge connectors whenever possible.
On the owner's machine, scripts/import-sponsor-env.ps1 loads the approved
C:/Users/sami/.config/ai/env.local file into the current process without
printing values. It maps the existing DAYTONA_API name to DAYTONA_API_KEY for
tools that expect the latter, and BRIGHT_DATA_API to BRIGHTDATA_API_KEY for the
official Bright Data CLI. Both aliases exist only in the current process.


## Qodo Code Review Evidence

Pending the first representative public pull request. Before submission this
section will link to a merged PR showing the initial Qodo review, fixes or
explained dismissals, and a follow-up review. Screenshots will not be used as a
substitute for the public PR.

## License

MIT. See LICENSE and ATTRIBUTIONS.md.
