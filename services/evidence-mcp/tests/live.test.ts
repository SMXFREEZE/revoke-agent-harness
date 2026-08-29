import { describe, expect, it } from "vitest";
import { loadRecallFixture } from "../src/fixtures.js";
import { fetchVerifiedRecall, verifyRecallDocument } from "../src/live.js";

function fixtureHtml(fixture: Awaited<ReturnType<typeof loadRecallFixture>>): string {
  const family =
    fixture.familyScope === null
      ? ""
      : "All Cuisinart wire bristle grill brushes are included in the recall.";
  return `<!doctype html><html><body>
    <h1>${fixture.title}</h1>
    <p>Recall number: ${fixture.recallNumber}</p>
    <p>${fixture.publicationDate === "2026-07-02" ? "July 2, 2026" : "August 27, 2026"}</p>
    <p>${fixture.units.toLocaleString("en-US")} Cuisinart wire bristle units</p>
    <p>Wire bristle ingestion hazard. Consumers can receive a refund.</p>
    <p>${fixture.identifiers.map((item) => item.value).join(" ")}</p>
    <p>${family}</p>
    <p>${"Public recall verification content. ".repeat(40)}</p>
  </body></html>`;
}

describe("live recall verification", () => {
  it("validates every required expansion signal", async () => {
    const fixture = await loadRecallFixture("26-717");
    const signals = verifyRecallDocument(fixture, fixtureHtml(fixture));

    expect(signals).toMatchObject({
      title: true,
      recallNumber: true,
      publicationDate: true,
      units: true,
      manufacturer: true,
      hazard: true,
      remedy: true,
      familyScope: true,
    });
    expect(Object.values(signals.identifiers).every(Boolean)).toBe(true);
  });

  it("fails closed when a captured identifier disappears", async () => {
    const fixture = await loadRecallFixture("26-717");
    const incomplete = fixtureHtml(fixture).replace("FBH-51", "");

    await expect(
      fetchVerifiedRecall(
        fixture,
        () => Promise.resolve(new Response(incomplete, { status: 200 })),
      ),
    ).rejects.toThrow("identifier:FBH-51");
  });
});
