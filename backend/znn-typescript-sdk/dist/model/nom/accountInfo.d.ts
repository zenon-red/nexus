import { Model } from "../base.js";
import { Address } from "../primitives/index.js";
import { Token } from "./token.js";
export declare class AccountInfo extends Model {
    address: Address;
    blockCount: number;
    balanceInfoMap: {
        [key: string]: BalanceInfoListItem;
    };
    constructor(address: Address, blockCount?: number, balanceInfoMap?: {
        [key: string]: BalanceInfoListItem;
    });
    static fromJson(json: {
        [key: string]: any;
    }): AccountInfo;
    toJson(): {
        [key: string]: any;
    };
}
export declare class BalanceInfoListItem extends Model {
    token: Token;
    balance: BigNumber;
    constructor(token: Token, balance: BigNumber);
    static fromJson(json: {
        [key: string]: any;
    }): BalanceInfoListItem;
}
//# sourceMappingURL=accountInfo.d.ts.map