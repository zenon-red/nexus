// @ts-nocheck
import { arrayify, hexlify } from "../../utilities/bytes.js";
import { Coder } from "./abstract-coder.js";
export class HashCoder extends Coder {
    constructor(localName) {
        super("hash", "hash", localName, false);
        this.size = 32;
    }
    defaultValue() {
        return "0x0000000000000000000000000000000000000000000000000000000000000000";
    }
    encode(writer, value) {
        const data = arrayify(value);
        if (data.length !== this.size) {
            this._throwError("incorrect data length", value);
        }
        return writer.writeValue(data);
    }
    decode(reader) {
        return reader.coerce(this.name, hexlify(reader.readBytes(this.size)));
    }
}
//# sourceMappingURL=hash.js.map