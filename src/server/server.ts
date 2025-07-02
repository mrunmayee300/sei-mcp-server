import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { startServer } from "../sei-mcp-server/src/index.js"; // ✅ Correct relative path in TypeScript source

async function main() {
  try {
    const server = await startServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("EVM MCP Server running on stdio");
  } catch (error) {
    console.error("Error starting MCP server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
