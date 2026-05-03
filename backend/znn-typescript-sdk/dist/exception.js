export class ZnnSDKException extends Error {
    constructor(message) {
        super(message);
        this.name = "ZnnSDKException";
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    toString() {
        if (!this.message)
            return "Unknown Zenon SDK Exception";
        return `${this.name}: ${this.message}`;
    }
}
//# sourceMappingURL=exception.js.map