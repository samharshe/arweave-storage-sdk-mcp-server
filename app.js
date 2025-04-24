const { Configuration, StorageApi, Token, Network } = require('arweave-storage-sdk');

const config = new Configuration({
	appName: '<Name of your App>'
	privateKey: '<ENV to private key or use_web_wallet>',
	network: Network.BASE_MAINNET,
	token: Token.USDC
})

const storageClient = new StorageApi(config);
await storageApiInstance.ready