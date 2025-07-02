import { config } from "dotenv";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { startServer } from "../sei-mcp-server/src/index.js";
import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Load environment variables if needed
config();

// Environment variables — can also be set via .env file
const PORT = 3001;
const HOST = '0.0.0.0';

console.error(`Configured to listen on ${HOST}:${PORT}`);

// Setup Express
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Type', 'Access-Control-Allow-Origin']
}));

app.options('*', cors());

// Keep track of active connections with session IDs
const connections = new Map<string, SSEServerTransport>();

// Initialize the server
let server: Server | null = null;
startServer().then(s => {
  server = s;
  console.error("MCP Server initialized successfully");
}).catch(error => {
  console.error("Failed to initialize server:", error);
  process.exit(1);
});

// SSE endpoint
app.get("/sse", (req, res) => {
  console.error(`Received SSE connection request from ${req.ip}`);
  console.error(`Query parameters: ${JSON.stringify(req.query)}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (!server) {
    console.error("Server not initialized yet, rejecting SSE connection");
    return res.status(503).send("Server not initialized");
  }

  const sessionId = generateSessionId();
  console.error(`Creating SSE session with ID: ${sessionId}`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    const transport = new SSEServerTransport("/messages", res);
    connections.set(sessionId, transport);

    req.on("close", () => {
      console.error(`SSE connection closed for session: ${sessionId}`);
      connections.delete(sessionId);
    });

    server.connect(transport).then(() => {
      console.error(`SSE connection established for session: ${sessionId}`);
      res.write(`data: ${JSON.stringify({ type: "session_init", sessionId })}\n\n`);
    }).catch((error: Error) => {
      console.error(`Error connecting transport to server: ${error}`);
      connections.delete(sessionId);
    });
  } catch (error) {
    console.error(`Error creating SSE transport: ${error}`);
    connections.delete(sessionId);
    res.status(500).send(`Internal server error: ${error}`);
  }
});

// Messages endpoint
app.post("/messages", (req, res) => {
  let sessionId = req.query.sessionId?.toString();

  if (!sessionId && connections.size === 1) {
    sessionId = Array.from(connections.keys())[0];
    console.error(`No sessionId provided, using the only active session: ${sessionId}`);
  }

  console.error(`Received message for sessionId ${sessionId}`);
  console.error(`Message body: ${JSON.stringify(req.body)}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (!server) {
    console.error("Server not initialized yet");
    return res.status(503).json({ error: "Server not initialized" });
  }

  if (!sessionId) {
    console.error("No session ID provided and multiple connections exist");
    return res.status(400).json({ 
      error: "No session ID provided. Please provide a sessionId query parameter or connect to /sse first.",
      activeConnections: connections.size
    });
  }

  const transport = connections.get(sessionId);
  if (!transport) {
    console.error(`Session not found: ${sessionId}`);
    return res.status(404).json({ error: "Session not found" });
  }

  console.error(`Handling message for session: ${sessionId}`);
  try {
    transport.handlePostMessage(req, res).catch((error: Error) => {
      console.error(`Error handling post message: ${error}`);
      res.status(500).json({ error: `Internal server error: ${error.message}` });
    });
  } catch (error) {
    console.error(`Exception handling post message: ${error}`);
    res.status(500).json({ error: `Internal server error: ${error}` });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    server: server ? "initialized" : "initializing",
    activeConnections: connections.size,
    connectedSessionIds: Array.from(connections.keys())
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    name: "MCP Server",
    version: "1.0.0",
    endpoints: {
      sse: "/sse",
      messages: "/messages",
      health: "/health"
    },
    status: server ? "ready" : "initializing",
    activeConnections: connections.size
  });
});

// Helper: generate session ID
function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('Shutting down server...');
  connections.forEach((transport, sessionId) => {
    console.error(`Closing connection for session: ${sessionId}`);
  });
  process.exit(0);
});

// Start HTTP server
const httpServer = app.listen(PORT, HOST, () => {
  console.error(`Template MCP Server running at http://${HOST}:${PORT}`);
  console.error(`SSE endpoint: http://${HOST}:${PORT}/sse`);
  console.error(`Messages endpoint: http://${HOST}:${PORT}/messages`);
  console.error(`Health check: http://${HOST}:${PORT}/health`);
}).on('error', (err: Error) => {
  console.error(`Server error: ${err}`);
});
