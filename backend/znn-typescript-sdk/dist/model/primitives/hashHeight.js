import { Buffer } from "buffer";
import { numberToBytes } from "../../utilities/bytes.js";
import { EMPTY_HASH, Hash } from "./hash.js";
export class HashHeight {
    constructor(hash = EMPTY_HASH, height) {
        this.hash = hash;
        this.height = height;
    }
    static fromJson(json) {
        return new HashHeight(Hash.parse(json["hash"]), json["height"]);
    }
    toJson() {
        return {
            hash: this.hash.toString(),
            height: this.height
        };
    }
    toString() {
        return JSON.stringify(this.toJson());
    }
    getBytes() {
        return Buffer.concat([
            this.hash?.getBytes() || EMPTY_HASH.getBytes(),
            numberToBytes(this.height, 8)
        ]);
    }
}
const EMPTY_HASH_HEIGHT = new HashHeight(EMPTY_HASH, 0);
export { EMPTY_HASH_HEIGHT };
//# sourceMappingURL=hashHeight.js.map