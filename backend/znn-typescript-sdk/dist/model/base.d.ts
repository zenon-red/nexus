/**
 * Base class for all model objects providing automatic JSON serialization
 */
export declare abstract class Model {
    /**
     * Converts the model instance to a plain JSON object.
     * This default implementation handles primitive types, nested Models, arrays, and Buffers.
     * Override this method in subclasses for custom serialization logic.
     */
    toJson(): {
        [key: string]: any;
    };
    /**
     * Converts the model instance to a JSON string
     */
    toString(): string;
}
//# sourceMappingURL=base.d.ts.map