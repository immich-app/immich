import { ExceptionFilterMetadata } from '@nestjs/common/interfaces/exceptions';
import { ArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
import { ExternalExceptionFilter } from './external-exception-filter';
export declare class ExternalExceptionsHandler extends ExternalExceptionFilter {
    private filters;
    next(exception: Error | any, host: ArgumentsHost): Promise<any>;
    setCustomFilters(filters: ExceptionFilterMetadata[]): void;
    invokeCustomFilters<T = any>(exception: T, host: ArgumentsHost): Promise<any> | null;
}
