import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import dotenv from "dotenv";
import crypto from "crypto";
import { StorageApi, Configuration, Network, Token } from "arweave-storage-sdk";
dotenv.config();
const app = express();
app.use(express.json());
function getServer() {
    const server = new McpServer({
        name: "arweave-demo",
        version: "1.0.0",
    });
    server.tool("writeToArweave", { dataToWrite: z.string().default("test string.") }, async ({ dataToWrite }) => {
        const config = new Configuration({
            privateKey: process.env.ARWEAVE_PRIVATE_KEY,
            appName: "arfs-js-drive",
            network: Network.ARWEAVE_MAINNET,
            token: Token.AR,
        });
        const storageApiInstance = new StorageApi(config);
        await storageApiInstance.ready;
        await storageApiInstance.api.login();
        const tags = [
            { name: "Content-Type", value: "text/plain" },
            { name: "Arweave-Transaction", value: dataToWrite },
        ];
        const file = new Blob(["A demo file!"], { type: "text/plain" });
        const upload = await storageApiInstance.quickUpload(await file.arrayBuffer(), {
            name: "demo.txt",
            dataContentType: "text/plain",
            tags,
            size: file.size,
            overrideFileName: true,
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Data written to Arweave. Transaction: ${upload.id}`,
                },
            ],
        };
    });
    return server;
}
// HTTP endpoint for MCP requests
app.post("/mcp", async (req, res) => {
    const server = getServer();
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID()
    });
    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        res.on("close", () => {
            transport.close();
            server.close();
        });
    }
    catch (err) {
        console.error("Error handling request:", err);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: "2.0",
                error: { code: -32603, message: "Internal server error" },
                id: null,
            });
        }
    }
});
// Optionally block unsupported methods
app.get("/mcp", (req, res) => {
    res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null,
    });
});
app.delete("/mcp", (req, res) => {
    res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null,
    });
});
// Start server
app.listen(3000, () => {
    console.log("MCP HTTP server running on port 3000");
});
