import { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Starts and returns a new MCP EVM Server instance.
 */
export async function startServer() {
  const server = new Server(
    { name: "MCP EVM Server", version: "1.0.0" },
    {
      capabilities: {
        sampling: {},
        logging: {},
        resources: { listChanged: true },
        tools: { listChanged: true },
        prompts: { listChanged: true },
        elicitation: {},
        roots: {},
      },
    }
  );

  // 👉 Here you can set up handlers if needed
  // e.g., server.setRequestHandler(...)

  return server;
}
