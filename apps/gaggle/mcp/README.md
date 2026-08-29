# GutGutGoose MCP server

The GutGutGoose microbiome platform, exposed to any MCP-capable AI agent
(Claude Desktop, Cursor, Claude Code, etc.). The same shotgun-metagenomics
engine that powers the web report runs here in Node, so an agent can analyse a
real FASTQ, read the structured report, and pull clinical context for any
flagged microbe, then reason about it in conversation.

## Tools

| Tool | What it does |
| --- | --- |
| `analyze_gut_sample` | Runs the MetaScope engine on a FASTQ (or the built-in demo sample). Returns a unique `analysisId` plus gut-health score, diversity, F/B ratio, enterotype, every taxon, flags, and the personalised plan. |
| `get_report` | One report by required `analysisId`. |
| `explain_microbe` | One microbe from a required `analysisId`: its abundance and status plus clinical context (role, associated conditions, dietary levers, evidence). |
| `search_medical_evidence` | Live **PubMed** (NCBI) search for a microbe/condition. Returns real papers (title, year, journal, PMID, link). |
| `find_clinical_trials` | Live **ClinicalTrials.gov** search. Returns real studies (NCT id, title, status, link). |
| `get_plan` | The personalised probiotic recommendations for a required `analysisId`. |

The last two reach live external medical platforms (no key needed), so an agent can
analyse a sample, flag a microbe, then back it with real published research and active
trials end to end.

## Run

```bash
node mcp/gutgutgoose-server.mjs
```

It speaks MCP over stdio. Requires `@modelcontextprotocol/sdk` (already a
dependency of this repo).

## Connect to Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gutgutgoose": {
      "command": "node",
      "args": ["/absolute/path/to/gutgutgoose-app/mcp/gutgutgoose-server.mjs"]
    }
  }
}
```

Then ask Claude things like:

- "Analyze the demo gut sample and summarise the result."
- "Why is the patient's E. coli flagged, and what should they do?"
- "Their Faecalibacterium is low. Find recent PubMed evidence and any clinical trials."
- "Explain Akkermansia, then look up trials testing it as a probiotic."
- "What is in their personalised plan?"

The agent calls `analyze_gut_sample`, preserves its `analysisId`, then passes that
ID to `explain_microbe` / `get_plan`, and grounds its answers in the real engine
output plus the curated medical context.

Analyses are isolated by ID, expire after 30 idle minutes, and are bounded to the
32 most recently accessed reports. This prevents parallel clients from reading
or overwriting one another's report state.

> Synthetic demo data. Not medical advice.
