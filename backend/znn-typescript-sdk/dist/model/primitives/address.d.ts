import { Buffer } from "buffer";
/**
 * Represents an address for a system utilizing the bech32 encoding.
 */
export declare class Address {
    hrp: string;
    core: Buffer;
    static prefix: string;
    static userByte: number;
    static coreSize: number;
    constructor(hrp: string, core: Buffer);
    static parse(address: string): Address;
    static fromPublicKey(publicKey: Buffer): Address;
    static fromCore(address: Buffer | Uint8Array): Address;
    static isAddress(value: any): boolean;
    getBytes(): Buffer;
    toString(): string;
}
declare const EMPTY_ADDRESS: Address;
declare const PLASMA_ADDRESS: Address;
declare const PILLAR_ADDRESS: Address;
declare const TOKEN_ADDRESS: Address;
declare const SENTINEL_ADDRESS: Address;
declare const SWAP_ADDRESS: Address;
declare const STAKE_ADDRESS: Address;
declare const LIQUIDITY_ADDRESS: Address;
declare const SPORK_ADDRESS: Address;
declare const ACCELERATOR_ADDRESS: Address;
declare const BRIDGE_ADDRESS: Address;
declare const HTLC_ADDRESS: Address;
export { EMPTY_ADDRESS, PLASMA_ADDRESS, PILLAR_ADDRESS, TOKEN_ADDRESS, SENTINEL_ADDRESS, SWAP_ADDRESS, STAKE_ADDRESS, LIQUIDITY_ADDRESS, SPORK_ADDRESS, ACCELERATOR_ADDRESS, BRIDGE_ADDRESS, HTLC_ADDRESS, };
//# sourceMappingURL=address.d.ts.map