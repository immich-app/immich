import { NestInterceptor } from '@nestjs/common';
import { ContextType, Controller } from '@nestjs/common/interfaces';
import { Observable } from 'rxjs';
import { ExecutionContextHost } from '../helpers/execution-context-host';
export declare class InterceptorsConsumer {
    intercept<TContext extends string = ContextType>(interceptors: NestInterceptor[], args: unknown[], instance: Controller, callback: (...args: unknown[]) => unknown, next: () => Promise<unknown>, type?: TContext): Promise<unknown>;
    createContext(args: unknown[], instance: Controller, callback: (...args: unknown[]) => unknown): ExecutionContextHost;
    transformDeferred(next: () => Promise<any>): Observable<any>;
}
