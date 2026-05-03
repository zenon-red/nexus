// @ts-nocheck
import { Buffer } from "buffer";
import { hexlify } from "../../utilities/bytes.js";
import { TokenStandard } from "../../model/primitives/tokenStandard.js";
import { Coder } from "./abstract-coder.js";
export class TokenStandardCoder extends Coder {
    constructor(localName) {
        super("tokenStandard", "tokenStandard", localName, false);
        this.size = 10;
    }
    defaultValue() {
        return "0x00000000000000000000";
    }
    encode(writer, value) {
        try {
            const tokenStandard = TokenStandard.parse(value);
            return writer.writeValue(hexlify(tokenStandard.getBytes()));
        }
        catch (error) {
            this._throwError(error.message, value);
        }
    }
    decode(reader) {
        const core = reader.readBytes(32).slice(32 - this.size);
        try {
            const tokenStandard = TokenStandard.fromCore(Buffer.from(core));
            return tokenStandard.toString();
        }
        catch (error) {
            this._throwError(error.message, core);
        }
    }
}
//# sourceMappingURL=token-standard.js.map