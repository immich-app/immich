import { Provider, Scope, Type } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces';
import { InstanceToken, Module } from './module';
export declare const INSTANCE_METADATA_SYMBOL: unique symbol;
export declare const INSTANCE_ID_SYMBOL: unique symbol;
export interface ContextId {
    readonly id: number;
}
export interface InstancePerContext<T> {
    instance: T;
    isResolved?: boolean;
    isPending?: boolean;
    donePromise?: Promise<void>;
}
export interface PropertyMetadata {
    key: string;
    wrapper: InstanceWrapper;
}
export declare class InstanceWrapper<T = any> {
    readonly name: any;
    readonly token: InstanceToken;
    readonly async?: boolean;
    readonly host?: Module;
    readonly isAlias: boolean;
    scope?: Scope;
    metatype: Type<T> | Function;
    inject?: FactoryProvider['inject'];
    forwardRef?: boolean;
    private readonly values;
    private readonly [INSTANCE_METADATA_SYMBOL];
    private readonly [INSTANCE_ID_SYMBOL];
    private transientMap?;
    private isTreeStatic;
    constructor(metadata?: Partial<InstanceWrapper<T>> & Partial<InstancePerContext<T>>);
    get id(): string;
    set instance(value: T);
    get instance(): T;
    get isNotMetatype(): boolean;
    get isTransient(): boolean;
    getInstanceByContextId(contextId: ContextId, inquirerId?: string): InstancePerContext<T>;
    getInstanceByInquirerId(contextId: ContextId, inquirerId: string): InstancePerContext<T>;
    setInstanceByContextId(contextId: ContextId, value: InstancePerContext<T>, inquirerId?: string): void;
    setInstanceByInquirerId(contextId: ContextId, inquirerId: string, value: InstancePerContext<T>): void;
    addCtorMetadata(index: number, wrapper: InstanceWrapper): void;
    getCtorMetadata(): InstanceWrapper[];
    addPropertiesMetadata(key: string, wrapper: InstanceWrapper): void;
    getPropertiesMetadata(): PropertyMetadata[];
    addEnhancerMetadata(wrapper: InstanceWrapper): void;
    getEnhancersMetadata(): InstanceWrapper[];
    isDependencyTreeStatic(lookupRegistry?: string[]): boolean;
    cloneStaticInstance(contextId: ContextId): InstancePerContext<T>;
    cloneTransientInstance(contextId: ContextId, inquirerId: string): InstancePerContext<T>;
    createPrototype(contextId: ContextId): any;
    isInRequestScope(contextId: ContextId, inquirer?: InstanceWrapper | undefined): boolean;
    isLazyTransient(contextId: ContextId, inquirer: InstanceWrapper | undefined): boolean;
    isExplicitlyRequested(contextId: ContextId, inquirer?: InstanceWrapper): boolean;
    isStatic(contextId: ContextId, inquirer: InstanceWrapper | undefined): boolean;
    getStaticTransientInstances(): InstancePerContext<T>[];
    mergeWith(provider: Provider): void;
    private isNewable;
    private isWrapperListStatic;
    private initialize;
}
