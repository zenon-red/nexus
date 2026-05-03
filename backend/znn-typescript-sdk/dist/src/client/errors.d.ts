import { ZnnSDKException } from "../exception.js";
export declare class ZnnClientException extends ZnnSDKException {
    readonly code: number;
    readonly method?: string;
    readonly params?: any[];
    readonly data?: any;
    constructor(message: string, code: number, method?: string, params?: any[], data?: any);
    toString(): string;
}
//# sourceMappingURL=errors.d.ts.map