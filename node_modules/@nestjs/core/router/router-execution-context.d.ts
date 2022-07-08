import { CanActivate, HttpServer, ParamData, PipeTransform, RequestMethod } from '@nestjs/common';
import { RouteParamMetadata } from '@nestjs/common/decorators';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { ContextType, Controller } from '@nestjs/common/interfaces';
import { GuardsConsumer } from '../guards/guards-consumer';
import { GuardsContextCreator } from '../guards/guards-context-creator';
import { ExecutionContextHost } from '../helpers/execution-context-host';
import { HandleResponseFn, HandlerMetadata } from '../helpers/handler-metadata-storage';
import { InterceptorsConsumer } from '../interceptors/interceptors-consumer';
import { InterceptorsContextCreator } from '../interceptors/interceptors-context-creator';
import { PipesConsumer } from '../pipes/pipes-consumer';
import { PipesContextCreator } from '../pipes/pipes-context-creator';
import { IRouteParamsFactory } from './interfaces/route-params-factory.interface';
import { CustomHeader, RedirectResponse } from './router-response-controller';
export interface ParamProperties {
    index: number;
    type: RouteParamtypes | string;
    data: ParamData;
    pipes: PipeTransform[];
    extractValue: <TRequest, TResponse>(req: TRequest, res: TResponse, next: Function) => any;
}
export declare class RouterExecutionContext {
    private readonly paramsFactory;
    private readonly pipesContextCreator;
    private readonly pipesConsumer;
    private readonly guardsContextCreator;
    private readonly guardsConsumer;
    private readonly interceptorsContextCreator;
    private readonly interceptorsConsumer;
    readonly applicationRef: HttpServer;
    private readonly handlerMetadataStorage;
    private readonly contextUtils;
    private readonly responseController;
    constructor(paramsFactory: IRouteParamsFactory, pipesContextCreator: PipesContextCreator, pipesConsumer: PipesConsumer, guardsContextCreator: GuardsContextCreator, guardsConsumer: GuardsConsumer, interceptorsContextCreator: InterceptorsContextCreator, interceptorsConsumer: InterceptorsConsumer, applicationRef: HttpServer);
    create(instance: Controller, callback: (...args: any[]) => unknown, methodName: string, moduleKey: string, requestMethod: RequestMethod, contextId?: import("..").ContextId, inquirerId?: string): <TRequest, TResponse>(req: TRequest, res: TResponse, next: Function) => Promise<void>;
    getMetadata<TContext extends ContextType = ContextType>(instance: Controller, callback: (...args: any[]) => any, methodName: string, moduleKey: string, requestMethod: RequestMethod, contextType: TContext): HandlerMetadata;
    reflectRedirect(callback: (...args: unknown[]) => unknown): RedirectResponse;
    reflectHttpStatusCode(callback: (...args: unknown[]) => unknown): number;
    reflectRenderTemplate(callback: (...args: unknown[]) => unknown): string;
    reflectResponseHeaders(callback: (...args: unknown[]) => unknown): CustomHeader[];
    reflectSse(callback: (...args: unknown[]) => unknown): string;
    exchangeKeysForValues(keys: string[], metadata: Record<number, RouteParamMetadata>, moduleContext: string, contextId?: import("..").ContextId, inquirerId?: string, contextFactory?: (args: unknown[]) => ExecutionContextHost): ParamProperties[];
    getParamValue<T>(value: T, { metatype, type, data, }: {
        metatype: unknown;
        type: RouteParamtypes;
        data: unknown;
    }, pipes: PipeTransform[]): Promise<unknown>;
    isPipeable(type: number | string): boolean;
    createGuardsFn<TContext extends string = ContextType>(guards: CanActivate[], instance: Controller, callback: (...args: any[]) => any, contextType?: TContext): (args: any[]) => Promise<void> | null;
    createPipesFn(pipes: PipeTransform[], paramsOptions: (ParamProperties & {
        metatype?: any;
    })[]): <TRequest, TResponse>(args: any[], req: TRequest, res: TResponse, next: Function) => Promise<void>;
    createHandleResponseFn(callback: (...args: unknown[]) => unknown, isResponseHandled: boolean, redirectResponse?: RedirectResponse, httpStatusCode?: number): HandleResponseFn;
    private isResponseHandled;
}
