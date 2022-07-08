import { Type } from '../interfaces';
import { ArgumentMetadata, PipeTransform } from '../interfaces/features/pipe-transform.interface';
import { ValidationPipe, ValidationPipeOptions } from './validation.pipe';
export interface ParseArrayOptions extends Omit<ValidationPipeOptions, 'transform' | 'validateCustomDecorators' | 'exceptionFactory'> {
    items?: Type<unknown>;
    separator?: string;
    optional?: boolean;
    exceptionFactory?: (error: any) => any;
}
/**
 * Defines the built-in ParseArray Pipe
 *
 * @see [Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)
 *
 * @publicApi
 */
export declare class ParseArrayPipe implements PipeTransform {
    protected readonly options: ParseArrayOptions;
    protected readonly validationPipe: ValidationPipe;
    protected exceptionFactory: (error: string) => any;
    constructor(options?: ParseArrayOptions);
    /**
     * Method that accesses and performs optional transformation on argument for
     * in-flight requests.
     *
     * @param value currently processed route argument
     * @param metadata contains metadata about the currently processed route argument
     */
    transform(value: any, metadata: ArgumentMetadata): Promise<any>;
    protected isExpectedTypePrimitive(): boolean;
    protected validatePrimitive(originalValue: any, index?: number): any;
}
