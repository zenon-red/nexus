import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { TOKEN_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { AccountBlockTemplate, Token, TokenList } from "../../model/nom/index.js";
import { Token as TokenContract } from "../../embedded/token.js";
import { ONE_ZNN } from "./constants.js";
import { BigNumber } from "../../utilities/bignumber.js";
export class TokenApi extends Api {
    //
    // RPC
    async getAll(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.token.getAll", [
            pageIndex,
            pageSize
        ]);
        return TokenList.fromJson(response);
    }
    async getByOwner(address, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.token.getByOwner", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return TokenList.fromJson(response);
    }
    async getByZts(tokenStandard) {
        const response = await this.client.sendRequest("embedded.token.getByZts", [
            tokenStandard.toString()
        ]);
        return response === null ? null : Token.fromJson(response);
    }
    //
    // Contract methods
    issueToken(tokenName, tokenSymbol, tokenDomain, totalSupply, maxSupply, decimals, mintable, burnable, utility) {
        return AccountBlockTemplate.callContract(TOKEN_ADDRESS, ZNN_ZTS, ONE_ZNN, TokenContract.abi.encodeFunctionData("IssueToken", [
            tokenName,
            tokenSymbol,
            tokenDomain,
            totalSupply.toString(),
            maxSupply.toString(),
            decimals,
            mintable,
            burnable,
            utility,
        ]));
    }
    mint(tokenStandard, amount, receiveAddress) {
        return AccountBlockTemplate.callContract(TOKEN_ADDRESS, ZNN_ZTS, BigNumber.from(0), TokenContract.abi.encodeFunctionData("Mint", [
            tokenStandard.toString(),
            amount.toString(),
            receiveAddress.toString()
        ]));
    }
    burnToken(tokenStandard, amount) {
        return AccountBlockTemplate.callContract(TOKEN_ADDRESS, tokenStandard, amount, TokenContract.abi.encodeFunctionData("Burn", []));
    }
    updateToken(tokenStandard, owner, isMintable, isBurnable) {
        return AccountBlockTemplate.callContract(TOKEN_ADDRESS, ZNN_ZTS, BigNumber.from(0), TokenContract.abi.encodeFunctionData("UpdateToken", [
            tokenStandard.toString(),
            owner.toString(),
            isMintable,
            isBurnable,
        ]));
    }
}
//# sourceMappingURL=token.js.map