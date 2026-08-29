# Sponsor setup

Use `C:/Users/sami/.config/ai/env.local` on the owner's machine. Never copy its
values into this repository. The loader recognizes the owner's
`DAYTONA_API`/`BRIGHT_DATA_API` names and maps them only inside the current
process to the official tool names.

```powershell
& .\scripts\import-sponsor-env.ps1
npm run sponsor:check:daytona
npm run sponsor:check:bright-data
npm run sponsor:test:bright-data:gaggle
npm run sponsor:check:bright-data:gaggle:remote
```

Expected results are JSON with `status: ok`. The Daytona probe requires
`write:sandboxes`, `delete:sandboxes`, `write:snapshots`, and
`delete:snapshots`. The Bright Data probe uses the official pinned MCP and only
publishes `search_engine` and `scrape_as_markdown`.

The two Gaggle commands exercise the additive biotech evidence contract. The
deterministic test proves schema-gated drift recovery and fail-closed handling;
the live probe performs one Bright Data search and one Bright Data scrape
against the configured public literature record. It emits only verification
metadata and content hashes. See `docs/BRIGHT_DATA_GAGGLE_EVIDENCE.md` for the
exact contract and evidence artifacts. The original recall probe remains
unchanged.

The Qodo GitHub App is required on the public repository. `QODO_API_KEY` is
optional and is used only for local semantic-rules lookup when available. Do
not replace the GitHub App review with a local LLM review; submitted evidence
must link to real Qodo review comments and the remediation round.

TrueForge runs locally at `http://127.0.0.1:8790`. Configure:

1. OpenAI model provider from `OPENAI_API_KEY`.
2. Daytona sandbox provider from `DAYTONA_API`.
3. `bright-data`, `cpsc-recalls`, and `revoke-commerce` remote MCP connectors.
4. The `recall-containment` Git skill after the public repository exists.
5. Import `agents/revoke.agent.json`.

No sponsor substitutes are permitted on the submitted golden path.

## Windows runtime patch

TrueForge 0.1.4 currently reaches Kysely's file migration provider with Windows
absolute paths. Node ESM requires those paths to be converted to `file://` URLs.
`patches/kysely+0.29.5.patch` applies that cross-platform conversion during
`npm install`; it changes no TrueForge behavior beyond allowing its official
SQLite migrations to load on Windows.
