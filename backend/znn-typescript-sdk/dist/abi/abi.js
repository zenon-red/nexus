//ts-nocheck
import { Interface } from "./interface.js";
// Lightweight extension of Interface that normalizes embedded JSON before constructing
export class Abi extends Interface {
    constructor(definition) {
        super(Abi.normalizeDefinition(definition));
    }
    static from(definition) {
        return new Abi(definition);
    }
    static normalizeDefinition(definition) {
        const arr = typeof definition === "string" ? JSON.parse(definition) : definition;
        return arr
            .filter((item) => item && item.type !== "variable")
            .map((item) => {
            if (item.type === "function"
                && item.stateMutability == null
                && item.payable == null
                && item.constant == null) {
                return { ...item, stateMutability: "nonpayable" };
            }
            return item;
        });
    }
    //Override to optionally return a named object
    decodeFunctionData(functionFragment, data, named) {
        const decoded = super.decodeFunctionData(functionFragment, data);
        if (named) {
            return this._toNamedObject(functionFragment, decoded);
        }
        return decoded;
    }
    // Helper to map a decoded Result to a plain object keyed by input names
    _toNamedObject(functionFragment, decoded) {
        const f = typeof functionFragment === "string" ? this.getFunction(functionFragment) : functionFragment;
        const obj = {};
        f.inputs.forEach((input, idx) => {
            const key = input.name ?? String(idx);
            obj[key] = decoded[idx];
        });
        return obj;
    }
}
//# sourceMappingURL=abi.js.map