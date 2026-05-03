import { WsClient, newClient } from "./client/index.js";
import { SubscribeApi, LedgerApi, StatsApi, EmbeddedApi } from "./api/index.js";
import { send } from "./utilities/block.js";
// Network
export const ZNN_SDK_VERSION = "0.0.8";
export const DEFAULT_NET_ID = 1;
export const DEFAULT_CHAIN_ID = 1;
export const DEFAULT_POW_BASE_PATH = "/";
// RPC
export const RPC_MAX_PAGE_SIZE = 1024;
export const MEMORY_POOL_PAGE_SIZE = 50;
export class Zenon {
    static getInstance() {
        if (!Zenon._singleton) {
            Zenon._singleton = new Zenon();
        }
        return Zenon._singleton;
    }
    constructor() {
        this.defaultServerUrl = "ws://127.0.0.1:35998";
        this.ledger = new LedgerApi();
        this.stats = new StatsApi();
        this.embedded = new EmbeddedApi();
        this.subscribe = new SubscribeApi();
    }
    _setClient(client) {
        this.ledger.setClient(client);
        this.stats.setClient(client);
        this.embedded.setClient(client);
        // set client for subscribe environment only when the client is a WS Connection
        if (client instanceof WsClient) {
            this.subscribe.setClient(client);
        }
    }
    async initialize(serverUrl = this.defaultServerUrl, timeout = 30000, wsOptions) {
        this.client = newClient(serverUrl);
        // If it's a WebSocket client, initialize it
        if (this.client instanceof WsClient) {
            await this.client.initialize(serverUrl, timeout, wsOptions);
        }
        this._setClient(this.client);
    }
    clearConnection() {
        if (this.client instanceof WsClient) {
            this.client.stop();
        }
        this.client = undefined;
    }
    async send(transaction, currentKeyPair) {
        return send(Zenon.getInstance(), transaction, currentKeyPair);
    }
    static setNetworkID(networkId = DEFAULT_NET_ID) {
        this.networkID = networkId;
    }
    static getNetworkID() {
        return this.networkID;
    }
    static setChainID(chainId = DEFAULT_CHAIN_ID) {
        this.chainID = chainId;
    }
    static getChainIdentifier() {
        return this.chainID;
    }
    static setPowBasePath(basePath = DEFAULT_POW_BASE_PATH) {
        // Ensure trailing slash
        if (!basePath.endsWith("/")) {
            basePath += "/";
        }
        // Ensure valid module specifier for browsers (must start with /, ./, or ../)
        // Skip if already valid or is a full URL
        if (!basePath.startsWith("/") &&
            !basePath.startsWith("./") &&
            !basePath.startsWith("../") &&
            !basePath.startsWith("http://") &&
            !basePath.startsWith("https://")) {
            basePath = "./" + basePath;
        }
        this.powBasePath = basePath;
    }
    static getPowBasePath() {
        return this.powBasePath;
    }
}
Zenon.chainID = DEFAULT_CHAIN_ID;
Zenon.networkID = DEFAULT_NET_ID;
Zenon.powBasePath = DEFAULT_POW_BASE_PATH;
//# sourceMappingURL=zenon.js.map