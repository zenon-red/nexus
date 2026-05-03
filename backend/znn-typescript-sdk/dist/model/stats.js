import { Address } from "./primitives/address.js";
import { Model } from "./base.js";
export var SyncState;
(function (SyncState) {
    SyncState[SyncState["Unknown"] = 0] = "Unknown";
    SyncState[SyncState["Syncing"] = 1] = "Syncing";
    SyncState[SyncState["SyncDone"] = 2] = "SyncDone";
    SyncState[SyncState["NotEnoughPeers"] = 3] = "NotEnoughPeers";
})(SyncState || (SyncState = {}));
export class Peer extends Model {
    constructor(publicKey, ip) {
        super();
        this.publicKey = publicKey;
        this.ip = ip;
    }
    static fromJson(json) {
        return new Peer(json.publicKey, json.ip);
    }
}
export class NetworkInfo extends Model {
    constructor(numPeers, self, peers) {
        super();
        this.numPeers = numPeers;
        this.self = self;
        this.peers = peers;
    }
    static fromJson(json) {
        const peers = json.peers.map((peerJson) => Peer.fromJson(peerJson));
        return new NetworkInfo(json.numPeers, Peer.fromJson(json.self), peers);
    }
}
export class ProcessInfo extends Model {
    constructor(commit, version) {
        super();
        this.commit = commit;
        this.version = version;
    }
    static fromJson(json) {
        return new ProcessInfo(json.commit, json.version);
    }
}
export class OsInfo extends Model {
    constructor(os, platform, platformFamily, platformVersion, kernelVersion, memoryTotal, memoryFree, numCPU, numGoroutine) {
        super();
        this.os = os;
        this.platform = platform;
        this.platformFamily = platformFamily;
        this.platformVersion = platformVersion;
        this.kernelVersion = kernelVersion;
        this.memoryTotal = memoryTotal;
        this.memoryFree = memoryFree;
        this.numCPU = numCPU;
        this.numGoroutine = numGoroutine;
    }
    static fromJson(json) {
        return new OsInfo(json.os, json.platform, json.platformFamily, json.platformVersion, json.kernelVersion, json.memoryTotal, json.memoryFree, json.numCPU, json.numGoroutine);
    }
}
export class SyncInfo extends Model {
    constructor(state, currentHeight, targetHeight) {
        super();
        this.state = state;
        this.currentHeight = currentHeight;
        this.targetHeight = targetHeight;
    }
    static fromJson(json) {
        return new SyncInfo(json.state, json.currentHeight, json.targetHeight);
    }
}
export class ExtraData extends Model {
    constructor(affiliate) {
        super();
        this.affiliate = affiliate;
    }
    static fromJson(json) {
        return new ExtraData(Address.parse(json.affiliate));
    }
}
//# sourceMappingURL=stats.js.map