import { ZnnSDKException } from "../exception.js";
export class ZnnBlockUtilitiesException extends ZnnSDKException {
    constructor(message) {
        super(message);
        this.name = "ZnnBlockUtilitiesException";
    }
}
//# sourceMappingURL=errors.js.map