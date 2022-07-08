import { ArgumentMetadata, PipeTransform } from '../interfaces/features/pipe-transform.interface';
import { ErrorHttpStatusCode } from '../utils/http-error-by-code.util';
export interface ParseUUIDPipeOptions {
    version?: '3' | '4' | '5';
    errorHttpStatusCode?: ErrorHttpStatusCode;
    exceptionFactory?: (errors: string) => any;
}
export declare class ParseUUIDPipe implements PipeTransform<string> {
    private readonly version;
    protected exceptionFactory: (errors: string) => any;
    constructor(options?: ParseUUIDPipeOptions);
    transform(value: string, metadata: ArgumentMetadata): Promise<string>;
}
