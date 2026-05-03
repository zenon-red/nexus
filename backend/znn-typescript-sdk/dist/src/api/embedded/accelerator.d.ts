import { Api } from "../base.js";
import { Hash, TokenStandard } from "../../model/primitives/index.js";
import { Project, Phase, ProjectList, PillarVote, VoteBreakdown } from "../../model/embedded/index.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
export declare class AcceleratorApi extends Api {
    getAll(pageIndex?: number, pageSize?: number): Promise<ProjectList>;
    getProjectById(id: string): Promise<Project>;
    getPhaseById(id: Hash): Promise<Phase>;
    getPillarVotes(name: string, hashes: string[]): Promise<(PillarVote | null)[]>;
    getVoteBreakdown(id: Hash): Promise<VoteBreakdown>;
    createProject(name: string, description: string, url: string, znnFundsNeeded: BigNumber, qsrFundsNeeded: BigNumber): AccountBlockTemplate;
    addPhase(id: Hash, name: string, description: string, url: string, znnFundsNeeded: BigNumber, qsrFundsNeeded: BigNumber): AccountBlockTemplate;
    updatePhase(id: Hash, name: string, description: string, url: string, znnFundsNeeded: BigNumber, qsrFundsNeeded: BigNumber): AccountBlockTemplate;
    donate(amount: BigNumber, zts: TokenStandard): AccountBlockTemplate;
    voteByName(id: Hash, pillarName: string, vote: number): AccountBlockTemplate;
    voteByProdAddress(id: Hash, vote: number): AccountBlockTemplate;
}
//# sourceMappingURL=accelerator.d.ts.map