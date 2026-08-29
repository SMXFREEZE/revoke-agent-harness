import { readFile } from "node:fs/promises";
import { z } from "zod";

const CandidateSchema = z.object({ id: z.string().min(1) }).passthrough();

const FixtureSchema = z
  .object({
    caseId: z.string().min(1),
    mode: z.literal("synthetic-rd-prototype"),
    objective: z.string().min(1),
    initialCandidates: z.array(CandidateSchema).min(1),
    approval: z.object({
      proposalId: z.string().min(1),
      proposalHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
      candidateIds: z.array(z.string().min(1)).min(1),
      status: z.literal("scientist_approval_required"),
    }),
  })
  .passthrough();

export type GaggleFixture = z.infer<typeof FixtureSchema>;

export async function loadGaggleFixture(): Promise<GaggleFixture> {
  const fixtureUrl = new URL("../../../fixtures/gaggle/case-0042.json", import.meta.url);
  return FixtureSchema.parse(JSON.parse(await readFile(fixtureUrl, "utf8")));
}
