import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadDemoFixtures } from "../src/fixtures.js";
import { CommerceStore } from "../src/store.js";

describe("commerce MCP HTTP service", () => {
  it("exposes a truthful health response", async () => {
    const fixtures = await loadDemoFixtures();
    const app = createApp(
      new CommerceStore(
        fixtures.catalog,
        fixtures.orders,
        fixtures.actionableTargetsByRecall,
        "test-only-approval-secret-with-at-least-32-bytes",
      ),
    );

    const response = await request(app).get("/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "revoke-commerce-mcp",
      environment: "simulated",
    });
  });
});
