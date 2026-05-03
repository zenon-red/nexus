import { AccountBlockTemplate } from "../../src/model/nom/accountBlock";
export declare class Transactions {
    /**
     * Send tokens to an address
     */
    static send(to: string, amount: string, tokenStandard: string, decimals: number, walletAddress: string, password: string, nodeUrl: string, accountIndex: number): Promise<AccountBlockTemplate>;
    /**
     * Receive a transaction by hash
     */
    static receive(transactionHash: string, walletAddress: string, password: string, nodeUrl: string, accountIndex: number): Promise<AccountBlockTemplate>;
    /**
     * Receive a transaction by hash
     */
    static receiveAll(walletAddress: string, password: string, nodeUrl: string, accountIndex: number): Promise<void>;
    /**
     * Receive a transaction by hash
     */
    static autoReceive(walletAddress: string, password: string, nodeUrl: string, accountIndex: number): Promise<void>;
}
//# sourceMappingURL=transactions.d.ts.map