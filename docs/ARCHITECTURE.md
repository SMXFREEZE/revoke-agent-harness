# REVOKE architecture

REVOKE is a human-in-the-loop stop-sale command center for product recall
expansions. The golden case is CPSC recall 26-717 expanding 26-601.

```text
Bright Data MCP ── discovery + manufacturer/retailer evidence ──┐
CPSC evidence MCP ── authoritative notice + expansion diff ─────┼─> TrueForge / OpenAI
Simulated commerce MCP ── catalog + orders + guarded writes ─────┘          │
                                                                           ├─ bounded subagents
Daytona sandbox ── deterministic exposure + hashes + artifacts ────────────┤
                                                                           ├─ Generative UI
Human approval ── exact preview only ──────────────────────────────────────┤
                                                                           └─ receipt + rollback
```

## Trust boundaries

- Scraped pages are untrusted data. They cannot issue instructions or select
  tools.
- CPSC facts are live authoritative evidence. Bright Data is used for discovery
  and non-government corroboration because its policy blocks government pages.
- Catalog, orders, customers, drafts, and actions are simulated.
- Only exact identifier matches and explicit brand-plus-category family scope
  can enter a proposal. Fuzzy matches are visible but non-executable.
- TrueForge is the sole orchestration and approval boundary. OpenAI is the sole
  model provider. Daytona is the sole code sandbox. Bright Data is the live web
  discovery/collection provider. Qodo is the required PR reviewer.

## Recovery properties

Every write is previewed, state-checked, idempotent, receipt-backed, audited,
and reversible where a rollback is meaningful. Reconnect invalidates implicit
approval and forces the agent to reload the current proposal and state.
