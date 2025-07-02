import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { getNFTProvenance } from "../sei-mcp-server/src/index.js";
const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get("/nft/provenance", async (req, res) => {
  const contractAddress = req.query.contractAddress;
  const tokenId = req.query.tokenId;

  try {
    // Call your actual MCP function here
    const result = await getNFTProvenance(contractAddress, tokenId);
    res.json(result);
  } catch (error) {
    console.error("Error fetching provenance:", error);
    res.status(500).json({ error: "Failed to fetch provenance" });
  }
});

app.listen(port, () => {
  console.log(`🚀 HTTP MCP Server running at http://localhost:${port}`);
});
