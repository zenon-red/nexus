import { Api } from "../base.js";
import { SwapAssetEntry, SwapAssetList, SwapLegacyPillarList } from "../../model/embedded/swap.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
export declare class SwapApi extends Api {
    getAssetsByKeyIdHash(keyIdHash: string): Promise<SwapAssetEntry | null>;
    getAssets(): Promise<SwapAssetList>;
    getLegacyPillars(): Promise<SwapLegacyPillarList>;
    retrieveAssets(pubKey: string, signature: string): AccountBlockTemplate;
}
//# sourceMappingURL=swap.d.ts.map