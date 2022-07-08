import { HttpException } from '@nestjs/common';
import { ExceptionFilterMetadata } from '@nestjs/common/interfaces/exceptions/exception-filter-metadata.interface';
import { ArgumentsHost } from '@nestjs/common/interfaces/features/arguments-host.interface';
import { BaseExceptionFilter } from './base-exception-filter';
export declare class ExceptionsHandler extends BaseExceptionFilter {
    private filters;
    next(exception: Error | HttpException | any, ctx: ArgumentsHost): void;
    setCustomFilters(filters: ExceptionFilterMetadata[]): void;
    invokeCustomFilters<T = any>(exception: T, ctx: ArgumentsHost): boolean;
}
