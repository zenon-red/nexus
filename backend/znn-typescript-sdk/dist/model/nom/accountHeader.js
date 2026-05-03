import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export class AccountHeader extends Model {
    constructor(address, hash, height) {
        super();
        this.address = address;
        this.hash = hash;
        this.height = height;
    }
    static fromJson(json) {
        return new AccountHeader(Address.parse(json.address), Hash.parse(json.hash), json.height);
    }
}
//# sourceMappingURL=accountHeader.js.map