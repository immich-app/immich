import { DynamicModule, ForwardReference, Provider } from '@nestjs/common';
import { ClassProvider, ExistingProvider, FactoryProvider, ValueProvider } from '@nestjs/common/interfaces';
import { Controller } from '@nestjs/common/interfaces/controllers/controller.interface';
import { Injectable } from '@nestjs/common/interfaces/injectable.interface';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { ApplicationConfig } from './application-config';
import { NestContainer } from './injector/container';
import { Module } from './injector/module';
import { MetadataScanner } from './metadata-scanner';
export declare class DependenciesScanner {
    private readonly container;
    private readonly metadataScanner;
    private readonly applicationConfig;
    private readonly logger;
    private readonly applicationProvidersApplyMap;
    constructor(container: NestContainer, metadataScanner: MetadataScanner, applicationConfig?: ApplicationConfig);
    scan(module: Type<any>): Promise<void>;
    scanForModules(moduleDefinition: ForwardReference | Type<unknown> | DynamicModule | Promise<DynamicModule>, scope?: Type<unknown>[], ctxRegistry?: (ForwardReference | DynamicModule | Type<unknown>)[]): Promise<Module[]>;
    insertModule(moduleDefinition: any, scope: Type<unknown>[]): Promise<Module | undefined>;
    scanModulesForDependencies(modules?: Map<string, Module>): Promise<void>;
    reflectImports(module: Type<unknown>, token: string, context: string): Promise<void>;
    reflectProviders(module: Type<any>, token: string): void;
    reflectControllers(module: Type<any>, token: string): void;
    reflectDynamicMetadata(obj: Type<Injectable>, token: string): void;
    reflectExports(module: Type<unknown>, token: string): void;
    reflectInjectables(component: Type<Injectable>, token: string, metadataKey: string): void;
    reflectParamInjectables(component: Type<Injectable>, token: string, metadataKey: string): void;
    reflectKeyMetadata(component: Type<Injectable>, key: string, method: string): any;
    calculateModulesDistance(): Promise<void>;
    insertImport(related: any, token: string, context: string): Promise<void>;
    isCustomProvider(provider: Provider): provider is ClassProvider | ValueProvider | FactoryProvider | ExistingProvider;
    insertProvider(provider: Provider, token: string): string | symbol | void | Function;
    insertInjectable(injectable: Type<Injectable>, token: string, host: Type<Injectable>): void;
    insertExportedProvider(exportedProvider: Type<Injectable>, token: string): void;
    insertController(controller: Type<Controller>, token: string): void;
    reflectMetadata(metatype: Type<any>, metadataKey: string): any;
    registerCoreModule(): Promise<void>;
    /**
     * Add either request or transient globally scoped enhancers
     * to all controllers metadata storage
     */
    addScopedEnhancersMetadata(): void;
    applyApplicationProviders(): void;
    getApplyProvidersMap(): {
        [type: string]: Function;
    };
    getApplyRequestProvidersMap(): {
        [type: string]: Function;
    };
    isDynamicModule(module: Type<any> | DynamicModule): module is DynamicModule;
    /**
     * @param metatype
     * @returns `true` if `metatype` is annotated with the `@Injectable()` decorator.
     */
    private isInjectable;
    /**
     * @param metatype
     * @returns `true` if `metatype` is annotated with the `@Controller()` decorator.
     */
    private isController;
    /**
     * @param metatype
     * @returns `true` if `metatype` is annotated with the `@Catch()` decorator.
     */
    private isExceptionFilter;
    private isForwardReference;
    private flatten;
    private isRequestOrTransient;
}
