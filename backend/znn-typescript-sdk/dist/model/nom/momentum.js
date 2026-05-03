import { Buffer } from "buffer";
import { Model } from "../base.js";
import { Address, Hash } from "../primitives/index.js";
import { AccountHeader } from "./accountHeader.js";
export class Momentum extends Model {
    constructor(version, chainIdentifier, hash, previousHash, height, timestamp, data, content, changesHash, publicKey, signature, producer) {
        super();
        this.version = version;
        this.chainIdentifier = chainIdentifier;
        this.hash = hash;
        this.previousHash = previousHash;
        this.height = height;
        this.timestamp = timestamp;
        this.data = data;
        this.content = content;
        this.changesHash = changesHash;
        this.publicKey = publicKey;
        this.signature = signature;
        this.producer = producer;
    }
    static fromJson(json) {
        return new Momentum(json.version, json.chainIdentifier, Hash.parse(json.hash), Hash.parse(json.previousHash), json.height, json.timestamp, Buffer.from(json.data, "hex"), json.content?.map((header) => AccountHeader.fromJson(header)), Hash.parse(json.changesHash), json.publicKey || "", json.signature || "", Address.parse(json.producer));
    }
    toJson() {
        return {
            version: this.version,
            chainIdentifier: this.chainIdentifier,
            hash: this.hash.toString(),
            previousHash: this.previousHash.toString(),
            height: this.height,
            timestamp: this.timestamp,
            data: this.data.toString("hex"),
            content: this.content.map((header) => header.toString()),
            changesHash: this.changesHash?.toString(),
            publicKey: this.publicKey,
            signature: this.signature,
            producer: this.producer.toString()
        };
    }
}
export class MomentumList extends Model {
    constructor(count = 0, list = []) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new MomentumList(json.count, json.list.map(Momentum.fromJson));
    }
}
//# sourceMappingURL=momentum.js.map