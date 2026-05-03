// @ts-nocheck
import { toUtf8Bytes, toUtf8String } from "../../utilities/utf8.js";
import { DynamicBytesCoder } from "./bytes.js";
export class StringCoder extends DynamicBytesCoder {
    constructor(localName) {
        super("string", localName);
    }
    defaultValue() {
        return "";
    }
    encode(writer, value) {
        return super.encode(writer, toUtf8Bytes(value));
    }
    decode(reader) {
        return toUtf8String(super.decode(reader));
    }
}
//# sourceMappingURL=string.js.map