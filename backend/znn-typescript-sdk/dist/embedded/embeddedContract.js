import { Abi } from "../abi/abi.js";
export class EmbeddedContract {
    static get abi() {
        const className = this.name;
        if (!this._abiCache.has(className)) {
            this._abiCache.set(className, Abi.from(this.definition));
        }
        return this._abiCache.get(className);
    }
}
EmbeddedContract._abiCache = new Map();
//# sourceMappingURL=embeddedContract.js.map