import { CanActivate } from '@nestjs/common';
import { ContextType, Controller } from '@nestjs/common/interfaces';
import { Observable } from 'rxjs';
import { ExecutionContextHost } from '../helpers/execution-context-host';
export declare class GuardsConsumer {
    tryActivate<TContext extends string = ContextType>(guards: CanActivate[], args: unknown[], instance: Controller, callback: (...args: unknown[]) => unknown, type?: TContext): Promise<boolean>;
    createContext(args: unknown[], instance: Controller, callback: (...args: unknown[]) => unknown): ExecutionContextHost;
    pickResult(result: boolean | Promise<boolean> | Observable<boolean>): Promise<boolean>;
}
