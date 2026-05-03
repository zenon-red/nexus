import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class AccountHeader extends Model {
    address: Address;
    hash: Hash;
    height: number;
    constructor(address: Address, hash: Hash, height: number);
    static fromJson(json: {
        [key: string]: any;
    }): AccountHeader;
}
//# sourceMappingURL=accountHeader.d.ts.map