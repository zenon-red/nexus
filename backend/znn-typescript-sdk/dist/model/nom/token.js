import { BigNumber } from "../../utilities/bignumber.js";
import { Address, TokenStandard } from "../primitives/index.js";
import { Model } from "../base.js";
export class Token extends Model {
    constructor(name, symbol, domain, totalSupply, decimals, owner, tokenStandard, maxSupply, isBurnable, isMintable, isUtility) {
        super();
        this.name = name;
        this.symbol = symbol;
        this.domain = domain;
        this.totalSupply = totalSupply;
        this.decimals = decimals;
        this.owner = owner;
        this.tokenStandard = tokenStandard;
        this.maxSupply = maxSupply;
        this.isBurnable = isBurnable;
        this.isMintable = isMintable;
        this.isUtility = isUtility;
    }
    static fromJson(json) {
        return new Token(json.name, json.symbol, json.domain, BigNumber.from(json.totalSupply), json.decimals, Address.parse(json.owner), TokenStandard.parse(json.tokenStandard), BigNumber.from(json.maxSupply), json.isBurnable, json.isMintable, json.isUtility);
    }
    decimalsExponent() {
        return Math.pow(10, this.decimals);
    }
}
export class TokenList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new TokenList(json.count, json.list.map(Token.fromJson));
    }
}
//# sourceMappingURL=token.js.map