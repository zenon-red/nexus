import { Client, type WsClientOptions } from "./client/index.js";
import { SubscribeApi, LedgerApi, StatsApi, EmbeddedApi } from "./api/index.js";
import { AccountBlockTemplate } from "./model/nom/accountBlock.js";
import { KeyPair } from "./wallet/index.js";
export declare const ZNN_SDK_VERSION: string;
export declare const DEFAULT_NET_ID: number;
export declare const DEFAULT_CHAIN_ID: number;
export declare const DEFAULT_POW_BASE_PATH: string;
export declare const RPC_MAX_PAGE_SIZE: number;
export declare const MEMORY_POOL_PAGE_SIZE: number;
export declare class Zenon {
    static _singleton: Zenon;
    defaultServerUrl: string;
    static chainID: number;
    static networkID: number;
    static powBasePath: string;
    client?: Client;
    ledger: LedgerApi;
    stats: StatsApi;
    embedded: EmbeddedApi;
    subscribe: SubscribeApi;
    static getInstance(): Zenon;
    private constructor();
    private _setClient;
    initialize(serverUrl?: string, timeout?: number, wsOptions?: WsClientOptions): Promise<void>;
    clearConnection(): void;
    send(transaction: AccountBlockTemplate, currentKeyPair: KeyPair): Promise<AccountBlockTemplate>;
    static setNetworkID(networkId?: number): void;
    static getNetworkID(): number;
    static setChainID(chainId?: number): void;
    static getChainIdentifier(): number;
    static setPowBasePath(basePath?: string): void;
    static getPowBasePath(): string;
}
//# sourceMappingURL=zenon.d.ts.map