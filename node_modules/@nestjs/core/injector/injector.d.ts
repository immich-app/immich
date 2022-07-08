import { InjectionToken } from '@nestjs/common';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { Injectable } from '@nestjs/common/interfaces/injectable.interface';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { ContextId, InstancePerContext, InstanceWrapper, PropertyMetadata } from './instance-wrapper';
import { InstanceToken, Module } from './module';
/**
 * The type of an injectable dependency
 */
export declare type InjectorDependency = InjectionToken;
/**
 * The property-based dependency
 */
export interface PropertyDependency {
    key: string;
    name: InjectorDependency;
    isOptional?: boolean;
    instance?: any;
}
/**
 * Context of a dependency which gets injected by
 * the injector
 */
export interface InjectorDependencyContext {
    /**
     * The name of the property key (property-based injection)
     */
    key?: string | symbol;
    /**
     * The function itself, the name of the function, or injection token.
     */
    name?: Function | string | symbol;
    /**
     * The index of the dependency which gets injected
     * from the dependencies array
     */
    index?: number;
    /**
     * The dependency array which gets injected
     */
    dependencies?: InjectorDependency[];
}
export declare class Injector {
    private logger;
    loadPrototype<T>({ token }: InstanceWrapper<T>, collection: Map<InstanceToken, InstanceWrapper<T>>, contextId?: ContextId): void;
    loadInstance<T>(wrapper: InstanceWrapper<T>, collection: Map<InstanceToken, InstanceWrapper>, moduleRef: Module, contextId?: ContextId, inquirer?: InstanceWrapper): Promise<void>;
    loadMiddleware(wrapper: InstanceWrapper, collection: Map<InstanceToken, InstanceWrapper>, moduleRef: Module, contextId?: ContextId, inquirer?: InstanceWrapper): Promise<void>;
    loadController(wrapper: InstanceWrapper<Controller>, moduleRef: Module, contextId?: ContextId): Promise<void>;
    loadInjectable<T = any>(wrapper: InstanceWrapper<T>, moduleRef: Module, contextId?: ContextId, inquirer?: InstanceWrapper): Promise<void>;
    loadProvider(wrapper: InstanceWrapper<Injectable>, moduleRef: Module, contextId?: ContextId, inquirer?: InstanceWrapper): Promise<void>;
    applyDoneHook<T>(wrapper: InstancePerContext<T>): () => void;
    resolveConstructorParams<T>(wrapper: InstanceWrapper<T>, moduleRef: Module, inject: InjectorDependency[], callback: (args: unknown[]) => void | Promise<void>, contextId?: ContextId, inquirer?: InstanceWrapper, parentInquirer?: InstanceWrapper): Promise<void>;
    getClassDependencies<T>(wrapper: InstanceWrapper<T>): [InjectorDependency[], number[]];
    getFactoryProviderDependencies<T>(wrapper: InstanceWrapper<T>): [InjectorDependency[], number[]];
    reflectConstructorParams<T>(type: Type<T>): any[];
    reflectOptionalParams<T>(type: Type<T>): any[];
    reflectSelfParams<T>(type: Type<T>): any[];
    resolveSingleParam<T>(wrapper: InstanceWrapper<T>, param: Type<any> | string | symbol | any, dependencyContext: InjectorDependencyContext, moduleRef: Module, contextId?: ContextId, inquirer?: InstanceWrapper, keyOrIndex?: string | number): Promise<InstanceWrapper<any>>;
    resolveParamToken<T>(wrapper: InstanceWrapper<T>, param: Type<any> | string | symbol | any): any;
    resolveComponentInstance<T>(moduleRef: Module, token: InstanceToken, dependencyContext: InjectorDependencyContext, wrapper: InstanceWrapper<T>, contextId?: ContextId, inquirer?: InstanceWrapper, keyOrIndex?: string | number): Promise<InstanceWrapper>;
    resolveComponentHost<T>(moduleRef: Module, instanceWrapper: InstanceWrapper<T | Promise<T>>, contextId?: ContextId, inquirer?: InstanceWrapper): Promise<InstanceWrapper>;
    lookupComponent<T = any>(providers: Map<Function | string | symbol, InstanceWrapper>, moduleRef: Module, dependencyContext: InjectorDependencyContext, wrapper: InstanceWrapper<T>, contextId?: ContextId, inquirer?: InstanceWrapper, keyOrIndex?: string | number): Promise<InstanceWrapper<T>>;
    lookupComponentInParentModules<T = any>(dependencyContext: InjectorDependencyContext, moduleRef: Module, wrapper: InstanceWrapper<T>, contextId?: ContextId, inquirer?: InstanceWrapper, keyOrIndex?: string | number): Promise<any>;
    lookupComponentInImports(moduleRef: Module, name: InstanceToken, wrapper: InstanceWrapper, moduleRegistry?: any[], contextId?: ContextId, inquirer?: InstanceWrapper, keyOrIndex?: string | number, isTraversing?: boolean): Promise<any>;
    resolveProperties<T>(wrapper: InstanceWrapper<T>, moduleRef: Module, inject?: InjectorDependency[], contextId?: ContextId, inquirer?: InstanceWrapper, parentInquirer?: InstanceWrapper): Promise<PropertyDependency[]>;
    reflectProperties<T>(type: Type<T>): PropertyDependency[];
    applyProperties<T = any>(instance: T, properties: PropertyDependency[]): void;
    instantiateClass<T = any>(instances: any[], wrapper: InstanceWrapper, targetMetatype: InstanceWrapper, contextId?: ContextId, inquirer?: InstanceWrapper): Promise<T>;
    loadPerContext<T = any>(instance: T, moduleRef: Module, collection: Map<InstanceToken, InstanceWrapper>, ctx: ContextId, wrapper?: InstanceWrapper): Promise<T>;
    loadEnhancersPerContext(wrapper: InstanceWrapper, ctx: ContextId, inquirer?: InstanceWrapper): Promise<void>;
    loadCtorMetadata(metadata: InstanceWrapper<any>[], contextId: ContextId, inquirer?: InstanceWrapper, parentInquirer?: InstanceWrapper): Promise<any[]>;
    loadPropertiesMetadata(metadata: PropertyMetadata[], contextId: ContextId, inquirer?: InstanceWrapper): Promise<PropertyDependency[]>;
    private getInquirerId;
    private resolveScopedComponentHost;
    private isInquirerRequest;
    private isInquirer;
    protected addDependencyMetadata(keyOrIndex: number | string, hostWrapper: InstanceWrapper, instanceWrapper: InstanceWrapper): void;
    private getTokenName;
    private printResolvingDependenciesLog;
    private printLookingForProviderLog;
    private printFoundInModuleLog;
    private isDebugMode;
}
