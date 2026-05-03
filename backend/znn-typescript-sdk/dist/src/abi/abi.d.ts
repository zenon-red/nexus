import { Interface, Result } from "./interface.js";
import { FunctionFragment } from "./fragments.js";
import { BytesLike } from "../utilities/bytes.js";
export declare class Abi extends Interface {
    constructor(definition: string | any[]);
    static from(definition: string | any[]): Abi;
    static normalizeDefinition(definition: string | any[]): any[];
    decodeFunctionData(functionFragment: FunctionFragment | string, data: BytesLike, named?: boolean): Result | any;
    _toNamedObject(functionFragment: FunctionFragment | string, decoded: Result): any;
}
//# sourceMappingURL=abi.d.ts.map