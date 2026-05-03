import { Address, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class Token extends Model {
    name: string;
    symbol: string;
    domain: string;
    totalSupply: BigNumber;
    decimals: number;
    owner: Address;
    tokenStandard: TokenStandard;
    maxSupply: BigNumber;
    isBurnable: boolean;
    isMintable: boolean;
    isUtility: boolean;
    constructor(name: string, symbol: string, domain: string, totalSupply: BigNumber, decimals: number, owner: Address, tokenStandard: TokenStandard, maxSupply: BigNumber, isBurnable: boolean, isMintable: boolean, isUtility: boolean);
    static fromJson(json: {
        [key: string]: any;
    }): Token;
    decimalsExponent(): number;
}
export declare class TokenList extends Model {
    count: number;
    list: Array<Token>;
    constructor(count: number, list: Array<Token>);
    static fromJson(json: {
        [key: string]: any;
    }): TokenList;
}
//# sourceMappingURL=token.d.ts.map