import { Api } from "../base.js";
import { Address } from "../../model/primitives/index.js";
import { PillarInfo, PillarInfoList, DelegationInfo, PillarEpochHistoryList, RewardHistoryList, UncollectedReward } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
export declare class PillarApi extends Api {
    getQsrRegistrationCost(): Promise<BigNumber>;
    getAll(pageIndex?: number, pageSize?: number): Promise<PillarInfoList>;
    getByOwner(address: Address): Promise<Array<PillarInfo>>;
    getByName(name: string): Promise<PillarInfo | null>;
    checkNameAvailability(name: string): Promise<boolean>;
    getDelegatedPillar(address: Address): Promise<DelegationInfo | null>;
    getPillarEpochHistory(name: string, pageIndex?: number, pageSize?: number): Promise<PillarEpochHistoryList>;
    getPillarsHistoryByEpoch(epoch: number, pageIndex?: number, pageSize?: number): Promise<PillarEpochHistoryList>;
    getDepositedQsr(address: Address): Promise<BigNumber>;
    getUncollectedReward(address: Address): Promise<UncollectedReward>;
    getFrontierRewardByPage(address: Address, pageIndex?: number, pageSize?: number): Promise<RewardHistoryList>;
    register(name: string, producerAddress: Address, rewardAddress: Address, giveBlockRewardPercentage?: number, giveDelegateRewardPercentage?: number): AccountBlockTemplate;
    registerLegacy(name: string, producerAddress: Address, rewardAddress: Address, publicKey: string, signature: string, giveBlockRewardPercentage?: number, giveDelegateRewardPercentage?: number): AccountBlockTemplate;
    updatePillar(name: string, producerAddress: Address, rewardAddress: Address, giveBlockRewardPercentage?: number, giveDelegateRewardPercentage?: number): AccountBlockTemplate;
    revoke(name: string): AccountBlockTemplate;
    delegate(name: string): AccountBlockTemplate;
    undelegate(): AccountBlockTemplate;
    collectRewards(): AccountBlockTemplate;
    depositQsr(amount: BigNumber): AccountBlockTemplate;
    withdrawQsr(): AccountBlockTemplate;
}
//# sourceMappingURL=pillar.d.ts.map