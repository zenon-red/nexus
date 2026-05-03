import { Logger } from "../utilities/logger.js";
const logger = Logger.globalLogger();
/**
 * Base class for all API classes providing client management
 */
export class Api {
    setClient(client) {
        this.client = client;
    }
    /**
     * Validates that a value is greater than or equal to a minimum
     */
    validateMin(value, min, paramName) {
        if (value < min) {
            logger.throwArgumentError(`invalid ${paramName}, must be ${min} or greater`, paramName, value);
        }
    }
    /**
     * Validates that a value is less than or equal to a maximum
     */
    validateMax(value, max, paramName) {
        if (value > max) {
            logger.throwArgumentError(`invalid ${paramName}, must be ${max} or less`, paramName, value);
        }
    }
    /**
     * Validates that a value is within a range (inclusive)
     */
    validateRange(value, min, max, paramName) {
        this.validateMin(value, min, paramName);
        this.validateMax(value, max, paramName);
    }
}
//# sourceMappingURL=base.js.map