import { Buffer } from "buffer";
import { Address, Hash, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";
export class HtlcInfo extends Model {
    constructor(id, timeLocked, hashLocked, tokenStandard, amount, expirationTime, hashType, keyMaxSize, hashLock) {
        super();
        this.id = id;
        this.timeLocked = timeLocked;
        this.hashLocked = hashLocked;
        this.tokenStandard = tokenStandard;
        this.amount = amount;
        this.expirationTime = expirationTime;
        this.hashType = hashType;
        this.keyMaxSize = keyMaxSize;
        this.hashLock = hashLock;
    }
    static fromJson(json) {
        return new HtlcInfo(Hash.parse(json.id), Address.parse(json.timeLocked), Address.parse(json.hashLocked), TokenStandard.parse(json.tokenStandard), BigNumber.from(json.amount.toString()), json.expirationTime, json.hashType, json.keyMaxSize, Buffer.from(json.hashLock, "base64"));
    }
}
//# sourceMappingURL=htlc.js.map