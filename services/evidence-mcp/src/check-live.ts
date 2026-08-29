import { buildRecallExpansion } from "@revoke/domain";
import { loadRecallFixture } from "./fixtures.js";
import { fetchVerifiedRecall } from "./live.js";

const [previousFixture, currentFixture] = await Promise.all([
  loadRecallFixture("26-601"),
  loadRecallFixture("26-717"),
]);
const [previous, current] = await Promise.all([
  fetchVerifiedRecall(previousFixture),
  fetchVerifiedRecall(currentFixture),
]);
const expansion = buildRecallExpansion(previous.snapshot, current.snapshot);

console.log(
  JSON.stringify({
    status: "ok",
    provider: "U.S. Consumer Product Safety Commission",
    mode: "live",
    recalls: [
      {
        recallNumber: previous.snapshot.recallNumber,
        sha256: previous.snapshot.evidence[0]?.contentHash,
        documentBytes: previous.validation.documentBytes,
      },
      {
        recallNumber: current.snapshot.recallNumber,
        sha256: current.snapshot.evidence[0]?.contentHash,
        documentBytes: current.validation.documentBytes,
      },
    ],
    addedIdentifierCount: expansion.addedIdentifiers.length,
    familyScopeAdded: expansion.familyScopeAdded,
  }),
);
