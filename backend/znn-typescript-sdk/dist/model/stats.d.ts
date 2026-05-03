import { Address } from "./primitives/address.js";
import { Model } from "./base.js";
export declare enum SyncState {
    Unknown = 0,
    Syncing = 1,
    SyncDone = 2,
    NotEnoughPeers = 3
}
export declare class Peer extends Model {
    publicKey: string;
    ip: string;
    constructor(publicKey: string, ip: string);
    static fromJson(json: {
        [key: string]: any;
    }): Peer;
}
export declare class NetworkInfo extends Model {
    numPeers: number;
    self: Peer;
    peers: Peer[];
    constructor(numPeers: number, self: Peer, peers: Peer[]);
    static fromJson(json: {
        [key: string]: any;
    }): NetworkInfo;
}
export declare class ProcessInfo extends Model {
    commit: string;
    version: string;
    constructor(commit: string, version: string);
    static fromJson(json: {
        [key: string]: any;
    }): ProcessInfo;
}
export declare class OsInfo extends Model {
    os: string;
    platform: string;
    platformFamily: string;
    platformVersion: string;
    kernelVersion: string;
    memoryTotal: number;
    memoryFree: number;
    numCPU: number;
    numGoroutine: number;
    constructor(os: string, platform: string, platformFamily: string, platformVersion: string, kernelVersion: string, memoryTotal: number, memoryFree: number, numCPU: number, numGoroutine: number);
    static fromJson(json: {
        [key: string]: any;
    }): OsInfo;
}
export declare class SyncInfo extends Model {
    state: SyncState;
    currentHeight: number;
    targetHeight: number;
    constructor(state: SyncState, currentHeight: number, targetHeight: number);
    static fromJson(json: {
        [key: string]: any;
    }): SyncInfo;
}
export declare class ExtraData extends Model {
    affiliate: Address;
    constructor(affiliate: Address);
    static fromJson(json: {
        [key: string]: any;
    }): ExtraData;
}
//# sourceMappingURL=stats.d.ts.map