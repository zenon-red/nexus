import { WalletInfo } from "./storage";
export declare class Manager {
    /**
     * Create a new wallet with a random mnemonic
     */
    static createNew(password: string, name?: string): Promise<{
        address: string;
        mnemonic: string;
        filePath: string;
    }>;
    /**
     * Import a wallet from a mnemonic
     */
    static createFromMnemonic(mnemonic: string, password: string, name?: string): Promise<{
        address: string;
        filePath: string;
    }>;
    /**
     * Export the mnemonic from a wallet
     */
    static dumpMnemonic(addressOrName: string, password: string): Promise<string>;
    /**
     * Derive addresses from a wallet by index range
     */
    static deriveAddresses(addressOrName: string, password: string, startIndex: number, endIndex: number): Promise<string[]>;
    /**
     * List all wallets in the wallet directory
     */
    static listWallets(): WalletInfo[];
    /**
     * Export a wallet file to a custom destination
     */
    static exportWallet(addressOrName: string, destinationPath: string): void;
    /**
     * Delete a wallet
     */
    static deleteWallet(addressOrName: string): void;
    /**
     * Check if a wallet exists
     */
    static walletExists(addressOrName: string): boolean;
    /**
     * Get wallet file path
     */
    static getWalletFilePath(addressOrName: string): string;
    /**
     * Set a custom wallet directory path
     */
    static setWalletPath(customPath?: string): void;
    /**
     * Get the current wallet directory path
     */
    static getWalletPath(): string;
}
//# sourceMappingURL=manager.d.ts.map