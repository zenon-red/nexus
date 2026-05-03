import { Api } from "../base.js";
import { Address, Hash } from "../../model/primitives/index.js";
import { StakeList, RewardHistoryList, UncollectedReward } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
export declare class StakeApi extends Api {
    getEntriesByAddress(address: Address, pageIndex?: number, pageSize?: number): Promise<StakeList>;
    getUncollectedReward(address: Address): Promise<UncollectedReward>;
    getFrontierRewardByPage(address: Address, pageIndex?: number, pageSize?: number): Promise<RewardHistoryList>;
    stake(durationInSec: number, amount: BigNumber): AccountBlockTemplate;
    cancel(id: Hash): AccountBlockTemplate;
    collectReward(): AccountBlockTemplate;
}
//# sourceMappingURL=stake.d.ts.map