import { BigNumber } from "../../utilities/bignumber.js";
import { Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export class SwapAssetEntry extends Model {
    constructor(keyIdHash, qsr, znn) {
        super();
        this.keyIdHash = keyIdHash;
        this.qsr = qsr;
        this.znn = znn;
    }
    static fromJson(keyIdHash, json) {
        return new SwapAssetEntry(keyIdHash, BigNumber.from(json.qsr.toString()), BigNumber.from(json.znn.toString()));
    }
}
export class SwapAssetList extends Model {
    constructor(list = {}) {
        super();
        this.list = list;
    }
    static fromJson(json) {
        const list = {};
        for (const [key, value] of Object.entries(json)) {
            list[key] = SwapAssetEntry.fromJson(Hash.parse(key), value);
        }
        return new SwapAssetList(list);
    }
    toJson() {
        const result = {};
        for (const [key, value] of Object.entries(this.list)) {
            result[key] = value.toJson();
        }
        return result;
    }
}
export class SwapLegacyPillarEntry extends Model {
    constructor(numPillars, keyIdHash) {
        super();
        this.numPillars = numPillars;
        this.keyIdHash = keyIdHash;
    }
    static fromJson(json) {
        return new SwapLegacyPillarEntry(json.numPillars, Hash.parse(json.keyIdHash));
    }
}
export class SwapLegacyPillarList extends Model {
    constructor(list = []) {
        super();
        this.list = list;
    }
    static fromJson(json) {
        return new SwapLegacyPillarList(json.map((entry) => SwapLegacyPillarEntry.fromJson(entry)));
    }
}
//# sourceMappingURL=swap.js.map