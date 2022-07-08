import { RuntimeException } from './runtime.exception';
export declare class InvalidModuleException extends RuntimeException {
    constructor(parentModule: any, index: number, scope: any[]);
}
