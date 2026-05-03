import { Api } from "../base.js";
import { Address } from "../../model/primitives/index.js";
import { SentinelInfo, SentinelInfoList, RewardHistoryList, UncollectedReward } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
export declare class SentinelApi extends Api {
    getAllActive(pageIndex?: number, pageSize?: number): Promise<SentinelInfoList>;
    getByOwner(owner: Address): Promise<SentinelInfo | null>;
    getDepositedQsr(address: Address): Promise<BigNumber>;
    getUncollectedReward(address: Address): Promise<UncollectedReward>;
    getFrontierRewardByPage(address: Address, pageIndex?: number, pageSize?: number): Promise<RewardHistoryList>;
    register(): AccountBlockTemplate;
    revoke(): AccountBlockTemplate;
    collectRewards(): AccountBlockTemplate;
    depositQsr(amount: BigNumber): AccountBlockTemplate;
    withdrawQsr(): AccountBlockTemplate;
}
//# sourceMappingURL=sentinel.d.ts.map