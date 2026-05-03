import { Address } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";
export class PillarInfo extends Model {
    constructor(name, rank, type, ownerAddress, producerAddress, withdrawAddress, giveMomentumRewardPercentage, giveDelegateRewardPercentage, isRevocable, revokeCooldown, revokeTimestamp, currentStats, weight) {
        super();
        this.name = name;
        this.rank = rank;
        this.type = type;
        this.ownerAddress = ownerAddress;
        this.producerAddress = producerAddress;
        this.withdrawAddress = withdrawAddress;
        this.giveMomentumRewardPercentage = giveMomentumRewardPercentage;
        this.giveDelegateRewardPercentage = giveDelegateRewardPercentage;
        this.isRevocable = isRevocable;
        this.revokeCooldown = revokeCooldown;
        this.revokeTimestamp = revokeTimestamp;
        this.currentStats = currentStats;
        this.weight = weight;
    }
    static fromJson(json) {
        return new PillarInfo(json.name, json.rank, json.type ?? PillarInfo.unknownType, Address.parse(json.ownerAddress), Address.parse(json.producerAddress), Address.parse(json.withdrawAddress), json.giveMomentumRewardPercentage, json.giveDelegateRewardPercentage, json.isRevocable, json.revokeCooldown, json.revokeTimestamp, PillarEpochStats.fromJson(json.currentStats), BigNumber.from(json.weight.toString()));
    }
}
PillarInfo.unknownType = 0;
PillarInfo.legacyPillarType = 1;
PillarInfo.regularPillarType = 1;
export class PillarInfoList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new PillarInfoList(json.count, json.list.map(PillarInfo.fromJson));
    }
}
export class PillarEpochStats extends Model {
    constructor(producedMomentums, expectedMomentums) {
        super();
        this.producedMomentums = producedMomentums;
        this.expectedMomentums = expectedMomentums;
    }
    static fromJson(json) {
        return new PillarEpochStats(json.producedMomentums, json.expectedMomentums);
    }
}
export class PillarEpochHistory extends Model {
    constructor(name, epoch, giveBlockRewardPercentage, giveDelegateRewardPercentage, producedBlockNum, expectedBlockNum, weight) {
        super();
        this.name = name;
        this.epoch = epoch;
        this.giveBlockRewardPercentage = giveBlockRewardPercentage;
        this.giveDelegateRewardPercentage = giveDelegateRewardPercentage;
        this.producedBlockNum = producedBlockNum;
        this.expectedBlockNum = expectedBlockNum;
        this.weight = weight;
    }
    static fromJson(json) {
        return new PillarEpochHistory(json.name, json.epoch, json.giveBlockRewardPercentage, json.giveDelegateRewardPercentage, json.producedBlockNum, json.expectedBlockNum, BigNumber.from(json.weight.toString()));
    }
}
export class PillarEpochHistoryList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new PillarEpochHistoryList(json.count, json.list.map(PillarEpochHistory.fromJson));
    }
}
export class DelegationInfo extends Model {
    constructor(name, status, weight) {
        super();
        this.name = name;
        this.status = status;
        this.weight = weight;
    }
    static fromJson(json) {
        return new DelegationInfo(json.name, json.status, BigNumber.from(json.weight.toString()));
    }
    isPillarActive() {
        return this.status == 1;
    }
}
//# sourceMappingURL=pillar.js.map