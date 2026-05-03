import { ZnnSDKException } from "../exception.js";
export class ZnnClientException extends ZnnSDKException {
    constructor(message, code, method, params, data) {
        super(message);
        this.name = "ZnnClientException";
        this.code = code;
        this.method = method;
        this.params = params;
        this.data = data;
    }
    toString() {
        let errorMsg = `${this.name} [${this.code}]: ${this.message}`;
        if (this.method) {
            errorMsg += `\n  Method: ${this.method}`;
        }
        if (this.params) {
            errorMsg += `\n  Params: ${JSON.stringify(this.params)}`;
        }
        if (this.data) {
            errorMsg += `\n  Data: ${JSON.stringify(this.data)}`;
        }
        return errorMsg;
    }
}
//# sourceMappingURL=errors.js.map