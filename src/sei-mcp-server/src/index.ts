import express from "express";
import axios from "axios";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { config } from "dotenv";

config(); // ✅ Load .env variables

/**
 * Starts and returns a new MCP EVM Server instance with Express app.
 */
export async function startServer() {
  const app = express();
  app.use(express.json());

  // ✅ Create MCP server instance
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

  // ✅ New /nft/provenance endpoint
  app.get("/nft/provenance", async (req, res) => {
    const { contractAddress, tokenId } = req.query;

    if (!contractAddress || !tokenId) {
      return res.status(400).json({ error: "contractAddress and tokenId are required" });
    }

    try {
      const apiKey = process.env.NFTSCAN_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "NFTSCAN_API_KEY not set in environment variables" });
      }

      const nftscanUrl = `https://sei.nftscan.com/api/v2/nft/provenance/${contractAddress}/${tokenId}`;

      const nftscanRes = await axios.get(nftscanUrl, {
        headers: {
          "X-API-KEY": apiKey,
        },
      });

      res.json({
        provenance: nftscanRes.data.data?.provenance || [],
        currentOwner: nftscanRes.data.data?.current_owner || {
          owner: "Unknown",
          balance: "0 SEI",
          otherNFTs: [],
        },
      });
    } catch (error) {
      console.error("Error fetching from NFTScan:", error);
      res.status(500).json({ error: "Failed to fetch provenance data" });
    }
  });

  // ✅ Attach Express app to server (optional)
  (server as any).app = app;

  return server;
}
