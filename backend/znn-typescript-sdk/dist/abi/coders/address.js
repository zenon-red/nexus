// @ts-nocheck
import { Buffer } from "buffer";
import { hexlify } from "../../utilities/bytes.js";
import { Address } from "../../model/primitives/index.js";
import { Coder } from "./abstract-coder.js";
export class AddressCoder extends Coder {
    constructor(localName) {
        super("address", "address", localName, false);
        this.size = 20;
    }
    defaultValue() {
        return "0x0000000000000000000000000000000000000000";
    }
    encode(writer, value) {
        try {
            const address = Address.parse(value);
            return writer.writeValue(hexlify(address.getBytes()));
        }
        catch (error) {
            this._throwError(error.message, value);
        }
    }
    decode(reader) {
        const core = reader.readBytes(32).slice(32 - this.size);
        try {
            const addr = Address.fromCore(Buffer.from(core));
            return addr.toString();
        }
        catch (error) {
            this._throwError(error.message, core);
        }
    }
}
//# sourceMappingURL=address.js.map