import { Buffer } from "buffer";
import { Model } from "../base.js";
import { Address, Hash } from "../primitives/index.js";
import { AccountHeader } from "./accountHeader.js";
export declare class Momentum extends Model {
    version: number;
    chainIdentifier: number;
    hash: Hash;
    previousHash: Hash;
    height: number;
    timestamp: number;
    data: Buffer;
    content: Array<AccountHeader>;
    changesHash: Hash;
    publicKey: string;
    signature: string;
    producer: Address;
    constructor(version: number, chainIdentifier: number, hash: Hash, previousHash: Hash, height: number, timestamp: number, data: Buffer, content: Array<AccountHeader>, changesHash: Hash, publicKey: string, signature: string, producer: Address);
    static fromJson(json: {
        [key: string]: any;
    }): Momentum;
    toJson(): {
        [key: string]: any;
    };
}
export declare class MomentumList extends Model {
    count: number;
    list: Array<Momentum>;
    constructor(count?: number, list?: Array<Momentum>);
    static fromJson(json: {
        [key: string]: any;
    }): MomentumList;
}
//# sourceMappingURL=momentum.d.ts.map