import { AccountBlockTemplate, AccountInfo, AccountBlock, AccountBlockList, Momentum, MomentumList, DetailedMomentumList } from "../model/nom/index.js";
import { Address, Hash } from "../model/primitives/index.js";
import { Api } from "./base.js";
export declare class LedgerApi extends Api {
    publishRawTransaction(accountBlockTemplate: AccountBlockTemplate): Promise<AccountBlockTemplate>;
    getUnconfirmedBlocksByAddress(address: Address, pageIndex?: number, pageSize?: number): Promise<AccountBlockList>;
    getUnreceivedBlocksByAddress(address: Address, pageIndex?: number, pageSize?: number): Promise<AccountBlockList>;
    getFrontierAccountBlock(address: Address): Promise<AccountBlock | null>;
    getAccountBlockByHash(hash: Hash): Promise<AccountBlock | null>;
    getAccountBlocksByHeight(address: Address, height?: number, count?: number): Promise<AccountBlockList>;
    getAccountBlocksByPage(address: Address, pageIndex?: number, pageSize?: number): Promise<AccountBlockList>;
    getAccountInfoByAddress(address: Address): Promise<AccountInfo | null>;
    getFrontierMomentum(): Promise<Momentum>;
    getMomentumBeforeTime(time: number): Promise<Momentum | null>;
    getMomentumByHash(hash: Hash): Promise<Momentum | null>;
    getMomentumsByHeight(height: number, count?: number): Promise<MomentumList>;
    getMomentumsByPage(pageIndex?: number, pageSize?: number): Promise<MomentumList>;
    getDetailedMomentumsByHeight(height?: number, count?: number): Promise<DetailedMomentumList | null>;
}
//# sourceMappingURL=ledger.d.ts.map