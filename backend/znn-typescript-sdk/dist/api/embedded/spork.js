import { Api } from "../base.js";
import { SPORK_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { SporkList } from "../../model/embedded/spork.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { Spork as SporkContract } from "../../embedded/index.js";
export class SporkApi extends Api {
    //
    // RPC
    async getAll(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.spork.getAll", [
            pageIndex,
            pageSize,
        ]);
        return SporkList.fromJson(response);
    }
    //
    // Contract methods
    createSpork(name, description) {
        return AccountBlockTemplate.callContract(SPORK_ADDRESS, ZNN_ZTS, BigNumber.from(0), SporkContract.abi.encodeFunctionData("CreateSpork", [
            name,
            description,
        ]));
    }
    activateSpork(id) {
        return AccountBlockTemplate.callContract(SPORK_ADDRESS, ZNN_ZTS, BigNumber.from(0), SporkContract.abi.encodeFunctionData("ActivateSpork", [
            id.getBytes(),
        ]));
    }
}
//# sourceMappingURL=spork.js.map