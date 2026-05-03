import { Address } from "../primitives/index.js";
import { Model } from "../base.js";
export class SentinelInfo extends Model {
    constructor(owner, registrationTimestamp, isRevocable, revokeCooldown, active) {
        super();
        this.owner = owner;
        this.registrationTimestamp = registrationTimestamp;
        this.isRevocable = isRevocable;
        this.revokeCooldown = revokeCooldown;
        this.active = active;
    }
    static fromJson(json) {
        return new SentinelInfo(Address.parse(json.owner), json.registrationTimestamp, json.isRevocable, json.revokeCooldown, json.active);
    }
}
export class SentinelInfoList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new SentinelInfoList(json.count, json.list.map(SentinelInfo.fromJson));
    }
}
//# sourceMappingURL=sentinel.js.map