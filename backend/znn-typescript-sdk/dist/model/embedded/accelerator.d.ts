import { Address, Hash } from "../primitives/index.js";
import { Model } from "../base.js";
import { VoteBreakdown } from "./common.js";
export declare enum AcceleratorProjectStatus {
    voting = 0,
    active = 1,
    paid = 2,
    closed = 3,
    completed = 4
}
export declare enum AcceleratorProjectVote {
    yes = 0,
    no = 1,
    abstain = 2
}
export declare abstract class AcceleratorProject extends Model {
    id: Hash;
    name: string;
    description: string;
    url: string;
    znnFundsNeeded: BigNumber;
    qsrFundsNeeded: BigNumber;
    creationTimestamp: number;
    statusInt: number;
    voteBreakdown: VoteBreakdown;
    protected constructor(id: Hash, name: string, description: string, url: string, znnFundsNeeded: BigNumber, qsrFundsNeeded: BigNumber, creationTimestamp: number, statusInt: number, voteBreakdown: VoteBreakdown);
    get status(): AcceleratorProjectStatus;
}
export declare class Phase extends AcceleratorProject {
    projectId: Hash;
    acceptedTimestamp: number;
    constructor(id: Hash, projectId: Hash, name: string, description: string, url: string, znnFundsNeeded: BigNumber, qsrFundsNeeded: BigNumber, creationTimestamp: number, acceptedTimestamp: number, statusInt: number, voteBreakdown: VoteBreakdown);
    static fromJson(json: {
        [key: string]: any;
    }): Phase;
}
export declare class Project extends AcceleratorProject {
    owner: Address;
    lastUpdateTimestamp: number;
    phaseIds: Array<Hash>;
    phases: Array<Phase>;
    constructor(id: Hash, name: string, owner: Address, description: string, url: string, znnFundsNeeded: BigNumber, qsrFundsNeeded: BigNumber, creationTimestamp: number, lastUpdateTimestamp: number, statusInt: number, phaseIds: Array<Hash>, voteBreakdown: VoteBreakdown, phases: Array<Phase>);
    static fromJson(json: {
        [key: string]: any;
    }): Project;
    getPaidZnnFunds(): BigNumber;
    getPendingZnnFunds(): BigNumber;
    getRemainingZnnFunds(): BigNumber;
    getTotalZnnFunds(): BigNumber;
    getPaidQsrFunds(): BigNumber;
    getPendingQsrFunds(): BigNumber;
    getRemainingQsrFunds(): BigNumber;
    getTotalQsrFunds(): BigNumber;
    findPhaseById(id: Hash): Phase | null;
    getLastPhase(): Phase | null;
}
export declare class ProjectList extends Model {
    count: number;
    list: Array<Project>;
    constructor(count: number, list: Array<Project>);
    static fromJson(json: {
        [key: string]: any;
    }): ProjectList;
    findId(id: Hash): Project | null;
    findProjectByPhaseId(id: Hash): Project | null;
}
//# sourceMappingURL=accelerator.d.ts.map