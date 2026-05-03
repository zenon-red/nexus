import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { SENTINEL_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { SentinelInfo, SentinelInfoList, RewardHistoryList, UncollectedReward } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { Sentinel as SentinelContract, Common as CommonContract } from "../../embedded/index.js";
import { SENTINEL_REGISTER_ZNN_AMOUNT } from "./constants.js";
export class SentinelApi extends Api {
    //
    // RPC
    async getAllActive(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.sentinel.getAllActive", [
            pageIndex,
            pageSize
        ]);
        return SentinelInfoList.fromJson(response);
    }
    async getByOwner(owner) {
        const response = await this.client.sendRequest("embedded.sentinel.getByOwner", [
            owner.toString()
        ]);
        return response == null ? response : SentinelInfo.fromJson(response);
    }
    //
    // Common RPC
    async getDepositedQsr(address) {
        const response = await this.client.sendRequest("embedded.sentinel.getDepositedQsr", [
            address.toString()
        ]);
        return BigNumber.from(response);
    }
    async getUncollectedReward(address) {
        const response = await this.client.sendRequest("embedded.sentinel.getUncollectedReward", [
            address.toString()
        ]);
        return UncollectedReward.fromJson(response);
    }
    async getFrontierRewardByPage(address, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.sentinel.getFrontierRewardByPage", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return RewardHistoryList.fromJson(response);
    }
    //
    // Contract methods
    register() {
        return AccountBlockTemplate.callContract(SENTINEL_ADDRESS, ZNN_ZTS, SENTINEL_REGISTER_ZNN_AMOUNT, SentinelContract.abi.encodeFunctionData("Register", []));
    }
    revoke() {
        return AccountBlockTemplate.callContract(SENTINEL_ADDRESS, ZNN_ZTS, BigNumber.from(0), SentinelContract.abi.encodeFunctionData("Revoke", []));
    }
    //
    // Common contract methods
    collectRewards() {
        return AccountBlockTemplate.callContract(SENTINEL_ADDRESS, ZNN_ZTS, BigNumber.from(0), CommonContract.abi.encodeFunctionData("CollectReward", []));
    }
    depositQsr(amount) {
        return AccountBlockTemplate.callContract(SENTINEL_ADDRESS, ZNN_ZTS, amount, CommonContract.abi.encodeFunctionData("DepositQsr", []));
    }
    withdrawQsr() {
        return AccountBlockTemplate.callContract(SENTINEL_ADDRESS, ZNN_ZTS, BigNumber.from(0), CommonContract.abi.encodeFunctionData("WithdrawQsr", []));
    }
}
//# sourceMappingURL=sentinel.js.map