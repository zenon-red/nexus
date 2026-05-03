import { Api } from "../base.js";
import { Address, TokenStandard } from "../../model/primitives/index.js";
import { AccountBlockTemplate, Token, TokenList } from "../../model/nom/index.js";
export declare class TokenApi extends Api {
    getAll(pageIndex?: number, pageSize?: number): Promise<TokenList>;
    getByOwner(address: Address, pageIndex?: number, pageSize?: number): Promise<TokenList>;
    getByZts(tokenStandard: TokenStandard): Promise<Token | null>;
    issueToken(tokenName: string, tokenSymbol: string, tokenDomain: string, totalSupply: BigNumber, maxSupply: BigNumber, decimals: number, mintable: boolean, burnable: boolean, utility: boolean): AccountBlockTemplate;
    mint(tokenStandard: TokenStandard, amount: BigNumber, receiveAddress: Address): AccountBlockTemplate;
    burnToken(tokenStandard: TokenStandard, amount: BigNumber): AccountBlockTemplate;
    updateToken(tokenStandard: TokenStandard, owner: Address, isMintable: boolean, isBurnable: boolean): AccountBlockTemplate;
}
//# sourceMappingURL=token.d.ts.map