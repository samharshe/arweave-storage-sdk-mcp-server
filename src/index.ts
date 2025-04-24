import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { StorageApi, Configuration, Network, Token } from 'arweave-storage-sdk'
import * as dotenv from 'dotenv'

interface Tag {
    name: string;
    value: string
}

dotenv.config()

const server = new McpServer({
    name: "arweave-demo",
    version: "1.0.0"
});

server.tool("writeToArweave",
    { dataToWrite: z.string().default('test string.') },
    async ({ dataToWrite } : { dataToWrite: string }) => {
        const config = new Configuration({
            privateKey: process.env.ARWEAVE_PRIVATE_KEY as string,
            appName: 'arfs-js-drive',
            network: Network.ARWEAVE_MAINNET,
            token: Token.AR
        })
        const storageApiInstance = new StorageApi(config)
        await storageApiInstance.ready

        await storageApiInstance.api.login()

        const tags = [
            { name: 'Content-Type', value: 'text/plain' },
            { name: 'Arweave-Transaction', value: dataToWrite}
        ] as Tag[]

        const file = new Blob(['A demo file!'], { type: 'text/plain' })
        const upload = await storageApiInstance.quickUpload(await file.arrayBuffer(), {
            name: 'demo.txt',
            dataContentType: 'text/plain',
            tags,
            size: file.size,
            overrideFileName: true
        })

        const profile = await storageApiInstance.api.getUser()
        
        return {
            content: [
                { type: "text", text: `Data written to Arweave. Transaction: ${upload.id}` }
            ]
        }
});

async function main(): Promise<void> {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Arweave Storage SDK MCP server running.")
    } catch (error: any) {
        throw error;
    }
}

main().catch((error: Error) => {
    console.error("Fatal error in main():", error)
});