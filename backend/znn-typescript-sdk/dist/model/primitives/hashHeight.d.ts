import { Buffer } from "buffer";
import { Hash } from "./hash.js";
export declare class HashHeight {
    hash: Hash;
    height: number;
    constructor(hash: Hash | undefined, height: number);
    static fromJson(json: {
        [key: string]: any;
    }): HashHeight;
    toJson(): {
        [key: string]: any;
    };
    toString(): string;
    getBytes(): Buffer;
}
declare const EMPTY_HASH_HEIGHT: HashHeight;
export { EMPTY_HASH_HEIGHT };
//# sourceMappingURL=hashHeight.d.ts.map