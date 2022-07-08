export declare function flatten<T extends Array<unknown> = any>(arr: T): T extends Array<infer R> ? R : never;
/**
 * Decorator that sets required dependencies (required with a vanilla JavaScript objects)
 */
export declare const Dependencies: (...dependencies: Array<unknown>) => ClassDecorator;
