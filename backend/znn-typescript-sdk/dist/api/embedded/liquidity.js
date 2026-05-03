import { Api } from "../base.js";
import { RPC_MAX_PAGE_SIZE, MEMORY_POOL_PAGE_SIZE } from "../../zenon.js";
import { LIQUIDITY_ADDRESS, ZNN_ZTS } from "../../model/primitives/index.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { LiquidityInfo, LiquidityStakeList, TimeChallengesList, RewardDeposit, RewardHistoryList, SecurityInfo } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Liquidity as LiquidityContract, Common as CommonContract } from "../../embedded/index.js";
export class LiquidityApi extends Api {
    //
    // RPC
    async getLiquidityInfo() {
        const response = await this.client.sendRequest("embedded.liquidity.getLiquidityInfo", []);
        return LiquidityInfo.fromJson(response);
    }
    async getLiquidityStakeEntriesByAddress(address, pageIndex = 0, pageSize = MEMORY_POOL_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, MEMORY_POOL_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.liquidity.getLiquidityStakeEntriesByAddress", [
            address.toString(),
            pageIndex,
            pageSize
        ]);
        return LiquidityStakeList.fromJson(response);
    }
    //
    // Common RPC
    async getUncollectedReward(address) {
        const response = await this.client.sendRequest("embedded.liquidity.getUncollectedReward", [
            address.toString()
        ]);
        return RewardDeposit.fromJson(response);
    }
    async getFrontierRewardByPage(address, pageIndex = 0, pageSize = RPC_MAX_PAGE_SIZE) {
        this.validateMin(pageIndex, 0, "pageIndex");
        this.validateMax(pageSize, RPC_MAX_PAGE_SIZE, "pageSize");
        const response = await this.client.sendRequest("embedded.liquidity.getFrontierRewardByPage", [
            address.toString(),
            pageIndex,
            pageSize
        ]);
        return RewardHistoryList.fromJson(response);
    }
    async getSecurityInfo() {
        const response = await this.client.sendRequest("embedded.liquidity.getSecurityInfo", []);
        return SecurityInfo.fromJson(response);
    }
    async getTimeChallengesInfo() {
        const response = await this.client.sendRequest("embedded.liquidity.getTimeChallengesInfo", []);
        return TimeChallengesList.fromJson(response);
    }
    //
    // Contract methods
    liquidityStake(durationInSec, amount, zts) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, zts, amount, LiquidityContract.abi.encodeFunctionData("LiquidityStake", [
            durationInSec
        ]));
    }
    cancelLiquidityStake(id) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("CancelLiquidityStake", [
            id.getBytes()
        ]));
    }
    unlockLiquidityStakeEntries(zts) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, zts, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("UnlockLiquidityStakeEntries", []));
    }
    //
    // Administrator contract methods
    setTokenTuple(tokenStandards, znnPercentages, qsrPercentages, minAmounts) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("SetTokenTuple", [
            tokenStandards,
            znnPercentages,
            qsrPercentages,
            minAmounts.toString(),
        ]));
    }
    nominateGuardians(guardians) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("NominateGuardians", [
            guardians.map(address => address.toString())
        ]));
    }
    proposeAdministrator(address) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("ProposeAdministrator", [
            address.toString()
        ]));
    }
    setIsHalted(isHalted) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("SetIsHalted", [
            isHalted
        ]));
    }
    setAdditionalReward(znnReward, qsrReward) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("SetAdditionalReward", [
            znnReward,
            qsrReward
        ]));
    }
    changeAdministrator(administrator) {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("ChangeAdministrator", [
            administrator.toString()
        ]));
    }
    //
    // Common contract methods
    collectReward() {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), CommonContract.abi.encodeFunctionData("CollectReward", []));
    }
    emergency() {
        return AccountBlockTemplate.callContract(LIQUIDITY_ADDRESS, ZNN_ZTS, BigNumber.from(0), LiquidityContract.abi.encodeFunctionData("Emergency", []));
    }
}
//# sourceMappingURL=liquidity.js.map