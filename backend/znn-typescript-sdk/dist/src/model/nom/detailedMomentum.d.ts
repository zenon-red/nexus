import { Model } from "../base.js";
import { AccountBlock } from "./accountBlock.js";
import { Momentum } from "./momentum.js";
export declare class DetailedMomentum extends Model {
    blocks: Array<AccountBlock>;
    momentum: Momentum;
    constructor(blocks: Array<AccountBlock> | undefined, momentum: Momentum);
    static fromJson(json: {
        [key: string]: any;
    }): DetailedMomentum;
}
export declare class DetailedMomentumList extends Model {
    count: number;
    list: Array<DetailedMomentum>;
    constructor(count?: number, list?: Array<DetailedMomentum>);
    static fromJson(json: {
        [key: string]: any;
    }): DetailedMomentumList;
}
//# sourceMappingURL=detailedMomentum.d.ts.map