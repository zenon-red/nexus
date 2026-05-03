import BigNumberJs from "bignumber.js";
export type BigNumberish = bigint | string | number | BigNumberJs.Value;
export declare const BigNumber: any;
export declare function fromTwos(bn: BigNumberish, width: number): BigNumber;
export declare function toTwos(bn: BigNumberish, width: number): BigNumber;
export declare function mask(bn: BigNumber, value?: BigNumberish): BigNumber;
export declare const NegativeOne: BigNumber;
export declare const Zero: BigNumber;
export declare const One: BigNumber;
export declare const Two: BigNumber;
export declare const MaxUint256: BigNumber;
export declare const MinInt256: BigNumber;
export declare const MaxInt256: BigNumber;
//# sourceMappingURL=bignumber.d.ts.map