import { BytesLike } from "../../utilities/bytes.js";
import { Coder, Reader, Writer } from "./abstract-coder.js";
export declare class HashCoder extends Coder {
    size: number;
    constructor(localName: string);
    defaultValue(): string;
    encode(writer: Writer, value: BytesLike): number;
    decode(reader: Reader): any;
}
//# sourceMappingURL=hash.d.ts.map