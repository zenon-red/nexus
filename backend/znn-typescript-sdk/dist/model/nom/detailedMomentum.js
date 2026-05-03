import { Model } from "../base.js";
import { AccountBlock } from "./accountBlock.js";
import { Momentum } from "./momentum.js";
export class DetailedMomentum extends Model {
    constructor(blocks = [], momentum) {
        super();
        this.blocks = blocks;
        this.momentum = momentum;
    }
    static fromJson(json) {
        return new DetailedMomentum(json.blocks.map((item) => AccountBlock.fromJson(item)), Momentum.fromJson(json.momentum));
    }
}
export class DetailedMomentumList extends Model {
    constructor(count = 0, list = []) {
        super();
        this.count = count;
        this.list = list;
    }
    static fromJson(json) {
        return new DetailedMomentumList(json.count, json.list.map(DetailedMomentum.fromJson));
    }
}
//# sourceMappingURL=detailedMomentum.js.map