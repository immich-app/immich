import { ArgumentMetadata, PipeTransform } from '../interfaces/features/pipe-transform.interface';
/**
 * Defines the built-in DefaultValue Pipe
 *
 * @see [Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)
 *
 * @publicApi
 */
export declare class DefaultValuePipe<T = any, R = any> implements PipeTransform<T, T | R> {
    protected readonly defaultValue: R;
    constructor(defaultValue: R);
    transform(value?: T, _metadata?: ArgumentMetadata): T | R;
}
