### [MCP hooks](https://github.com/modelcontextprotocol/typescript-sdk/) for the [Arweave Storage SDK](https://github.com/labscommunity/arweave-storage-sdk/)

clone this repo and add
```
{
  "mcpServers": {
    "arweave-demo": {
      "command": "node",
      "args": [
        "/PATH/TO/dist/index.js"
      ],
      "env": {
        "MCP_SERVER_REQUEST_TIMEOUT": "30000"
      }
    }
  }
}
```
to `~/Library/Application\ Support/Claude/claude_desktop_config.json` and restart Claude Desktop. (that path is for MacOS, of course; adjust according to your system. also: you may need to create this config file first if you have not yet.) you should see a little hammer icon indicating that Claude has been equipped with a tool. then, over the course of your conversation, if Claude determines that this tool would be of use, he'll call it.

in my case, I cannot figure out how to get Claude to call the tool properly. he insists on packaging the JSON
```
{
    `like`: `this`
}
```
which of course immediately throws an error. it is possible, likely, even, that this is because I have somehow configured the tools incorrectly, but it sure looks like a hallucination. 

if anyone gets this to work, I would be thrilled.