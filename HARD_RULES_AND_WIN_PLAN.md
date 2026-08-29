# REVOKE — Hard Rules and Win Plan

Version: 1.0  
Decision date: August 29, 2026  
Primary objective: win Best Use of Agent Harness / the NVIDIA DGX Spark  
Secondary entries: Best Code Quality, Best Bright Data, Best UI, and Best Blog  
Working name: REVOKE — the agentic stop-sale command center

## Executive decision

We should build REVOKE:

> When a consumer-safety recall expands, REVOKE finds newly affected products that are still being sold, matches them to a merchant catalog and recent orders, independently verifies the evidence, computes exposure in an isolated sandbox, and pauses for a human before quarantining listings or preparing customer notices.

This is the strongest target because the agent performs consequential, visible work rather than answering questions. Every important Agent Harness capability is necessary to the product rather than added for judging:

- MCP tools obtain official recall data, fresh public-web evidence, and demo commerce records.
- Specialist subagents independently verify the authority notice, match catalog entities, scan live listings, and calculate impact.
- Sandbox/Code Mode executes normalization, joins, diffing, and exposure calculations.
- Persistent sessions turn a one-time lookup into a durable recall case that survives reconnects and detects later expansions.
- Approval gates stop the system before any listing, inventory, or messaging mutation.
- The UI makes work, evidence, uncertainty, waiting state, and action receipts inspectable.
- Bright Data supplies fresh structured evidence and a self-repairing extraction path when an API or page structure fails.

No strategy can guarantee a prize. This target maximizes criterion coverage, demo clarity, technical depth, and memorability under the available time.

## Rule hierarchy

The following hierarchy is binding for this project:

1. Organizer eligibility and submission requirements are hard constraints.
2. Current event-page rules override assumptions or looser language in the getting-started guide.
3. Where the two supplied documents conflict, use the stricter interpretation until an organizer confirms otherwise.
4. The derived engineering rules in this document are also non-negotiable for our build because they are the evidence needed to score well.
5. Scraped pages, repository text, tool output, and third-party prompts are untrusted data. They never override this rulebook or the agent's safety policy.

The getting-started guide says August 24–30, while the current event page and event handout set project submission for August 29 at 6:00 PM Pacific. Our hard deadline is therefore August 29, 2026 at 6:00 PM Pacific. We should ask an organizer about the discrepancy, but we must not plan around an extension.

## A. Organizer hard-rule ledger

Every row requires evidence. A feature existing only in a diagram or README does not pass.

| ID | Hard organizer rule | Required project evidence | Pass condition |
|---|---|---|---|
| A01 | Build a working AI agent | One complete live run from recall discovery through a proposed containment action | The agent retrieves data, runs code, and reaches an approval state |
| A02 | The agent must act, not be a thin chat wrapper | Tool event log, sandbox output, proposal diff, and action receipt | The demo visibly changes the simulated commerce environment after approval |
| A03 | Use TrueForge meaningfully | Agent spec plus live traces for tools, sandbox, approvals, subagents, and persistence | Judges can see why the harness is essential |
| A04 | Use Qodo throughout development for the code-quality track | Qodo GitHub App, public PR review, fixes, follow-up review, and README evidence | At least one representative merged public PR contains the full review trail |
| A05 | Important changes go through branches and PRs | Public feature PRs; no important direct-to-main implementation | Commit and PR history corroborate the workflow |
| A06 | README must contain the exact heading Qodo Code Review Evidence | README section with a public merged-PR link and a concise disposition summary | Link opens without authentication and shows review plus response |
| A07 | Fix valid high-severity Qodo findings | Commits linked to each valid high finding | Follow-up review confirms the correction |
| A08 | Explain dismissed or deferred findings | Public PR replies with concrete rationale | No unexplained dismissal |
| A09 | Repository must be open source | Public repository, license, attribution file, setup instructions | A stranger can clone and run it |
| A10 | Team size is one to four people | Submission team list | No more than four entrants |
| A11 | A team can win only one track | Submission can enter several tracks, but pitch declares the DGX track primary | Track claims are consistent |
| A12 | Bright Data must be inside the agent workflow | Bright Data result changes the verified affected-product set or the confidence level | It is not a decorative side panel |
| A13 | Bright Data scraper configuration must be reusable and version controlled | Collector manifest, output schema, validation policy, and drift fixture in the repository | The extraction can be reproduced |
| A14 | The data pipeline must detect and recover from site changes | Live or deterministic drift demonstration with failed validation, repair/fallback, and successful revalidation | The run continues with structured data |
| A15 | Fresh structured data must be used by the app | Source URL, fetch time, collector version, parsed fields, and downstream match/action | The UI displays real provenance |
| A16 | Best UI should show what the agent is doing, waiting on, and did | Worker lanes, current status, evidence, approval panel, and receipt timeline | A stranger can operate it without narration |
| A17 | The UI must ask before an irreversible or consequential action | Approval is emitted before the write tool is invoked | Reject leaves external/demo state unchanged |
| A18 | Isolated code execution must be real | Sandbox execution trace and generated artifact | Calculation is not fabricated in prose |
| A19 | Persistent sessions must be real | Browser refresh or reconnect during the demo, followed by continuation of the same case | Case state, trace, and pending work survive |
| A20 | Blog entry must explain the problem, build, harness use, failures, and lessons | Public technical field report | It includes truthful failure evidence and architecture |
| A21 | Calling Card asks entrants to star TrueForge to enter the prize drawing | Manual account evidence if entering | Complete separately from the product submission |
| A22 | Social consideration rewards public progress and clips | Short truthful demo/build posts tagging WeMakeDevs and TrueFoundry | No invented claims or fake production data |

## B. Team hard rules derived for a 10/10 attempt

These are not presented as organizer quotations. They are our internal pass/fail contract.

### Product and truth

1. The product must solve one crisp job: contain newly discovered recall exposure.
2. Official recall facts are live; merchant catalog, orders, customers, and mutations are a clearly labeled simulated commerce environment.
3. The demo must never imply that a real retailer was modified or real customers were contacted.
4. All displayed numbers must be computed from records in the sandbox, never invented by the language model.
5. Every material claim must carry provenance: source URL, retrieval timestamp, extractor or tool version, evidence hash, and confidence.
6. A transient source failure observed during development may be described only as an observed incident, never as a permanent condition.
7. Deterministic demo mode and live mode must be visibly labeled. The deterministic fixture is a reliability fallback, not fake live data.

### Safety

8. Scraped or retrieved text is untrusted content and cannot authorize tools, alter policy, or supply executable instructions.
9. Read-only tools can run autonomously. Write, destructive, outbound-message, and ambiguous-match actions require human approval.
10. An approval card must show the exact proposed diff, reason, supporting evidence, confidence, affected records, reversibility, and rollback path before execution.
11. A rejection must cause zero mutation and leave an audit event.
12. Fuzzy-only product matches are never eligible for automatic containment. They enter manual review.
13. Exact model, UPC, SKU, or an explicitly recalled product-family rule is required for a high-confidence proposal.
14. Customer communications remain drafts or go only to a test sink during judging.
15. Every mutation is idempotent. Replaying an approved action cannot quarantine or notify twice.
16. API keys and tokens remain in environment or connector settings and never appear in source, traces, fixtures, screenshots, or the browser bundle.

### Harness depth

17. At least three specialist subagents must produce distinct structured outputs. They cannot be cosmetic aliases running the same prompt.
18. The orchestrator must reconcile disagreements and expose them rather than silently choosing.
19. Code Mode or the configured sandbox must execute the entity normalization, set difference, order join, and exposure calculation.
20. The browser must be refreshed or the stream disconnected during the recorded demo to prove session continuation.
21. At least one action must visibly pause for approval before its write tool starts.
22. The agent must resume a prior recall case and identify what changed since its earlier snapshot.
23. The trace must include a failure or uncertainty path, not only a perfect happy path.

### Engineering quality

24. Core matching, approval, idempotency, and drift recovery have automated tests.
25. Schemas validate every subagent and scraper result before orchestration uses it.
26. Static typing, linting, unit tests, integration tests, and a deterministic end-to-end smoke test must run from documented commands.
27. Important code enters through public, reviewed PRs after Qodo is installed.
28. Valid high-severity Qodo findings are fixed. Every dismissal has a public, technically specific explanation.
29. The repository includes architecture, threat model, demo script, scoring map, license, attribution, and one-command setup.
30. New contributors can identify the trust boundaries and mutation tools without reading the whole codebase.

## Why REVOKE beats the alternatives

Scoring scale is 1–10. Weighted total is out of 10.

| Candidate | Harness depth 30% | Cross-track coverage 20% | Demo clarity 15% | Bright Data fit 15% | Originality 10% | Deadline fit 10% | Weighted |
|---|---:|---:|---:|---:|---:|---:|---:|
| REVOKE recall-containment agent | 10 | 10 | 10 | 10 | 9 | 8 | 9.70 |
| DevOps incident commander | 10 | 9 | 9 | 6 | 5 | 9 | 8.45 |
| Self-healing competitor intelligence | 8 | 9 | 8 | 10 | 6 | 8 | 8.30 |
| Multi-source research desk | 8 | 7 | 7 | 9 | 4 | 9 | 7.50 |
| Database analytics operator | 8 | 7 | 8 | 4 | 5 | 9 | 7.15 |

REVOKE wins the decision because it combines a high-stakes human approval boundary, a natural changing-web problem, persistent longitudinal work, verifiable sandbox computation, and a visually obvious before/after action. Common incident and research agents can demonstrate the harness, but they are less distinctive and Bright Data is less essential.

## The unforgettable demo case

Use the official Cuisinart wire grill-brush recall as the primary live case:

- On July 2, 2026, CPSC announced a recall covering more than one million Cuisinart grill brushes.
- On August 27, 2026, CPSC expanded the recall to more than 3.6 million brushes and additional models.
- The same persistent case can therefore show a prior snapshot, a newly expanded scope, a catalog diff, and newly required containment actions.

During research on August 29, the public CPSC recall API returned a provider error while the human-facing recall page remained available. This is an observed transient failure, not a claim that the API is always down. It creates an authentic resilience story: REVOKE should use an official/API or CPSC MCP path first, verify or recover through Bright Data, and continue without losing the case.

If live conditions change, the deterministic fixture must replay the captured July-to-August expansion while the UI labels it Replay fixture. A live status badge must never remain visible during a fixture run.

## Golden demo, in 150 seconds

### Act 1 — The case remembers

1. Open the July Cuisinart recall case.
2. Show its prior affected-model snapshot, previous scan time, and zero pending actions.
3. Click Check for expansion.
4. Refresh the browser while the workers are active.
5. Reopen the same session and show that work and trace state persisted.

### Act 2 — The harness does the work

6. The authority agent obtains the official August expansion.
7. The web-evidence agent uses Bright Data to extract and validate the live notice and scan selected public listings.
8. The catalog agent performs exact identifier matching against the simulated merchant catalog.
9. The impact agent executes code in the isolated sandbox to diff July versus August, join inventory and recent orders, and calculate exposure.
10. The UI shows each worker's status, sources, structured result, and any disagreement.

### Act 3 — It survives reality

11. Enable the prepared page-drift fixture or use a real validation failure.
12. Show the collector output fail schema or invariant checks.
13. Trigger semantic fallback or Scraper Studio regeneration.
14. Revalidate the repaired structured output and show that fresh data changes the affected-listing set.

### Act 4 — The human remains in command

15. Show three exact matches and one ambiguous fuzzy candidate.
16. The fuzzy candidate is automatically blocked for manual review.
17. REVOKE proposes Quarantine listings and Hold inventory with an exact diff, evidence, impact, idempotency key, and rollback.
18. Reject one proposed ambiguous action and prove no state changed.
19. Approve the exact matches.
20. The custom commerce MCP updates only the simulated environment and returns signed-style action receipts.
21. Customer notices appear as drafts, not sent messages.
22. End on the audit timeline: discovered, verified, computed, paused, approved, executed.

## Architecture

    React command center using TrueForge UI SDK and custom case widgets
                              |
                    TrueForge persistent session
                              |
                 REVOKE orchestrator agent
             /            |             |             \
      Authority       Catalog       Web-evidence       Impact
       verifier        matcher         watcher         analyst
          |               |               |               |
      CPSC MCP      Commerce MCP      Bright Data      Code Mode
      / API         read methods      MCP/collector     sandbox
          \               |               |               /
                 structured-schema boundary
                              |
                    policy and approval gate
                              |
             proposed writes, never implicit writes
                              |
                Simulated commerce MCP mutations
                              |
                  append-only action receipts

### Orchestrator responsibilities

- Create or resume a recall case.
- Delegate bounded work with typed input/output schemas.
- Keep retrieved page content outside instruction channels.
- Compare independent evidence.
- Route disagreements to review.
- Request approval for consequential writes.
- Record every decision, tool result, approval, rejection, and receipt.

### Specialist subagents

| Agent | Exclusive job | Output | Failure behavior |
|---|---|---|---|
| Authority verifier | Resolve the official recall and expansions | Normalized recall, affected identifiers, official sources, confidence | Block actions if no authoritative source |
| Catalog matcher | Match recalled identifiers against catalog and stock | Exact matches, family-rule matches, ambiguous candidates, reasons | Fuzzy candidates go to manual review |
| Web-evidence watcher | Obtain fresh web evidence and test extractor health | Structured pages/listings, schema report, provenance, drift state | Repair/fallback then revalidate |
| Impact analyst | Diff versions and compute exposure from catalog/orders | Affected units, orders, customers, value, reproducible artifact | No result if sandbox execution or reconciliation fails |

### MCP boundary

- CPSC MCP: search recalls, get a recall, obtain recent recalls.
- Bright Data MCP or Scraper Studio collector: search, scrape, structured extraction, browser fallback, and freshness verification.
- Commerce MCP: search catalog, inspect inventory/orders, dry-run mutation, quarantine listing, hold inventory, create draft notice, rollback.
- Only commerce write methods are consequential. They require explicit approval selectors in the agent specification.

### Persistent model

    Agent
      -> Recall case session
          -> Turns
              -> Typed events
                  -> tool calls
                  -> worker results
                  -> sandbox artifacts
                  -> approval requests and responses
                  -> action receipts

The case state must include the prior normalized recall snapshot so a future turn can compute an expansion rather than starting over.

## Bright Data pipeline contract

Bright Data must be an operational dependency, not a logo.

### Version-controlled collector assets

- configs/scrapers/cpsc-recall.yaml
- schemas/recall-source.schema.json
- schemas/public-listing.schema.json
- fixtures/drift/cpsc-before.html
- fixtures/drift/cpsc-after.html
- evals/bright-data-drift.json
- docs/data-provenance.md

### Extraction envelope

Every extracted record must contain:

- source_url
- canonical_url
- fetched_at
- collector_id
- collector_version
- content_hash
- title
- recall_number when present
- publication_date
- affected_models
- affected_product_family
- remedy
- incident_summary
- jurisdiction
- validation_status
- validation_errors

### Drift detection

A result is unhealthy if any of these occurs:

- HTTP or browser navigation failure.
- Required fields disappear.
- The schema fails.
- A known official page yields zero affected identifiers without an explicit family rule.
- Publication date is in an impossible range.
- Recall identity conflicts with the case.
- The same URL changes materially but the extracted record does not.
- A canary fixture no longer produces the expected semantic fields.

### Recovery ladder

1. Retry with bounded backoff.
2. Use Bright Data's semantic scrape or browser route instead of a brittle selector path.
3. Run the versioned Scraper Studio collector.
4. Regenerate or repair the collector against the changed page.
5. Validate against schema and semantic invariants.
6. Compare with the official/CPSC MCP result.
7. Continue only if evidence is sufficient; otherwise stop and ask a human.

The demo must expose the failed validation and repaired result. Hiding the failure loses the main Bright Data story.

## Entity matching and action policy

| Match class | Example | Confidence | Autonomous next step | Write eligible |
|---|---|---:|---|---|
| Exact UPC/SKU/model | Recalled model equals catalog model after canonical normalization | High | Calculate exposure | Yes, after human approval |
| Explicit family scope | Official source states all products in a narrowly defined product family | High with source quote/hash | Calculate and flag family rule | Yes, after human approval |
| Model plus brand alias | Exact normalized model with verified manufacturer alias | Medium-high | Show alias evidence | Yes only after human approval |
| Fuzzy model/name | Similar title or edit distance only | Medium/low | Manual review | No |
| Marketplace text only | Seller page claims a match without official corroboration | Low | Evidence lead only | No |
| Conflicting sources | Official and public listing disagree | Unknown | Stop and escalate | No |

Normalization and matching must run in code. RapidFuzz may rank review candidates, but fuzzy similarity cannot authorize a write.

## Approval experience

The approval panel must appear before the mutation call and contain:

- proposed operation and target records
- exact before/after values
- reason and policy rule
- official-source evidence
- live web evidence
- confidence and unresolved uncertainty
- calculated affected units/customers/value
- reversible or irreversible label
- rollback command
- idempotency key
- Approve, Reject, and Edit scope controls

After execution, replace the proposal with a receipt containing tool name, request hash, returned record IDs, execution timestamp, actor/approver, and rollback status.

## UI that can win Best UI

Use a command-center layout rather than a generic chat box:

### Left rail — Cases

- Active, awaiting approval, contained, and needs-review cases.
- Recall title, severity, jurisdiction, last checked, and change badge.

### Center — Evidence and work

- Recall version diff at the top.
- Four worker lanes with queued, running, waiting, failed, and complete states.
- Evidence cards with source, freshness, confidence, and extracted identifiers.
- Catalog match table with exact/family/fuzzy labels.
- Sandbox impact card with a link to the computation artifact.

### Right rail — Human control

- Persistent pending-approval card.
- Exact action diff and rollback.
- Reject or edit scope without losing the session.
- No approval buried in chat history.

### Bottom drawer — Audit

- Chronological trace of tools, workers, recovery attempts, approval decisions, and receipts.
- Technical detail is collapsible; the default view remains understandable to a non-developer.

Accessibility minimums: complete keyboard operation, visible focus, semantic status text beyond color, adequate contrast, reduced-motion support, and screen-reader labels for all approval controls.

## Track-by-track 10/10 evidence map

| Track | What judges need to believe | Evidence we will show | Failure that loses the track |
|---|---|---|---|
| Best Use of Agent Harness | The harness is doing real coordinated work | Four distinct subagents, MCP tools, sandbox computation, reconnect persistence, policy selectors, pre-action approval, receipts | A single prompt calling one API |
| Best Code Quality | Another developer can safely extend it | Typed boundaries, tests, clear architecture, threat model, public Qodo-reviewed PRs, exact README evidence section | Direct-to-main code or screenshot-only Qodo proof |
| Best Bright Data | Fresh changing-web data drives the agent and survives drift | Versioned collector, provenance, real structured data, failed validation, repair/fallback, downstream match change | One hardcoded parser or decorative search results |
| Best UI | A stranger understands and controls the agent | Case navigation, worker state, evidence, uncertainty, approval before mutation, audit receipts | Chat-only UI or approval after action |
| Best Blog | The build teaches something candid and useful | Problem, architecture, API failure, drift recovery, safety tradeoffs, Qodo changes, lessons | Marketing copy without failure detail |

## Open-source leverage

Use permissively licensed components with explicit attribution:

| Project | License | Use |
|---|---|---|
| TrueForge | MIT | Agent runtime, sessions, approvals, subagents, sandbox integration, UI SDK |
| TrueForge agent-cookbook examples | MIT repository context | Agent-spec patterns, dynamic subagents, approval selectors, custom MCP pattern |
| Bright Data MCP | MIT | Search, scrape, structured extraction, and browser fallback |
| Bright Data skills / Scraper Studio | MIT | Versioned collector creation, execution, polling, recovery pattern |
| CPSC Recalls MCP Server by cyanheads | Apache-2.0 | Fast CPSC discovery adapter or reference implementation |
| RapidFuzz | MIT | Candidate ranking for manual review only |
| AgentPrism | MIT, alpha | Visual trace inspiration only; do not make an alpha dependency critical to the demo |

Rules for reuse:

1. Keep upstream notices and license files.
2. List exact repositories and purposes in ATTRIBUTIONS.md.
3. Do not claim upstream work as ours.
4. Prefer the official TrueForge UI SDK for the critical UI path.
5. Avoid copying an entire example unchanged; adapt the pattern to the recall domain and document our additions.
6. Pin versions or commit SHAs needed for a reproducible judging build.

## Repository contract

    REVOKE/
      README.md
      LICENSE
      ATTRIBUTIONS.md
      CODEX.md
      package.json
      agents/
        revoke.agent.json
      apps/
        console/
      services/
        commerce-mcp/
      skills/
        recall-containment/
          SKILL.md
      configs/
        scrapers/
      schemas/
      fixtures/
        catalog/
        recalls/
        drift/
      evals/
      tests/
      docs/
        architecture.md
        threat-model.md
        data-provenance.md
        demo-script.md
        judging-scorecard.md
        field-report.md

README required sections:

- One-sentence product outcome.
- Ninety-second quick start.
- Architecture.
- Live versus simulated data disclosure.
- Safety and approval model.
- Demo flow.
- Evaluation results.
- Qodo Code Review Evidence.
- Open-source attribution.
- Known limitations.

## Qodo workflow, with no shortcuts

1. Create the public repository with README, license, and attribution only.
2. Install the Qodo GitHub App before important implementation begins.
3. Protect main if time allows and prohibit force pushes.
4. Implement the vertical slice on a feature branch.
5. Open PR 1: agent orchestration, schemas, MCP boundary, matching, approvals, and tests.
6. Wait for Qodo review or invoke the documented agentic review command.
7. Fix every valid high-severity item and the important medium findings.
8. Reply to each dismissed/deferred finding with evidence and tradeoff.
9. Push corrections and obtain follow-up review.
10. Merge only after tests pass.
11. Open PR 2: command-center UI, drift recovery, demo fixtures, accessibility, and docs.
12. Repeat review, disposition, follow-up, and merge.
13. Add the exact README heading Qodo Code Review Evidence with:
    - a public link to the representative merged PR
    - one or two lines explaining what Qodo found
    - what we changed or why a finding was dismissed
14. Test the PR link in a logged-out browser.

Screenshots may supplement the proof but never replace the public PR.

## Test and evaluation matrix

| Test | Expected result |
|---|---|
| Exact recalled model exists in catalog | High-confidence match and approval-eligible proposal |
| Only fuzzy title is similar | Manual-review row; no write proposal |
| Official source cannot be verified | Case blocks before impact/action |
| Retrieved page contains prompt-injection text | Text remains evidence only; no policy/tool change |
| API fails and official page is available | Bright Data fallback yields validated structured evidence |
| Page layout drifts | Validator fails, repair/fallback runs, result revalidates |
| Repair yields incomplete identifiers | Human escalation; no action |
| Two subagents disagree | Disagreement visible and action blocked |
| Approval rejected | Zero commerce mutation; rejection audited |
| Approval edited to two of three SKUs | Only selected targets mutate |
| Approval request replayed | Idempotency prevents duplicate mutation |
| Browser refresh during turn | Same session and progress resume |
| Tool stream disconnects | Reconnect continues after the last sequence event |
| Sandbox arithmetic checked against fixture oracle | Exact unit/order/customer/value totals match |
| Mutation tool fails halfway | Partial results visible; retry only pending idempotent operations |
| Customer notice action in judge mode | Draft/test sink only |
| Keyboard-only operation | Full case and approval flow is operable |

Minimum evaluation report:

- Recall normalization accuracy.
- Exact-identifier precision and recall on fixtures.
- Fuzzy-review false-positive rate.
- Drift detection and recovery success.
- Approval bypass attempts: zero successful.
- Duplicate action attempts: zero duplicate effects.
- Session reconnect completion rate.
- End-to-end deterministic demo pass rate.

## Security and trust boundaries

Primary assets: merchant catalog, order/customer fixture data, approval authority, connector secrets, action integrity, and evidence provenance.

Primary risks and controls:

- Prompt injection from public pages: isolate as untrusted data, schema-constrain output, prohibit policy/tool selection from retrieved text.
- False product match: exact identifiers and authoritative corroboration; fuzzy-only manual review.
- Tool overreach: least-privilege MCP methods and approval selectors for every write/destructive tool.
- Duplicate execution: idempotency keys and receipt lookup before mutation.
- Secret leakage: server-side connector configuration, trace redaction, no secrets in browser or fixtures.
- Fabricated evidence: source URLs, timestamps, hashes, and independent verification.
- Compromised third-party MCP: pinned versions, narrow methods, timeouts, schema checks, and provenance.
- Partial failure: explicit partial-state receipt, safe retry, and rollback.

## Six-hour execution order

Use countdowns from the hard deadline rather than trusting wall-clock estimates.

### T-6:00 to T-5:30 — Eligibility first

- Confirm team and public GitHub owner.
- Create public repository.
- Add license and attribution.
- Install Qodo GitHub App.
- Obtain Bright Data credential.
- Configure TrueForge model and isolated sandbox provider.
- Locate and inspect the official submission form.

Exit criterion: public repository and required accounts are operational.

### T-5:30 to T-4:30 — Thin vertical slice

- Start TrueForge.
- Import or create the orchestrator agent.
- Connect CPSC/Bright Data.
- Implement the simulated commerce MCP.
- Run one recall through read, code execution, approval, and one approved mutation.

Exit criterion: ugly but complete end-to-end act.

### T-4:30 to T-3:20 — Harness depth

- Add specialist schemas and subagents.
- Add persistent case snapshot/diff.
- Add real sandbox artifact.
- Add exact matching, ambiguous review, and idempotency.
- Prove refresh/reconnect.

Exit criterion: every DGX judging feature is visible in one trace.

### T-3:20 to T-2:20 — UI and Bright Data

- Build the three-pane command center.
- Add worker states, evidence, match table, approval, and audit.
- Add the versioned scraper assets and drift validation/recovery.
- Rehearse live and fixture paths.

Exit criterion: a stranger can complete the scenario and see drift recovery.

### T-2:20 to T-1:20 — Qodo and reliability

- Open the representative feature PR.
- Run tests and Qodo review.
- Fix/disposition findings.
- Obtain follow-up review and merge.
- Verify README evidence link logged out.

Exit criterion: public review trail is undeniable.

### T-1:20 to T-0:30 — Story and submission

- Record the 150-second demo with backup local copy.
- Finish README and field report.
- Fill all track entries.
- Capture repository, deployment, PR, blog, and video URLs.
- Create one concise social clip/post.

Exit criterion: submission can be sent even if all development stops.

### T-0:30 to deadline — Buffer only

- Submit early.
- Open every submitted URL in a logged-out browser.
- Preserve a deterministic demo fallback.
- Fix only submission blockers or catastrophic demo failures.

No new features in the final thirty minutes.

## Scope cuts if behind

Cut these first:

- Real Shopify, Amazon, or marketplace write integrations.
- Multi-tenant authentication.
- Real outbound email/SMS.
- Mobile layout polish.
- More than one polished recall scenario.
- Complex charts.
- Autonomous collector regeneration if semantic fallback already proves recovery.

Never cut:

- Complete act-before/after flow.
- Pre-action approval.
- Sandbox computation.
- Persistent session proof.
- At least three real specialist workers.
- Bright Data in the downstream decision.
- Drift failure plus recovery.
- Qodo public PR evidence.
- Honest live/simulated labels.
- Public open-source repository and reproducible setup.

## Field-report angle

Title:

> The recall API failed. The agent did not: building a human-approved stop-sale command center in one day

Structure:

1. A recall expansion is a version-control problem with human consequences.
2. Why a chat answer is insufficient.
3. Modeling one safety incident as a persistent TrueForge session.
4. Four bounded subagents and why their contexts stay separate.
5. Turning web pages into typed evidence with Bright Data.
6. What happened when the source/API or schema failed.
7. Why exact identifiers beat confident language.
8. Approval before quarantine, not apology after it.
9. What Qodo found and what changed.
10. What remains simulated and what production hardening requires.

The candid boundary between live recall evidence and simulated commerce state is a strength, not something to hide.

## Judge-facing pitch

### Ten seconds

REVOKE turns a newly expanded safety recall into a verified, human-approved stop-sale plan before another affected product ships.

### Thirty seconds

Most recall tools send an alert. REVOKE runs the containment operation. TrueForge keeps a durable case, dispatches independent evidence, catalog, web, and impact workers, executes the catalog/order reconciliation in a sandbox, and pauses before changing inventory. Bright Data keeps the evidence pipeline alive when an API or page structure fails. The judge sees exactly what changed, why, what the agent is waiting for, and a receipt for every approved action.

### Why TrueForge

Remove the harness and the product loses its durable case memory, isolated computation, bounded specialist workers, observable event stream, and policy-enforced approval boundary. It would become a risky one-shot script.

### Why Bright Data

Recall scope and public listings live on changing websites. Bright Data makes that evidence fresh, structured, recoverable, and consequential to the containment decision.

## Submission gate

Do not submit until each statement is true:

- [ ] The repository is public and licensed.
- [ ] The app can be started from the README.
- [ ] Live recall data and simulated commerce data are explicitly labeled.
- [ ] The primary demo completes from case resume to approved mutation.
- [ ] At least three specialist subagents have distinct, visible outputs.
- [ ] Sandbox code produces a downloadable/reviewable calculation artifact.
- [ ] Refresh/reconnect resumes the same session.
- [ ] One ambiguous match is safely blocked.
- [ ] One approval rejection causes zero mutation.
- [ ] One approved operation returns an idempotent receipt.
- [ ] Bright Data produces fresh structured data used by the app.
- [ ] Drift is detected and recovery is demonstrated.
- [ ] Qodo is installed and important work came through PRs.
- [ ] The exact README heading Qodo Code Review Evidence exists.
- [ ] The linked PR is public and shows review, response, fixes, and follow-up.
- [ ] Tests pass from a clean clone.
- [ ] The deterministic demo fallback is labeled and rehearsed.
- [ ] Demo video, repository, deployment, PR, and blog links open logged out.
- [ ] Submission is sent before August 29 at 6:00 PM Pacific.

## External blockers requiring owner action

These cannot be truthfully marked complete from a local strategy document:

1. Choose the GitHub owner and authorize creation of the public repository.
2. Install/authorize the Qodo GitHub App on that repository.
3. Provide or configure a Bright Data API token.
4. Provide or configure the isolated sandbox provider expected for judging, such as Daytona if following the guide.
5. Confirm the current submission form and submit the entry.
6. Complete the manual TrueForge star/drawing-entry and social/account actions if entering those considerations.

The local GitHub CLI currently sees a stale process-level GitHub token that overrides an otherwise configured account. Any GitHub operation must remove only that process-local environment variable before relying on the secure credential-store login. Never print or persist the token.

## Sources

Organizer and harness:

- [Agent Harness Hackathon event page](https://luma.com/agent-harness)
- [TrueForge repository](https://github.com/truefoundry/trueforge)
- [TrueForge example-agent cookbook](https://github.com/truefoundry/trueforge/tree/examples/agent-cookbook/examples)
- [TrueForge agent creation overview](https://trueforge.dev/create-agent/overview)
- [TrueForge harness capabilities](https://trueforge.dev/key-features/overview)
- [TrueForge UI SDK](https://trueforge.dev/chat-ui)
- [TrueForge SDK concepts](https://trueforge.dev/api/overview)

Data and open-source components:

- [Bright Data MCP](https://github.com/brightdata/brightdata-mcp)
- [Bright Data agent skills](https://github.com/brightdata/skills)
- [Bright Data Scraper Studio Python template](https://github.com/brightdata/bright-data-scraper-studio-python-project)
- [CPSC Recall API information](https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information)
- [CPSC recall search](https://www.cpsc.gov/Recalls)
- [Cuisinart July 2026 initial recall](https://www.cpsc.gov/Recalls/2026/Conair-Recalls-Over-One-Million-Cuisinart-Grill-Brushes-Due-to-Ingestion-Hazard)
- [Cuisinart August 2026 expanded recall](https://www.cpsc.gov/Recalls/2026/Conair-Expands-Recall-of-Cuisinart-Grill-Brushes-Due-to-Ingestion-Hazard-Over-3-6-Million-Brushes-Now-Recalled)
- [CPSC Recalls MCP Server](https://github.com/cyanheads/cpsc-recalls-mcp-server)
- [RapidFuzz](https://github.com/rapidfuzz/RapidFuzz)
- [AgentPrism](https://github.com/evilmartians/agent-prism)

## Final decision

Build REVOKE. Target the DGX track first, design every feature so it also produces evidence for Bright Data, UI, Code Quality, and Blog, and protect the core scenario from scope creep. The winning unit is not the number of features; it is one undeniable, resilient, human-controlled containment operation that only a real agent harness could perform.
