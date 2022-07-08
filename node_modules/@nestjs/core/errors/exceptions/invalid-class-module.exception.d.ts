import { RuntimeException } from './runtime.exception';
export declare class InvalidClassModuleException extends RuntimeException {
    constructor(metatypeUsedAsAModule: any, scope: any[]);
}
