import { ArgumentsHost } from '@nestjs/common';
export declare class ExternalExceptionFilter<T = any, R = any> {
    private static readonly logger;
    catch(exception: T, host: ArgumentsHost): R | Promise<R>;
}
