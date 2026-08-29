# Sponsor-backed golden run evidence

- Run date: 2026-08-29
- Case: synthetic, non-identifiable `GGG-0042`

This record distinguishes implemented policy, observed execution, and remaining
human authority. It contains no credentials and makes no clinical claim.

## Observed TrueForge execution

- Session: `01m17kj6cy2prqvxret528beb4`
- Initial turn: `01m17kj6n3gc07zeb64pr1zq7t.local`
- Persistent continuation: `01m17mdwmm8anerg9sjf6bkp85.local`
- Approval-gate test: `01m17w1vbhhjjrkvwzkgrtkb6w.local`
- Denial resume: `01m17w6khmppqk9w6cfvwv77wx.local`
- Pending human checkpoint: `01m17w7fnhh8meqvxz5pawxswq.local`
- Model provider: OpenAI through TrueForge
- Sandbox provider: Daytona
- MCP connectors: Bright Data and `gaggle-lab`

The initial turn produced 155 TrueForge events: one Daytona sandbox creation,
five bounded specialist threads, 84 tool responses, three independent Bright
Data searches, 20 Bright Data page extractions, and three canonical synthetic
case reads. It reached the configured ten-minute server limit after recording
the source-health failure, repair, revalidation, canonical evidence, and initial
ranking. The next turn chained to the same session and sandbox instead of
pretending the timeout was success or restarting the investigation.

The continuation completed the deterministic revision, blind Red Team, five
independent jurors, disagreement analysis, and immutable proposal preview. It
recorded 71 persisted TrueForge events. Across all six chained turns, the
verified session contains 247 events: 12 created-and-completed subagent
threads, 112 tool responses, one Daytona sandbox, two native approval
checkpoints, and the timeout-to-resume history. The lab's append-only
investigation ledger has hash:

`sha256:ecbfa5b3abafeb71ee140d35a08d6a552e6ff5f9c4c3b64384227fc4c6cbb906`

## Reproducible belief revision

- Locked scoring code:
  `sha256:4be4181ae2796ced246a88e7b0ce79f14fc0b1cc6682ad9f461074213ed8f9f1`
- Initial output, Candidate A > B > C:
  `sha256:eb8cf838796a24534c070f2b6e961bd146668ca942a2431e43152090e71ec92e`
- Revised input:
  `sha256:3d8d2b35719ab34db635a44be9c6d2ab8d67807c291ea5dd2c99b1160d8afb8f`
- Revised output, Candidate B > C > A:
  `sha256:20ba231997ae9590fb3992e726405b192afda3041dba370d9877be73638541cd`
- Revised leave-one-feature-out order retention: `6/6`

These values are deterministic prototype diagnostics, not clinical
probabilities or biological validation.

## Human boundary

`preview_experimental_proposal` returned:

- proposal id: `gaggle-proposal-0042`
- proposal hash:
  `sha256:fa33575d844316a3df6ab77ad8814ae1fdd11eab99291db1a1799ae70d525a8b`
- status: `scientist_approval_required`
- mutation performed: `false`

TrueForge intercepted one exact promotion attempt as
`tool.approval_required` before the tool executed. That checkpoint was denied;
a direct read of the lab audit still contained only `proposal_previewed`,
proving the denial produced zero promotion mutation. A second exact promotion
attempt is now paused as a native TrueForge required action for a human
scientist. No scientist approval was supplied and
`promote_experimental_proposal` has not executed. The agent manifest also
lists the controlled write under `require_approval_for_tools`, so the runtime
event, policy, immutable payload, denial, and pending boundary are independently
inspectable without claiming approval.
