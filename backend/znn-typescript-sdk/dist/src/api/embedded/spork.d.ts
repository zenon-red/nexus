import { Api } from "../base.js";
import { Hash } from "../../model/primitives/index.js";
import { SporkList } from "../../model/embedded/spork.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
export declare class SporkApi extends Api {
    getAll(pageIndex?: number, pageSize?: number): Promise<SporkList>;
    createSpork(name: string, description: string): AccountBlockTemplate;
    activateSpork(id: Hash): AccountBlockTemplate;
}
//# sourceMappingURL=spork.d.ts.map