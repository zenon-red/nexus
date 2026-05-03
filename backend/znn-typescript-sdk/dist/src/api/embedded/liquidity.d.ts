import { Api } from "../base.js";
import { Address, Hash, TokenStandard } from "../../model/primitives/index.js";
import { LiquidityInfo, LiquidityStakeList, TimeChallengesList, RewardDeposit, RewardHistoryList, SecurityInfo } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
export declare class LiquidityApi extends Api {
    getLiquidityInfo(): Promise<LiquidityInfo>;
    getLiquidityStakeEntriesByAddress(address: Address, pageIndex?: number, pageSize?: number): Promise<LiquidityStakeList>;
    getUncollectedReward(address: Address): Promise<RewardDeposit>;
    getFrontierRewardByPage(address: Address, pageIndex?: number, pageSize?: number): Promise<RewardHistoryList>;
    getSecurityInfo(): Promise<SecurityInfo>;
    getTimeChallengesInfo(): Promise<TimeChallengesList>;
    liquidityStake(durationInSec: number, amount: BigNumber, zts: TokenStandard): AccountBlockTemplate;
    cancelLiquidityStake(id: Hash): AccountBlockTemplate;
    unlockLiquidityStakeEntries(zts: TokenStandard): AccountBlockTemplate;
    setTokenTuple(tokenStandards: string, znnPercentages: number, qsrPercentages: number, minAmounts: BigNumber): AccountBlockTemplate;
    nominateGuardians(guardians: Address[]): AccountBlockTemplate;
    proposeAdministrator(address: Address): AccountBlockTemplate;
    setIsHalted(isHalted: boolean): AccountBlockTemplate;
    setAdditionalReward(znnReward: number, qsrReward: number): AccountBlockTemplate;
    changeAdministrator(administrator: Address): AccountBlockTemplate;
    collectReward(): AccountBlockTemplate;
    emergency(): AccountBlockTemplate;
}
//# sourceMappingURL=liquidity.d.ts.map