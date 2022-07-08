import { RuntimeException } from './runtime.exception';
export declare class UnknownExportException extends RuntimeException {
    constructor(token: string | symbol, moduleName: string);
}
