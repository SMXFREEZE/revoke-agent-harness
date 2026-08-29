# Approval and recovery contract

The preview is immutable evidence of intent. It must include the proposal ID,
idempotency key, recall number, target SKUs, and each before/after state.

Immediately before asking for approval, show:

- exact proposal and recall identifiers;
- number of SKUs and inventory units to quarantine;
- affected simulated orders and customers;
- every before/after field;
- that execution is simulated and reversible;
- that customer notices are not part of this approval.

Approval is valid only for the proposal displayed in the same flow. On stale
state, reconnect, changed targets, or a different idempotency key, discard the
approval and generate a new preview.

After execution, require a tool receipt. Surface replay status and audit event.
Rollback requires a separate approval and the original receipt ID. Notice
drafting also requires separate approval and must use the test sink.
