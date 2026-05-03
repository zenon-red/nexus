import { Hash } from "../primitives/index.js";
import { Model } from "../base.js";
export declare class Spork extends Model {
    id: Hash;
    name: string;
    description: string;
    activated: boolean;
    enforcementHeight: number;
    constructor(id: Hash, name: string, description: string, activated: boolean, enforcementHeight: number);
    static fromJson(json: {
        [key: string]: any;
    }): Spork;
}
export declare class SporkList extends Model {
    count: number;
    list: Array<Spork>;
    constructor(count: number, list: Array<Spork>);
    static fromJson(json: {
        [key: string]: any;
    }): SporkList;
}
//# sourceMappingURL=spork.d.ts.map