import { Reader, Writer } from "./abstract-coder.js";
import { DynamicBytesCoder } from "./bytes.js";
export declare class StringCoder extends DynamicBytesCoder {
    constructor(localName: string);
    defaultValue(): string;
    encode(writer: Writer, value: any): number;
    decode(reader: Reader): any;
}
//# sourceMappingURL=string.d.ts.map