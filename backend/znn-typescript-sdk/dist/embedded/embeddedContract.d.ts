import { Abi } from "../abi/abi.js";
export declare abstract class EmbeddedContract {
    protected static readonly definition: string;
    private static _abiCache;
    static get abi(): Abi;
}
//# sourceMappingURL=embeddedContract.d.ts.map