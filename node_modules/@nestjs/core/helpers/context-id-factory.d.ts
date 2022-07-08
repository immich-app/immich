import { ContextId } from '../injector/instance-wrapper';
export declare function createContextId(): ContextId;
export declare class ContextIdFactory {
    /**
     * Generates a context identifier based on the request object.
     */
    static create(): ContextId;
    /**
     * Generates a random identifier to track asynchronous execution context.
     * @param request request object
     */
    static getByRequest<T extends Record<any, any> = any>(request: T): ContextId;
}
