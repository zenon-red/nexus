export interface WalletInfo {
    address: string;
    fileName: string;
    filePath: string;
}
/**
 * CLI-specific file system storage utility
 * Provides file operations and wallet management for CLI applications
 */
export declare class Storage {
    private static walletDirectory?;
    /**
     * Ensure a directory exists, creating it if necessary
     */
    private static ensureDirectory;
    /**
     * List all files in a directory
     */
    private static listFiles;
    /**
     * Read file contents as a string
     */
    private static readFile;
    /**
     * Write string data to a file
     */
    private static writeFile;
    /**
     * Delete a file if it exists
     */
    private static deleteFile;
    /**
     * Check if a file exists
     */
    private static fileExists;
    /**
     * Copy a file from source to destination
     */
    private static copyFile;
    /**
     * Get the default wallet directory path based on OS
     * macOS: ~/Library/znn/wallet
     * Linux: ~/.znn/wallet
     * Windows: %APPDATA%/znn/wallet
     */
    static getDefaultWalletPath(): string;
    /**
     * Set the wallet directory path. If not set, defaults to OS-specific path.
     */
    static setWalletPath(customPath?: string): void;
    /**
     * Get the current wallet directory path
     */
    static getWalletPath(): string;
    /**
     * List all wallets in the wallet directory
     */
    static listWallets(): WalletInfo[];
    /**
     * Save a wallet to the wallet directory
     */
    static saveWallet(address: string, encryptedKeyFileData: object): void;
    /**
     * Load a wallet from the wallet directory
     */
    static loadWallet(address: string): any;
    /**
     * Check if a wallet exists
     */
    static walletExists(address: string): boolean;
    /**
     * Delete a wallet from the wallet directory
     */
    static deleteWallet(address: string): void;
    /**
     * Export a wallet to a custom destination
     */
    static exportWallet(address: string, destinationPath: string): void;
    /**
     * Get the full path to a wallet file
     */
    static getWalletFilePath(address: string): string;
}
//# sourceMappingURL=storage.d.ts.map