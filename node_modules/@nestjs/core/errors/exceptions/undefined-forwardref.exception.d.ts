import { RuntimeException } from './runtime.exception';
import { Type } from '@nestjs/common';
export declare class UndefinedForwardRefException extends RuntimeException {
    constructor(scope: Type<any>[]);
}
