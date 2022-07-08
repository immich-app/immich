import { RuntimeException } from './runtime.exception';
export declare class UndefinedModuleException extends RuntimeException {
    constructor(parentModule: any, index: number, scope: any[]);
}
