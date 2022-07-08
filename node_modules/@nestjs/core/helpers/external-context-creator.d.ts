import { ParamData } from '@nestjs/common';
import { ContextType, Controller, PipeTransform } from '@nestjs/common/interfaces';
import { ExternalExceptionFilterContext } from '../exceptions/external-exception-filter-context';
import { GuardsConsumer } from '../guards/guards-consumer';
import { GuardsContextCreator } from '../guards/guards-context-creator';
import { NestContainer } from '../injector/container';
import { ContextId } from '../injector/instance-wrapper';
import { ModulesContainer } from '../injector/modules-container';
import { InterceptorsConsumer } from '../interceptors/interceptors-consumer';
import { InterceptorsContextCreator } from '../interceptors/interceptors-context-creator';
import { PipesConsumer } from '../pipes/pipes-consumer';
import { PipesContextCreator } from '../pipes/pipes-context-creator';
import { ParamProperties } from './context-utils';
import { ExternalHandlerMetadata } from './interfaces/external-handler-metadata.interface';
import { ParamsMetadata } from './interfaces/params-metadata.interface';
export interface ParamsFactory {
    exchangeKeyForValue(type: number, data: ParamData, args: any): any;
}
export interface ExternalContextOptions {
    guards?: boolean;
    interceptors?: boolean;
    filters?: boolean;
}
export declare class ExternalContextCreator {
    private readonly guardsContextCreator;
    private readonly guardsConsumer;
    private readonly interceptorsContextCreator;
    private readonly interceptorsConsumer;
    private readonly modulesContainer;
    private readonly pipesContextCreator;
    private readonly pipesConsumer;
    private readonly filtersContextCreator;
    private readonly contextUtils;
    private readonly externalErrorProxy;
    private readonly handlerMetadataStorage;
    private container;
    constructor(guardsContextCreator: GuardsContextCreator, guardsConsumer: GuardsConsumer, interceptorsContextCreator: InterceptorsContextCreator, interceptorsConsumer: InterceptorsConsumer, modulesContainer: ModulesContainer, pipesContextCreator: PipesContextCreator, pipesConsumer: PipesConsumer, filtersContextCreator: ExternalExceptionFilterContext);
    static fromContainer(container: NestContainer): ExternalContextCreator;
    create<TParamsMetadata extends ParamsMetadata = ParamsMetadata, TContext extends string = ContextType>(instance: Controller, callback: (...args: unknown[]) => unknown, methodName: string, metadataKey?: string, paramsFactory?: ParamsFactory, contextId?: ContextId, inquirerId?: string, options?: ExternalContextOptions, contextType?: TContext): (...args: any[]) => Promise<any>;
    getMetadata<TMetadata, TContext extends string = ContextType>(instance: Controller, methodName: string, metadataKey?: string, paramsFactory?: ParamsFactory, contextType?: TContext): ExternalHandlerMetadata;
    getContextModuleKey(moduleCtor: Function | undefined): string;
    exchangeKeysForValues<TMetadata = any>(keys: string[], metadata: TMetadata, moduleContext: string, paramsFactory: ParamsFactory, contextId?: ContextId, inquirerId?: string, contextFactory?: (args: unknown[]) => import("./execution-context-host").ExecutionContextHost): ParamProperties[];
    createPipesFn(pipes: PipeTransform[], paramsOptions: (ParamProperties & {
        metatype?: unknown;
    })[]): (args: unknown[], ...params: unknown[]) => Promise<void>;
    getParamValue<T>(value: T, { metatype, type, data }: {
        metatype: any;
        type: any;
        data: any;
    }, pipes: PipeTransform[]): Promise<any>;
    transformToResult(resultOrDeferred: any): Promise<any>;
    createGuardsFn<TContext extends string = ContextType>(guards: any[], instance: Controller, callback: (...args: any[]) => any, contextType?: TContext): Function | null;
    registerRequestProvider<T = any>(request: T, contextId: ContextId): void;
}
