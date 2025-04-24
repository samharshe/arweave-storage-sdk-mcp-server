import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod"; // Make sure z is imported
import { StorageApi, Configuration, Network, Token } from 'arweave-storage-sdk';
import * as dotenv from 'dotenv';
dotenv.config();
const server = new McpServer({
    name: "arweave-demo",
    version: "1.0.0"
});
const expectedInputStructure = z.object({
    dataToWrite: z.string().default('test string.')
});
const tolerantInputSchema = z.preprocess((rawInput) => {
    if (typeof rawInput === 'string' && rawInput.trim().startsWith('{') && rawInput.trim().endsWith('}')) {
        try {
            console.error(`Attempting to parse non-standard input: ${rawInput}`);
            const parser = new Function(`return ${rawInput}`);
            const parsedObject = parser();
            console.error(`Successfully parsed non-standard input.`);
            if (parsedObject && typeof parsedObject === 'object' && 'dataToWrite' in parsedObject) {
                return parsedObject;
            }
            else {
                console.error("Parsed object missing 'dataToWrite' key.");
                return { dataToWrite: undefined };
            }
        }
        catch (e) {
            console.error("Failed to parse non-standard input string:", e, "\nInput was:", rawInput);
            return rawInput;
        }
    }
    return rawInput;
}, expectedInputStructure);
server.tool("writeToArweave", expectedInputStructure.shape, async (input) => {
    let processedInput;
    try {
        processedInput = tolerantInputSchema.parse(input);
    }
    catch (error) {
        console.error("Input validation failed:", error);
        return {
            content: [{ type: "text", text: `Error: Invalid input format. ${error instanceof z.ZodError ? error.errors.map(e => e.message).join(', ') : error}` }],
            isError: true
        };
    }
    const { dataToWrite } = processedInput;
    if (typeof dataToWrite !== 'string') {
        console.error("RUNTIME ERROR: dataToWrite is not a string after validation! Value:", dataToWrite);
        throw new Error("Internal server error: Invalid data type after processing.");
    }
    const config = new Configuration({
        privateKey: process.env.ARWEAVE_PRIVATE_KEY,
        appName: 'arfs-js-drive',
        network: Network.ARWEAVE_MAINNET,
        token: Token.AR
    });
    const storageApiInstance = new StorageApi(config);
    await storageApiInstance.ready;
    await storageApiInstance.api.login();
    const tags = [
        { name: 'Content-Type', value: 'text/plain' },
        { name: 'App-Name', value: 'arweave-demo-mcp' },
        { name: 'Data-Source', value: 'Claude-Input' }
    ];
    const file = new Blob([dataToWrite], { type: 'text/plain' });
    const fileName = `mcp-upload-${Date.now()}.txt`;
    console.error(`Uploading data (length: ${dataToWrite.length}) to Arweave as ${fileName}...`);
    try {
        const upload = await storageApiInstance.quickUpload(await file.arrayBuffer(), {
            name: fileName,
            dataContentType: 'text/plain',
            tags,
            size: file.size,
            overrideFileName: true
        });
        console.error(`Upload successful. Transaction ID: ${upload.id}`);
        return {
            content: [
                { type: "text", text: `Data written to Arweave. Transaction: ${upload.id}` }
            ]
        };
    }
    catch (uploadError) {
        console.error("Arweave upload failed:", uploadError);
        return {
            content: [{ type: "text", text: `Error: Failed to upload data to Arweave. ${uploadError}` }],
            isError: true
        };
    }
});
async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Arweave Storage SDK MCP server running.");
    }
    catch (error) {
        console.error("Failed to start MCP server:", error);
        throw error;
    }
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
