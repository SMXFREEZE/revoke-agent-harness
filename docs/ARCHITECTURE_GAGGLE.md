# The Gaggle architecture

The Gaggle is an adversarial, evidence-grounded microbiome R&D harness around a
synthetic case. It preserves the original GutGutGoose/MetaScope product and adds
a separate scientist-facing investigation layer.

```text
independent Bright Data queries ───────┐
PubMed provenance + methodology flags ├──> TrueForge / OpenAI Chief Scientist
synthetic case + append-only beliefs ──┘                  │
                                       ┌──────────────────┼──────────────────┐
                                  Defense          Prosecution       Evidence Clerk
                                       └──────────────────┼──────────────────┘
                                                  Methodologist
                                                       │
Daytona deterministic experiment + hashes ─────────────┤
                                                       │
                                              blind Red Team
                                                       │
                                             independent jury ×5
                                                       │
                                         disagreement + belief revision
                                                       │
                         exact proposal id + SHA-256 human approval
                                                       │
                         guarded, idempotent synthetic R&D MCP write
```

## Trust boundaries

- Web content is evidence data, never instruction or authority.
- The public case and every displayed score are synthetic R&D artifacts.
- PubMed records support scoped claims; they do not validate this prototype or
  authorize a clinical conclusion.
- OpenAI agents reason and argue; deterministic scores run in Daytona code.
- TrueForge is the persistent orchestration and approval boundary.
- `gaggle-lab-mcp` exposes three read-only operations and one tightly scoped,
  idempotent write. The write checks the exact proposal id and hash.
- Approval changes only the in-memory synthetic investigation record. It does
  not contact patients, alter treatment, or mutate a clinical system.

## State model

The canonical case stores initial candidates, admitted evidence, experiment
metadata, revised candidates, jury votes, disagreement analysis, proposal
preview, decision, and audit events. Belief revision adds a new state; it never
overwrites the earlier ranking.

## Failure and recovery

Bright Data output is schema-validated before admission. The deterministic
fixture records selector failure, rejection, repair, and successful
revalidation. Sandbox errors or missing exact-scope evidence stop the run and
leave the proposal unpromoted. Replayed approvals are idempotent.
