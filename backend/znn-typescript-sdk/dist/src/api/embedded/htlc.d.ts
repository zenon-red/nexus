import { Api } from "../base.js";
import { Address, Hash, TokenStandard } from "../../model/primitives/index.js";
import { HtlcInfo } from "../../model/embedded/htlc.js";
import { AccountBlockTemplate } from "../../model/nom/accountBlock.js";
export declare class HtlcApi extends Api {
    getById(id: Hash): Promise<HtlcInfo>;
    getProxyUnlockStatus(address: Address): Promise<boolean>;
    create(token: TokenStandard, amount: BigNumber, hashLocked: Address, expirationTime: number, hashType: number, keyMaxSize: number, hashLock: Uint8Array | null): AccountBlockTemplate;
    reclaim(id: Hash): AccountBlockTemplate;
    unlock(id: Hash, preimage: Uint8Array | null): AccountBlockTemplate;
    denyProxyUnlock(): AccountBlockTemplate;
    allowProxyUnlock(): AccountBlockTemplate;
}
//# sourceMappingURL=htlc.d.ts.map