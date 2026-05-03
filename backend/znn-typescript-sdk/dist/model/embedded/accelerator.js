import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
import { BigNumber } from "../../utilities/bignumber.js";
import { VoteBreakdown } from "./common.js";
export var AcceleratorProjectStatus;
(function (AcceleratorProjectStatus) {
    AcceleratorProjectStatus[AcceleratorProjectStatus["voting"] = 0] = "voting";
    AcceleratorProjectStatus[AcceleratorProjectStatus["active"] = 1] = "active";
    AcceleratorProjectStatus[AcceleratorProjectStatus["paid"] = 2] = "paid";
    AcceleratorProjectStatus[AcceleratorProjectStatus["closed"] = 3] = "closed";
    AcceleratorProjectStatus[AcceleratorProjectStatus["completed"] = 4] = "completed";
})(AcceleratorProjectStatus || (AcceleratorProjectStatus = {}));
export var AcceleratorProjectVote;
(function (AcceleratorProjectVote) {
    AcceleratorProjectVote[AcceleratorProjectVote["yes"] = 0] = "yes";
    AcceleratorProjectVote[AcceleratorProjectVote["no"] = 1] = "no";
    AcceleratorProjectVote[AcceleratorProjectVote["abstain"] = 2] = "abstain";
})(AcceleratorProjectVote || (AcceleratorProjectVote = {}));
export class AcceleratorProject extends Model {
    constructor(id, name, description, url, znnFundsNeeded, qsrFundsNeeded, creationTimestamp, statusInt, voteBreakdown) {
        super();
        this.id = id;
        this.name = name;
        this.description = description;
        this.url = url;
        this.znnFundsNeeded = znnFundsNeeded;
        this.qsrFundsNeeded = qsrFundsNeeded;
        this.creationTimestamp = creationTimestamp;
        this.statusInt = statusInt;
        this.voteBreakdown = voteBreakdown;
    }
    get status() {
        return this.statusInt;
    }
}
export class Phase extends AcceleratorProject {
    constructor(id, projectId, name, description, url, znnFundsNeeded, qsrFundsNeeded, creationTimestamp, acceptedTimestamp, statusInt, voteBreakdown) {
        super(id, name, description, url, znnFundsNeeded, qsrFundsNeeded, creationTimestamp, statusInt, voteBreakdown);
        this.projectId = projectId;
        this.acceptedTimestamp = acceptedTimestamp;
    }
    static fromJson(json) {
        return new Phase(Hash.parse(json.phase.id), Hash.parse(json.phase.projectID), json.phase.name, json.phase.description, json.phase.url, BigNumber.from(json.phase.znnFundsNeeded.toString()), BigNumber.from(json.phase.qsrFundsNeeded.toString()), json.phase.creationTimestamp, json.phase.acceptedTimestamp, json.phase.status, VoteBreakdown.fromJson(json.votes));
    }
}
export class Project extends AcceleratorProject {
    constructor(id, name, owner, description, url, znnFundsNeeded, qsrFundsNeeded, creationTimestamp, lastUpdateTimestamp, statusInt, phaseIds, voteBreakdown, phases) {
        super(id, name, description, url, znnFundsNeeded, qsrFundsNeeded, creationTimestamp, statusInt, voteBreakdown);
        this.owner = owner;
        this.lastUpdateTimestamp = lastUpdateTimestamp;
        this.phaseIds = phaseIds;
        this.phases = phases;
    }
    static fromJson(json) {
        return new Project(Hash.parse(json.id), json.name, Address.parse(json.owner), json.description, json.url, BigNumber.from(json.znnFundsNeeded.toString()), BigNumber.from(json.qsrFundsNeeded.toString()), json.creationTimestamp, json.lastUpdateTimestamp, json.status, json.phaseIds.map(phaseId => Hash.parse(phaseId)), VoteBreakdown.fromJson(json.votes), json.phases.map(Phase.fromJson));
    }
    getPaidZnnFunds() {
        let amount = BigNumber.from(0);
        this.phases.forEach(phase => {
            if (phase.status === AcceleratorProjectStatus.paid) {
                amount = amount.add(phase.znnFundsNeeded);
            }
        });
        return amount;
    }
    getPendingZnnFunds() {
        if (this.phases.length === 0)
            return BigNumber.from(0);
        const lastPhase = this.getLastPhase();
        if (lastPhase && lastPhase.status === AcceleratorProjectStatus.active) {
            return lastPhase.znnFundsNeeded;
        }
        return BigNumber.from(0);
    }
    getRemainingZnnFunds() {
        if (this.phases.length === 0)
            return this.znnFundsNeeded;
        return this.znnFundsNeeded.minus(this.getPaidZnnFunds());
    }
    getTotalZnnFunds() {
        return this.znnFundsNeeded;
    }
    getPaidQsrFunds() {
        let amount = BigNumber.from(0);
        this.phases.forEach(phase => {
            if (phase.status === AcceleratorProjectStatus.paid) {
                amount = amount.add(phase.qsrFundsNeeded);
            }
        });
        return amount;
    }
    getPendingQsrFunds() {
        if (this.phases.length === 0)
            return BigNumber.from(0);
        const lastPhase = this.getLastPhase();
        if (lastPhase && lastPhase.status === AcceleratorProjectStatus.active) {
            return lastPhase.qsrFundsNeeded;
        }
        return BigNumber.from(0);
    }
    getRemainingQsrFunds() {
        if (this.phases.length === 0)
            return this.qsrFundsNeeded;
        return this.qsrFundsNeeded.minus(this.getPaidQsrFunds());
    }
    getTotalQsrFunds() {
        return this.qsrFundsNeeded;
    }
    findPhaseById(id) {
        for (let i = 0; i < this.phaseIds.length; i++) {
            if (id.toString() === this.phaseIds[i].toString()) {
                return this.phases[i];
            }
        }
        return null;
    }
    getLastPhase() {
        if (this.phases.length === 0)
            return null;
        return this.phases[this.phases.length - 1];
    }
}
export class ProjectList extends Model {
    constructor(count, list) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new ProjectList(json.count, json.list.map(Project.fromJson));
    }
    findId(id) {
        for (let i = 0; i < this.list.length; i++) {
            if (this.list[i].id.toString() === id.toString()) {
                return this.list[i];
            }
        }
        return null;
    }
    findProjectByPhaseId(id) {
        for (let i = 0; i < this.list.length; i++) {
            for (let j = 0; j < this.list[i].phaseIds.length; j++) {
                if (id.toString() === this.list[i].phaseIds[j].toString()) {
                    return this.list[i];
                }
            }
        }
        return null;
    }
}
//# sourceMappingURL=accelerator.js.map