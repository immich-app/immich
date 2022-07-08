import { ClassProvider, Controller, DynamicModule, ExistingProvider, FactoryProvider, Injectable, InjectionToken, NestModule, Provider, ValueProvider } from '@nestjs/common/interfaces';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { NestContainer } from './container';
import { InstanceWrapper } from './instance-wrapper';
import { ModuleRef } from './module-ref';
/**
 * @note
 * Left for backward compatibility
 */
export declare type InstanceToken = InjectionToken;
export declare class Module {
    private readonly _metatype;
    private readonly container;
    private readonly _id;
    private readonly _imports;
    private readonly _providers;
    private readonly _injectables;
    private readonly _middlewares;
    private readonly _controllers;
    private readonly _exports;
    private _distance;
    private _token;
    constructor(_metatype: Type<any>, container: NestContainer);
    get id(): string;
    get token(): string;
    set token(token: string);
    get providers(): Map<InstanceToken, InstanceWrapper<Injectable>>;
    get middlewares(): Map<InstanceToken, InstanceWrapper<Injectable>>;
    get imports(): Set<Module>;
    /**
     * Left for backward-compatibility reasons
     */
    get relatedModules(): Set<Module>;
    /**
     * Left for backward-compatibility reasons
     */
    get components(): Map<InstanceToken, InstanceWrapper<Injectable>>;
    /**
     * Left for backward-compatibility reasons
     */
    get routes(): Map<InstanceToken, InstanceWrapper<Controller>>;
    get injectables(): Map<InstanceToken, InstanceWrapper<Injectable>>;
    get controllers(): Map<InstanceToken, InstanceWrapper<Controller>>;
    get exports(): Set<InstanceToken>;
    get instance(): NestModule;
    get metatype(): Type<any>;
    get distance(): number;
    set distance(value: number);
    addCoreProviders(): void;
    addModuleRef(): void;
    addModuleAsProvider(): void;
    addApplicationConfig(): void;
    addInjectable<T extends Injectable>(injectable: Provider, host?: Type<T>): InjectionToken;
    addProvider(provider: Provider): InjectionToken;
    isCustomProvider(provider: Provider): provider is ClassProvider | FactoryProvider | ValueProvider | ExistingProvider;
    addCustomProvider(provider: ClassProvider | FactoryProvider | ValueProvider | ExistingProvider, collection: Map<Function | string | symbol, any>): InjectionToken;
    isCustomClass(provider: any): provider is ClassProvider;
    isCustomValue(provider: any): provider is ValueProvider;
    isCustomFactory(provider: any): provider is FactoryProvider;
    isCustomUseExisting(provider: any): provider is ExistingProvider;
    isDynamicModule(exported: any): exported is DynamicModule;
    addCustomClass(provider: ClassProvider, collection: Map<InstanceToken, InstanceWrapper>): void;
    addCustomValue(provider: ValueProvider, collection: Map<Function | string | symbol, InstanceWrapper>): void;
    addCustomFactory(provider: FactoryProvider, collection: Map<Function | string | symbol, InstanceWrapper>): void;
    addCustomUseExisting(provider: ExistingProvider, collection: Map<Function | string | symbol, InstanceWrapper>): void;
    addExportedProvider(provider: Provider | string | symbol | DynamicModule): Set<InjectionToken>;
    addCustomExportedProvider(provider: FactoryProvider | ValueProvider | ClassProvider | ExistingProvider): Set<InjectionToken>;
    validateExportedProvider(token: InstanceToken): InjectionToken;
    addController(controller: Type<Controller>): void;
    assignControllerUniqueId(controller: Type<Controller>): void;
    addRelatedModule(module: Module): void;
    replace(toReplace: InstanceToken, options: any): void;
    hasProvider(token: InstanceToken): boolean;
    hasInjectable(token: InstanceToken): boolean;
    getProviderByKey<T = any>(name: InstanceToken): InstanceWrapper<T>;
    getNonAliasProviders(): Array<[
        InstanceToken,
        InstanceWrapper<Injectable>
    ]>;
    createModuleReferenceType(): Type<ModuleRef>;
}
