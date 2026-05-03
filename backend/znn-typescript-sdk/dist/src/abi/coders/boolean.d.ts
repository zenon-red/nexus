import { Coder, Reader, Writer } from "./abstract-coder.js";
export declare class BooleanCoder extends Coder {
    constructor(localName: string);
    defaultValue(): boolean;
    encode(writer: Writer, value: boolean): number;
    decode(reader: Reader): any;
}
//# sourceMappingURL=boolean.d.ts.map