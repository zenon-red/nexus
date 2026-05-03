import { BigNumberish } from "./bignumber.js";
/**
 * Extract decimals from a number - converts human-readable amount to base units
 * @param num - The amount as BigNumberish (e.g., 1.5, "1.5", bigint)
 * @param decimals - Number of decimals (e.g., 8 for ZNN)
 * @returns BigNumber representing the amount in base units
 * @example extractNumberDecimals(1.5, 8) => BigNumber(150000000)
 */
export declare function extractNumberDecimals(num: BigNumberish, decimals: number): BigNumber;
/**
 * Add decimals to a number - converts base units to human-readable amount
 * @param num - The amount in base units as a number
 * @param decimals - Number of decimals (e.g., 8 for ZNN)
 * @returns String representing the human-readable amount
 * @example addNumberDecimals(150000000, 8) => "1.5"
 */
export declare function addNumberDecimals(num: BigNumberish, decimals: number): string;
//# sourceMappingURL=amounts.d.ts.map