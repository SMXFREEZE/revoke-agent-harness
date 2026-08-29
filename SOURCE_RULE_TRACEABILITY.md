# Source-rule traceability

This ledger separates organizer statements from our own strategy. It is the audit trail for HARD_RULES_AND_WIN_PLAN.md and CODEX.md.

## Source labels

- Guide: Getting Started Guide For The Agent Harness Hackathon — WeMakeDevs, 21-page PDF captured August 29, 2026.
- Luma: Agent Harness Hackathon — Win an NVIDIA DGX Spark AI Supercomputer, 8-page PDF captured August 29, 2026.
- Current page: the live event page at https://luma.com/agent-harness, checked August 29, 2026.

Organizer language is paraphrased here to avoid confusing it with our implementation rules. Page numbers refer to the supplied PDFs, not a browser's scroll position.

## Authority and conflict policy

| Question | Source evidence | Our binding interpretation |
|---|---|---|
| When does the overall guide say the hackathon runs? | Guide pages 1–2: August 24–30 | Context only |
| When is the project due at the in-person event? | Luma page 2: 18:00 project submission deadline; Luma page 6 live blast: until 6 PM | Submit by August 29 at 6:00 PM Pacific |
| What if those dates appear inconsistent? | The event-specific page is newer and stricter | The stricter event deadline governs unless an organizer explicitly says otherwise |
| What is the product bar? | Guide pages 2–3 and 6; Luma page 2 | A working agent must perform work through tools/code/actions; a chat answer is insufficient |

## Eligibility and submission facts

| ID | Category | Organizer statement | Source | Binding project rule |
|---|---|---|---|---|
| S01 | Deadline | Project submission is due at 18:00 on event day | Luma page 2; Luma page 6 | Submit before August 29, 6:00 PM Pacific |
| S02 | Team | Teams may have one to four people | Luma page 6 | Team list must contain at most four entrants |
| S03 | Repository | The repository needs to be open source | Luma page 6 | Public repository, OSI-style license, reproducible setup, and attributions |
| S04 | Track entry | A team can win one track but may apply to multiple tracks | Luma page 2 | Enter all five product/content tracks and declare Agent Harness/DGX primary |
| S05 | Domain | Any field is allowed | Luma page 2 | Recall containment is eligible |
| S06 | Deliverable | Build a working AI agent in a day | Luma page 2 | Recorded and live end-to-end run must work |
| S07 | Action bar | An agent acts: examples include PR, database query, script, or message | Luma page 2 | Our agent must run code and execute an approved simulated containment mutation |

## TrueForge and Agent Harness requirements

| ID | Category | Organizer statement | Source | Binding project evidence |
|---|---|---|---|---|
| T01 | Challenge | Build a useful agent with TrueForge | Guide page 2 | TrueForge is the orchestrating runtime, not an incidental dependency |
| T02 | Product bar | Do not build another chat interface around an LLM | Guide page 2 | Command center is case/action-centric; chat is secondary |
| T03 | External work | Retrieve information from external tools, APIs, or data sources | Guide pages 2–3 | CPSC and Bright Data results appear in the trace and evidence model |
| T04 | Code | Execute generated code safely | Guide pages 2–3 and 10; Luma page 3 | Entity diff and impact join run in isolated sandbox |
| T05 | Data | Process files or data | Guide page 3 | Normalize recall/catalog records and produce a calculation artifact |
| T06 | Delegation | Delegate task parts to other agents | Guide page 3; Luma page 3 | At least three distinct typed specialist workers |
| T07 | Context | Carry context across sessions | Guide page 3 and 6; Luma page 3 | July case persists and resumes for the August expansion |
| T08 | Human control | Stop and ask a human before an important or sensitive action | Guide page 3 and 6; Luma page 3 | Consequential commerce tools are approval gated before invocation |
| T09 | MCP | Use MCP tools to connect real tools/data | Guide pages 3, 6, and 9; Luma page 3 | CPSC/Bright Data/commerce MCP calls are visible in the live run |
| T10 | Skills | Skills are reusable git-backed instruction packs | Guide page 9 | Versioned recall-containment skill and CODEX.md policy |
| T11 | Sandbox | TrueForge supports isolated execution through a sandbox provider | Guide page 10 | Configure the available supported provider and preserve trace evidence |
| T12 | Subagents | Dynamic subagents can perform parallel/specialist work | Guide page 11; Luma page 3 | Authority, catalog, web-evidence, and impact roles |
| T13 | Reusability | Save the configured agent for reuse | Guide page 11 | Agent specification is version controlled and importable |
| T14 | Reconnect | Sessions survive refresh/restart/reconnect | Luma page 3 | Refresh browser during recorded demo, then continue the same run |
| T15 | Primary prize | Best Use judges value real MCP, sandbox, approvals, subagents, persistence, and other harness capabilities | Guide page 17 | All five named capabilities must be undeniable in one golden trace |
| T16 | Thin-wrapper warning | Harness must do the work, not sit below a thin wrapper | Luma page 2 | No custom orchestration that bypasses TrueForge for the core flow |
| T17 | Local safety guidance | Keep local TrueForge on localhost rather than exposing local mode directly | Guide page 8 | Do not publicly expose the local development instance |
| T18 | Model choice | Any supported provider may be used | Luma page 3 | Provider is an implementation choice, not a judging story |

## Qodo and code-quality requirements

| ID | Category | Organizer statement | Source | Binding project evidence |
|---|---|---|---|---|
| Q01 | Challenge | Use Qodo throughout development | Guide pages 2–4 | Install before important implementation and review all important PRs |
| Q02 | Setup | Install/authorize the Qodo GitHub App on the hackathon repository | Guide pages 14–15 | Owner must complete GitHub App installation |
| Q03 | Workflow | Important changes should use branches and PRs | Guide page 15 | No important direct-to-main code |
| Q04 | Disqualification risk | Direct pushes to main do not count as reviewed work | Guide page 15 | Public PR history is the source of truth |
| Q05 | Review trigger | Qodo should auto-review; agentic review command is the fallback | Guide page 15 | Verify review appears before merge |
| Q06 | High findings | Fix valid high-severity findings | Guide page 15 | Each valid high finding has a correction commit |
| Q07 | Dismissals | Explain incorrect, deferred, or expected findings in the Qodo thread | Guide page 15 | No unexplained dismissal or deferment |
| Q08 | Medium/low | Handle medium and low findings with engineering judgment | Guide page 16 | Resolve risk-bearing findings; explain meaningful deferrals |
| Q09 | Follow-up | Push fixes and obtain follow-up review | Guide page 16 | Representative PR shows initial review, response, fix, and second review |
| Q10 | README heading | Create a section called Qodo Code Review Evidence | Guide page 16 | Use that exact heading |
| Q11 | README content | Include at least one representative merged PR and one or two lines about findings/dispositions | Guide page 16 | Logged-out-accessible public PR link and concise summary |
| Q12 | Proof form | Public PR is required; screenshots cannot replace it | Guide page 16 | Screenshots are only supplemental |
| Q13 | Breadth | Judges may inspect other important merges | Guide page 16 | Qodo cannot be a one-time ceremonial PR |
| Q14 | Track bar | Build real software another developer can clone, understand, and extend | Guide page 17; Luma page 2 | Typed interfaces, tests, docs, one-command setup, and architecture |
| Q15 | Track requirement | Qodo is required for Best Code Quality | Guide page 17; Luma page 2 | Do not claim eligibility without the public review trail |

## Bright Data requirements and judging signals

These criteria apply to the Best Use of Bright Data track. We treat them as hard because the same pipeline strengthens the DGX demonstration.

| ID | Category | Organizer statement | Source | Binding project evidence |
|---|---|---|---|---|
| B01 | Track bar | Scrape live web data and keep it flowing when sites change | Luma page 2 | Live CPSC/web extraction plus deterministic drift/recovery |
| B02 | Workflow | Keep the data pipeline inside the agentic workflow, not beside it | Luma page 4 | Bright Data result flows into matching/confidence/action |
| B03 | Reuse | Scraper configuration should be reusable and version controlled | Luma page 4 | Collector manifest, schema, fixtures, and policy committed |
| B04 | Recovery | Detect and recover when the target site changes | Luma page 4 | Failed validator event followed by repair/fallback and revalidation |
| B05 | Freshness | Data should be fresh, structured, and actually used by the app | Luma page 4 | Fetch time, URL, collector version, content hash, and downstream decision |
| B06 | Anti-pattern | A hardcoded HTML parser is not a data pipeline | Luma page 4 | Semantic extraction/collector workflow, not fixed CSS selectors alone |
| B07 | Suggested setup | Run Scraper Studio from the terminal on one site end to end | Luma page 5 | Rehearse and document the end-to-end collector command |
| B08 | Project rule file | Store scraper settings in a project rules file so the coding assistant reuses them | Luma pages 4–5 | CODEX.md plus committed configs define the extraction contract |
| B09 | Chaos demonstration | Break a target/structure deliberately and show auto-repair | Luma page 5 | Repeatable drift fixture or toggle in the golden demo |
| B10 | Continuity | Do more than scrape once; show a pipeline that continues through change | Luma page 5 | Prior snapshot, new retrieval, failure, recovery, and successful downstream result |

## UI requirements and judging signals

| ID | Category | Organizer statement | Source | Binding project evidence |
|---|---|---|---|---|
| U01 | Usability | A stranger should be able to pick up and drive the agent | Luma page 3 | Clear case list, primary action, statuses, and approval controls |
| U02 | Visibility | Show what the agent is doing | Luma page 3 | Live worker lanes and current tool/activity |
| U03 | Waiting | Show what the agent is waiting on | Luma page 3 | Persistent approval/waiting state with reason |
| U04 | History | Show what the agent did | Luma page 3 | Evidence cards, computation artifact, audit timeline, and receipts |
| U05 | Timing | Ask before an irreversible step, not after | Luma page 3 | Approval event precedes the write-tool event in the trace |

## Blog and additional prize signals

| ID | Category | Organizer statement | Source | Binding project evidence |
|---|---|---|---|---|
| P01 | Blog | Explain what was built and how it was wired | Luma page 3; Guide page 18 | Architecture and implementation narrative |
| P02 | Blog | Explain what broke along the way | Luma page 3; Guide page 18 | Candid API/schema/drift failure evidence |
| P03 | Blog | Explain the problem, TrueForge's role, and lessons | Guide page 18 | Field report follows the prescribed narrative |
| P04 | Interview | Top projects can earn TrueFoundry interviews; no separate entry | Guide page 17 | No separate application work |
| P05 | Calling Card | Star TrueForge to enter the drawing | Guide page 18 | Manual account action, separate from project quality |
| P06 | Social | Share clips, surprises, bugs, or progress and tag WeMakeDevs and TrueFoundry | Guide page 18 | Truthful progress/demo post, without fabricated metrics |

## Derived requirements, clearly not organizer quotations

The following choices are ours:

- Product target: consumer-product recall containment.
- Working name: REVOKE.
- Primary story: July-to-August 2026 Cuisinart wire grill-brush recall expansion.
- Specialist roles: authority verifier, catalog matcher, web-evidence watcher, and impact analyst.
- Simulated merchant environment for safe, repeatable mutations.
- Exact-identifier action policy and fuzzy-only manual review.
- Append-only receipts and idempotency.
- Three-pane command-center UI.
- Prompt-injection boundary for scraped text.
- Deterministic replay and drift fixtures.
- The weighted candidate score and six-hour execution sequence.

They are hard internal rules because they transform broad judging criteria into observable proof, but they should never be attributed to the organizers.

## Final audit question

For every feature, ask:

> Which source rule does this satisfy, what live artifact proves it, and can a logged-out judge verify that proof?

If no clear answer exists, the feature is either incomplete or scope creep.
