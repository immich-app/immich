import { RuntimeException } from './runtime.exception';
export declare class CircularDependencyException extends RuntimeException {
    constructor(context?: string);
}
