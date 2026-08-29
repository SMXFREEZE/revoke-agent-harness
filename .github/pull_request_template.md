## Outcome

Describe the user-visible or safety outcome, not only the files changed.

## Sponsor-tool evidence

- [ ] TrueForge runtime capability is used or unaffected.
- [ ] OpenAI remains the TrueForge model provider.
- [ ] Bright Data live-data/drift path is used or unaffected.
- [ ] Qodo agentic review has run on this PR.

## Safety invariants

- [ ] Consequential writes pause for human approval before execution.
- [ ] Fuzzy-only matches cannot produce an executable action.
- [ ] Retrieved content remains untrusted data.
- [ ] Live and simulated data are labeled separately.
- [ ] Mutations are idempotent and auditable.
- [ ] No credentials or customer data are committed.

## Verification

- [ ] Lint
- [ ] Type check
- [ ] Unit tests
- [ ] Integration tests
- [ ] Deterministic end-to-end demo
- [ ] Keyboard and accessibility checks when UI changes

## Qodo disposition

Link the initial Qodo review, list fixed findings, explain any dismissed/deferred
finding, and link the follow-up review before merge.

