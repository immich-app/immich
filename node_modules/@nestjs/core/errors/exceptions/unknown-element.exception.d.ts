import { RuntimeException } from './runtime.exception';
export declare class UnknownElementException extends RuntimeException {
    constructor(name?: string | symbol);
}
