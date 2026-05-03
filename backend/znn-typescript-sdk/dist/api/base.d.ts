import { Client } from "../client/interfaces.js";
/**
 * Base class for all API classes providing client management
 */
export declare abstract class Api<T extends Client = Client> {
    client: T;
    setClient(client: T): void;
    /**
     * Validates that a value is greater than or equal to a minimum
     */
    protected validateMin(value: number, min: number, paramName: string): void;
    /**
     * Validates that a value is less than or equal to a maximum
     */
    protected validateMax(value: number, max: number, paramName: string): void;
    /**
     * Validates that a value is within a range (inclusive)
     */
    protected validateRange(value: number, min: number, max: number, paramName: string): void;
}
//# sourceMappingURL=base.d.ts.map