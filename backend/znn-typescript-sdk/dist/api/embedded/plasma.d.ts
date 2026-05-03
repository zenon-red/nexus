import { BigNumberish } from "../../utilities/bignumber.js";
import { Api } from "../base.js";
import { FusionEntryList, GetRequiredPowParam, GetRequiredPowResponse, PlasmaInfo } from "../../model/embedded/plasma.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
import { Address, Hash } from "../../model/primitives/index.js";
export declare class PlasmaApi extends Api {
    get(address: Address): Promise<PlasmaInfo>;
    getEntriesByAddress(address: Address, pageIndex?: number, pageSize?: number): Promise<FusionEntryList>;
    getRequiredPoWForAccountBlock(powParam: GetRequiredPowParam): Promise<GetRequiredPowResponse>;
    fuse(beneficiary: Address, amount: BigNumberish): AccountBlockTemplate;
    cancel(id: Hash): AccountBlockTemplate;
}
//# sourceMappingURL=plasma.d.ts.map