import { ContextType } from '@nestjs/common/interfaces';
import { ExternalExceptionsHandler } from '../exceptions/external-exceptions-handler';
export declare class ExternalErrorProxy {
    createProxy<TContext extends string = ContextType>(targetCallback: (...args: any[]) => any, exceptionsHandler: ExternalExceptionsHandler, type?: TContext): (...args: any[]) => Promise<any>;
}
