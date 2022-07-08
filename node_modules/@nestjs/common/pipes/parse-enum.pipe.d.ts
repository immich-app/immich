import { ArgumentMetadata } from '../index';
import { PipeTransform } from '../interfaces/features/pipe-transform.interface';
import { ErrorHttpStatusCode } from '../utils/http-error-by-code.util';
export interface ParseEnumPipeOptions {
    errorHttpStatusCode?: ErrorHttpStatusCode;
    exceptionFactory?: (error: string) => any;
}
/**
 * Defines the built-in ParseEnum Pipe
 *
 * @see [Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)
 *
 * @publicApi
 */
export declare class ParseEnumPipe<T = any> implements PipeTransform<T> {
    protected readonly enumType: T;
    protected exceptionFactory: (error: string) => any;
    constructor(enumType: T, options?: ParseEnumPipeOptions);
    /**
     * Method that accesses and performs optional transformation on argument for
     * in-flight requests.
     *
     * @param value currently processed route argument
     * @param metadata contains metadata about the currently processed route argument
     */
    transform(value: T, metadata: ArgumentMetadata): Promise<T>;
    protected isEnum(value: T): boolean;
}
