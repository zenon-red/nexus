import { BigNumber } from "../../utilities/bignumber.js";
import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export class UncollectedReward extends Model {
    constructor(address, znnAmount, qsrAmount) {
        super();
        this.address = address;
        this.znnAmount = znnAmount;
        this.qsrAmount = qsrAmount;
    }
    static fromJson(json) {
        return new UncollectedReward(Address.parse(json.address), BigNumber.from(json.znnAmount.toString()), BigNumber.from(json.qsrAmount.toString()));
    }
}
export class RewardHistoryEntry extends Model {
    constructor(epoch, znnAmount, qsrAmount) {
        super();
        this.epoch = epoch;
        this.znnAmount = znnAmount;
        this.qsrAmount = qsrAmount;
    }
    static fromJson(json) {
        return new RewardHistoryEntry(json.epoch, BigNumber.from(json.znnAmount.toString()), BigNumber.from(json.qsrAmount.toString()));
    }
}
export class RewardHistoryList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new RewardHistoryList(json.count, json.list.map(RewardHistoryEntry.fromJson));
    }
}
export class VoteBreakdown extends Model {
    constructor(id, yes, no, total) {
        super();
        this.id = id;
        this.yes = yes;
        this.no = no;
        this.total = total;
    }
    static fromJson(json) {
        return new VoteBreakdown(Hash.parse(json.id), json.yes, json.no, json.total);
    }
}
export class PillarVote extends Model {
    constructor(id, name, vote) {
        super();
        this.id = id;
        this.name = name;
        this.vote = vote;
    }
    static fromJson(json) {
        return new PillarVote(Hash.parse(json.id), json.name, json.vote);
    }
}
export class SecurityInfo extends Model {
    constructor(guardians, guardiansVotes, administratorDelay, softDelay) {
        super();
        this.guardians = guardians;
        this.guardiansVotes = guardiansVotes;
        this.administratorDelay = administratorDelay;
        this.softDelay = softDelay;
    }
    static fromJson(json) {
        return new SecurityInfo(json.guardians.map((guardian) => Address.parse(guardian)), json.guardiansVotes.map((guardiansVote) => Address.parse(guardiansVote)), json.administratorDelay, json.softDelay);
    }
}
export class RewardDeposit extends Model {
    constructor(address, znnAmount, qsrAmount) {
        super();
        this.address = address;
        this.znnAmount = znnAmount;
        this.qsrAmount = qsrAmount;
    }
    static fromJson(json) {
        return new RewardDeposit(Address.parse(json.address), BigNumber.from(json.znnAmount), BigNumber.from(json.qsrAmount));
    }
}
export class TimeChallengeInfo extends Model {
    constructor(methodName, paramsHash, challengeStartHeight) {
        super();
        this.methodName = methodName;
        this.paramsHash = paramsHash;
        this.challengeStartHeight = challengeStartHeight;
    }
    static fromJson(json) {
        return new TimeChallengeInfo(json.methodName, Hash.parse(json.paramsHash), json.challengeStartHeight);
    }
}
//# sourceMappingURL=common.js.map