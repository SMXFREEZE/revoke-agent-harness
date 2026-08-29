import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { URL } from "node:url";

const RECALL_QUERY = "Cuisinart grill brush recall 26-717 August 27 2026";
const MANUFACTURER_URL = "https://www.cuisinart.com/support/safety-recalls.html";
const token = process.env.BRIGHTDATA_API_KEY ?? process.env.BRIGHT_DATA_API;
const useRemoteTransport = process.argv.includes("--remote-header");

if (!token) {
  console.error("Bright Data credential is not available in the current process.");
  process.exitCode = 2;
} else {
  const childEnvironment = {
    ...process.env,
    API_TOKEN: token,
    PRO_MODE: "false",
    RATE_LIMIT: "20/1h",
    TOOLS: "search_engine,scrape_as_markdown",
  };
  delete childEnvironment.BRIGHT_DATA_API;
  delete childEnvironment.BRIGHTDATA_API_KEY;

  const transport = useRemoteTransport
    ? new StreamableHTTPClientTransport(
        new URL(
          "https://mcp.brightdata.com/mcp?tools=search_engine,scrape_as_markdown",
        ),
        { requestInit: { headers: { authorization: `Bearer ${token}` } } },
      )
    : new StdioClientTransport({
        command: process.platform === "win32" ? "npx.cmd" : "npx",
        args: ["-y", "@brightdata/mcp@2.11.1"],
        env: childEnvironment,
        stderr: "pipe",
      });
  const client = new Client({ name: "revoke-bright-data-check", version: "0.1.0" });

  try {
    await client.connect(transport);
    const available = await client.listTools();
    const names = available.tools.map((tool) => tool.name).sort();
    const scrapeTool = available.tools.find((tool) => tool.name === "scrape_as_markdown");
    const searchTool = available.tools.find((tool) => tool.name === "search_engine");

    if (!scrapeTool || !searchTool) {
      throw new Error("Required Bright Data search/scrape tools were not published.");
    }

    const searchResult = CallToolResultSchema.parse(
      await client.callTool({
        name: searchTool.name,
        arguments: { query: RECALL_QUERY, engine: "google" },
      }),
    );
    const scrapeResult = CallToolResultSchema.parse(
      await client.callTool({
        name: scrapeTool.name,
        arguments: { url: MANUFACTURER_URL },
      }),
    );

    if (searchResult.isError === true || scrapeResult.isError === true) {
      throw new Error("A required Bright Data tool returned an MCP error result.");
    }

    const resultText = (result) => {
      const parts = result.content
        .filter((content) => content.type === "text")
        .map((content) => content.text);
      if (result.structuredContent !== undefined) {
        parts.push(JSON.stringify(result.structuredContent));
      }
      return parts.join("\n");
    };
    const searchText = resultText(searchResult);
    const scrapeText = resultText(scrapeResult);
    const discoveryVerified =
      searchText.toLowerCase().includes("cuisinart") &&
      searchText.toLowerCase().includes("cpsc.gov");
    const manufacturerPageVerified =
      scrapeText.toLowerCase().includes("grill") &&
      scrapeText.toLowerCase().includes("recall");

    if (!discoveryVerified || !manufacturerPageVerified) {
      throw new Error(
        "Bright Data returned successfully, but required recall evidence was not verified.",
      );
    }

    console.log(
      JSON.stringify({
        status: "ok",
        provider: "bright-data-mcp",
        transport: useRemoteTransport ? "streamable-http-header" : "stdio",
        serverVersion: "2.11.1",
        requiredTools: [searchTool.name, scrapeTool.name],
        publishedToolCount: names.length,
        discoveryVerified,
        manufacturerPageVerified,
        searchResponseCharacters: searchText.length,
        scrapeResponseCharacters: scrapeText.length,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Bright Data MCP error";
    console.error(message.replaceAll(token, "[REDACTED_SECRET]"));
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => undefined);
  }
}
