require('dotenv').config();
const { Configuration, StorageApi, Token, Network } = require('arweave-storage-sdk');

async function initializeStorage() {
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is not set');
    }

    const config = new Configuration({
        appName: 'mcp',
        privateKey: JSON.parse(process.env.PRIVATE_KEY), // Parse the JSON string
        network: Network.ARWEAVE_MAINNET,
        token: Token.AR
    });

    const storageClient = new StorageApi(config);
    await storageClient.ready;
    return storageClient;
}

initializeStorage().then(client => {
    client.api.login;
}).catch(error => {
    console.error('Failed to initialize storage:', error);
});