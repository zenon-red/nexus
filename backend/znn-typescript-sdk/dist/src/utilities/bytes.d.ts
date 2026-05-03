import { Buffer } from "buffer";
import { BigNumberish } from "./bignumber.js";
export type Bytes = ArrayLike<number>;
export type BytesLike = Bytes | string;
export type DataOptions = {
    allowMissingPrefix?: boolean;
    hexPad?: "left" | "right" | null;
};
export interface Hexable {
    toHexString(): string;
}
export declare function isBytesLike(value: any): value is BytesLike;
export declare function isInteger(value: any): boolean;
export declare function isBytes(value: any): value is Bytes;
export declare function isHexString(value: any, length?: number): boolean;
export declare function isObject(value: any): boolean;
export declare function concat(items: ReadonlyArray<BytesLike>): Uint8Array;
export declare function arrayify(value: BytesLike | Hexable | number, options?: DataOptions): Uint8Array;
export declare function hexlify(value: BytesLike | Hexable | number | bigint, options?: DataOptions): string;
export declare function stripZeros(value: BytesLike): Uint8Array;
export declare function zeroPad(value: BytesLike, length: number): Uint8Array;
export declare function hexDataLength(data: BytesLike): number | null;
export declare function hexDataSlice(data: BytesLike, offset: number, endOffset?: number): string;
export declare function hexConcat(items: ReadonlyArray<BytesLike>): string;
export declare function hexValue(value: BytesLike | Hexable | number | bigint): string;
export declare function hexStripZeros(value: BytesLike): string;
export declare function hexZeroPad(value: BytesLike, length: number): string;
/**
 * Convert number to Buffer of specified length (big-endian)
 */
export declare function numberToBytes(num: number, numBytes: number): Buffer;
/**
 * Convert string representation of big number to Buffer
 * Simplified to use existing utility functions
 */
export declare function stringToBytes(str: string, numBytes: number): Buffer;
export declare function numberOrStringToBytes(input: number | string | BigNumberish): Buffer;
//# sourceMappingURL=bytes.d.ts.map