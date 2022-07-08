/**
 * Decorator that binds *parameter decorators* to the method that follows.
 *
 * Useful when the language doesn't provide a 'Parameter Decorator' feature
 * (i.e., vanilla JavaScript).
 *
 * @param decorators one or more parameter decorators (e.g., `Req()`)
 *
 * @publicApi
 */
export declare function Bind(...decorators: any[]): MethodDecorator;
