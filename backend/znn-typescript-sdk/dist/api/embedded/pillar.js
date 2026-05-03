import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE } from "../../zenon.js";
import { PILLAR_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { PillarInfo, PillarInfoList, DelegationInfo, PillarEpochHistoryList, RewardHistoryList, UncollectedReward } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Pillar as PillarContract, Common as CommonContract } from "../../embedded/index.js";
import { PILLAR_REGISTER_ZNN_AMOUNT } from "./constants.js";
export class PillarApi extends Api {
    //
    // RPC
    async getQsrRegistrationCost() {
        const response = await this.client.sendRequest("embedded.pillar.getQsrRegistrationCost", []);
        return BigNumber.from(response);
    }
    async getAll(pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.pillar.getAll", [
            pageIndex,
            pageSize
        ]);
        return PillarInfoList.fromJson(response);
    }
    async getByOwner(address) {
        const response = await this.client.sendRequest("embedded.pillar.getByOwner", [
            address.toString()
        ]);
        return response.map(PillarInfo.fromJson);
    }
    async getByName(name) {
        const response = await this.client.sendRequest("embedded.pillar.getByName", [
            name
        ]);
        return response == null ? null : PillarInfo.fromJson(response);
    }
    async checkNameAvailability(name) {
        return await this.client.sendRequest("embedded.pillar.checkNameAvailability", [
            name
        ]);
    }
    async getDelegatedPillar(address) {
        const response = await this.client.sendRequest("embedded.pillar.getDelegatedPillar", [
            address.toString()
        ]);
        return response == null ? null : DelegationInfo.fromJson(response);
    }
    async getPillarEpochHistory(name, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.pillar.getPillarEpochHistory", [
            name,
            pageIndex,
            pageSize,
        ]);
        return PillarEpochHistoryList.fromJson(response);
    }
    async getPillarsHistoryByEpoch(epoch, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.pillar.getPillarsHistoryByEpoch", [
            epoch,
            pageIndex,
            pageSize,
        ]);
        return PillarEpochHistoryList.fromJson(response);
    }
    //
    // Common RPC
    async getDepositedQsr(address) {
        const response = await this.client.sendRequest("embedded.pillar.getDepositedQsr", [
            address.toString()
        ]);
        return BigNumber.from(response);
    }
    async getUncollectedReward(address) {
        const response = await this.client.sendRequest("embedded.pillar.getUncollectedReward", [
            address.toString()
        ]);
        return UncollectedReward.fromJson(response);
    }
    async getFrontierRewardByPage(address, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.pillar.getFrontierRewardByPage", [
            address.toString(),
            pageIndex,
            pageSize,
        ]);
        return RewardHistoryList.fromJson(response);
    }
    //
    // Contract methods
    register(name, producerAddress, rewardAddress, giveBlockRewardPercentage = 0, giveDelegateRewardPercentage = 100) {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, PILLAR_REGISTER_ZNN_AMOUNT, PillarContract.abi.encodeFunctionData("Register", [
            name,
            producerAddress.toString(),
            rewardAddress.toString(),
            giveBlockRewardPercentage,
            giveDelegateRewardPercentage
        ]));
    }
    registerLegacy(name, producerAddress, rewardAddress, publicKey, signature, giveBlockRewardPercentage = 0, giveDelegateRewardPercentage = 100) {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, PILLAR_REGISTER_ZNN_AMOUNT, PillarContract.abi.encodeFunctionData("RegisterLegacy", [
            name,
            producerAddress.toString(),
            rewardAddress.toString(),
            giveBlockRewardPercentage,
            giveDelegateRewardPercentage,
            publicKey,
            signature,
        ]));
    }
    updatePillar(name, producerAddress, rewardAddress, giveBlockRewardPercentage = 0, giveDelegateRewardPercentage = 100) {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, BigNumber.from(0), PillarContract.abi.encodeFunctionData("UpdatePillar", [
            name,
            producerAddress.toString(),
            rewardAddress.toString(),
            giveBlockRewardPercentage,
            giveDelegateRewardPercentage
        ]));
    }
    revoke(name) {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, BigNumber.from(0), PillarContract.abi.encodeFunctionData("Revoke", [
            name,
        ]));
    }
    delegate(name) {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, BigNumber.from(0), PillarContract.abi.encodeFunctionData("Delegate", [
            name,
        ]));
    }
    undelegate() {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, BigNumber.from(0), PillarContract.abi.encodeFunctionData("Undelegate", []));
    }
    //
    // Common contract methods
    collectRewards() {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, BigNumber.from(0), CommonContract.abi.encodeFunctionData("CollectReward", []));
    }
    depositQsr(amount) {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, amount, CommonContract.abi.encodeFunctionData("DepositQsr", []));
    }
    withdrawQsr() {
        return AccountBlockTemplate.callContract(PILLAR_ADDRESS, ZNN_ZTS, BigNumber.from(0), CommonContract.abi.encodeFunctionData("WithdrawQsr", []));
    }
}
//# sourceMappingURL=pillar.js.map