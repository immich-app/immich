import { INestApplicationContext, LoggerService, LogLevel, ShutdownSignal } from '@nestjs/common';
import { Abstract, DynamicModule } from '@nestjs/common/interfaces';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { NestContainer } from './injector/container';
import { Injector } from './injector/injector';
import { ContextId } from './injector/instance-wrapper';
import { Module } from './injector/module';
/**
 * @publicApi
 */
export declare class NestApplicationContext implements INestApplicationContext {
    protected readonly container: NestContainer;
    private readonly scope;
    private contextModule;
    protected isInitialized: boolean;
    protected readonly injector: Injector;
    private shouldFlushLogsOnOverride;
    private readonly activeShutdownSignals;
    private readonly moduleCompiler;
    private shutdownCleanupRef?;
    private _instanceLinksHost;
    private _moduleRefsByDistance?;
    private get instanceLinksHost();
    constructor(container: NestContainer, scope?: Type<any>[], contextModule?: Module);
    selectContextModule(): void;
    select<T>(moduleType: Type<T> | DynamicModule): INestApplicationContext;
    get<TInput = any, TResult = TInput>(typeOrToken: Type<TInput> | Abstract<TInput> | string | symbol, options?: {
        strict: boolean;
    }): TResult;
    resolve<TInput = any, TResult = TInput>(typeOrToken: Type<TInput> | Abstract<TInput> | string | symbol, contextId?: ContextId, options?: {
        strict: boolean;
    }): Promise<TResult>;
    registerRequestByContextId<T = any>(request: T, contextId: ContextId): void;
    /**
     * Initalizes the Nest application.
     * Calls the Nest lifecycle events.
     *
     * @returns {Promise<this>} The NestApplicationContext instance as Promise
     */
    init(): Promise<this>;
    close(): Promise<void>;
    useLogger(logger: LoggerService | LogLevel[] | false): void;
    flushLogs(): void;
    /**
     * Define that it must flush logs right after defining a custom logger.
     */
    flushLogsOnOverride(): void;
    /**
     * Enables the usage of shutdown hooks. Will call the
     * `onApplicationShutdown` function of a provider if the
     * process receives a shutdown signal.
     *
     * @param {ShutdownSignal[]} [signals=[]] The system signals it should listen to
     *
     * @returns {this} The Nest application context instance
     */
    enableShutdownHooks(signals?: (ShutdownSignal | string)[]): this;
    protected dispose(): Promise<void>;
    /**
     * Listens to shutdown signals by listening to
     * process events
     *
     * @param {string[]} signals The system signals it should listen to
     */
    protected listenToShutdownSignals(signals: string[]): void;
    /**
     * Unsubscribes from shutdown signals (process events)
     */
    protected unsubscribeFromProcessSignals(): void;
    /**
     * Calls the `onModuleInit` function on the registered
     * modules and its children.
     */
    protected callInitHook(): Promise<void>;
    /**
     * Calls the `onModuleDestroy` function on the registered
     * modules and its children.
     */
    protected callDestroyHook(): Promise<void>;
    /**
     * Calls the `onApplicationBootstrap` function on the registered
     * modules and its children.
     */
    protected callBootstrapHook(): Promise<void>;
    /**
     * Calls the `onApplicationShutdown` function on the registered
     * modules and children.
     */
    protected callShutdownHook(signal?: string): Promise<void>;
    /**
     * Calls the `beforeApplicationShutdown` function on the registered
     * modules and children.
     */
    protected callBeforeShutdownHook(signal?: string): Promise<void>;
    protected find<TInput = any, TResult = TInput>(typeOrToken: Type<TInput> | Abstract<TInput> | string | symbol, contextModule?: Module): TResult;
    protected resolvePerContext<TInput = any, TResult = TInput>(typeOrToken: Type<TInput> | Abstract<TInput> | string | symbol, contextModule: Module, contextId: ContextId, options?: {
        strict: boolean;
    }): Promise<TResult>;
    private getModulesSortedByDistance;
}
