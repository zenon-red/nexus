import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { STAKE_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { StakeList, RewardHistoryList, UncollectedReward } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Stake as StakeContract, Common as CommonContract } from "../../embedded/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
export class StakeApi extends Api {
    //
    // RPC
    async getEntriesByAddress(address, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.stake.getEntriesByAddress", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return StakeList.fromJson(response);
    }
    //
    // Common RPC
    async getUncollectedReward(address) {
        const response = await this.client.sendRequest("embedded.stake.getUncollectedReward", [
            address.toString()
        ]);
        return UncollectedReward.fromJson(response);
    }
    async getFrontierRewardByPage(address, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.stake.getFrontierRewardByPage", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return RewardHistoryList.fromJson(response);
    }
    //
    // Contract methods
    stake(durationInSec, amount) {
        return AccountBlockTemplate.callContract(STAKE_ADDRESS, ZNN_ZTS, amount, StakeContract.abi.encodeFunctionData("Stake", [
            durationInSec
        ]));
    }
    cancel(id) {
        return AccountBlockTemplate.callContract(STAKE_ADDRESS, ZNN_ZTS, BigNumber.from("0"), StakeContract.abi.encodeFunctionData("Cancel", [
            id.getBytes()
        ]));
    }
    //
    // Common contract methods
    collectReward() {
        return AccountBlockTemplate.callContract(STAKE_ADDRESS, ZNN_ZTS, BigNumber.from("0"), CommonContract.abi.encodeFunctionData("CollectReward", []));
    }
}
//# sourceMappingURL=stake.js.map