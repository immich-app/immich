import { IntrospectionResult, Type } from '@nestjs/common';
import { NestContainer } from './container';
import { ContextId } from './instance-wrapper';
import { Module } from './module';
export declare abstract class ModuleRef {
    protected readonly container: NestContainer;
    private readonly injector;
    private _instanceLinksHost;
    private get instanceLinksHost();
    constructor(container: NestContainer);
    abstract get<TInput = any, TResult = TInput>(typeOrToken: Type<TInput> | Function | string | symbol, options?: {
        strict: boolean;
    }): TResult;
    abstract resolve<TInput = any, TResult = TInput>(typeOrToken: Type<TInput> | Function | string | symbol, contextId?: ContextId, options?: {
        strict: boolean;
    }): Promise<TResult>;
    abstract create<T = any>(type: Type<T>): Promise<T>;
    introspect<T = any>(token: Type<T> | string | symbol): IntrospectionResult;
    registerRequestByContextId<T = any>(request: T, contextId: ContextId): void;
    protected find<TInput = any, TResult = TInput>(typeOrToken: Type<TInput> | string | symbol, contextModule?: Module): TResult;
    protected resolvePerContext<TInput = any, TResult = TInput>(typeOrToken: Type<TInput> | string | symbol, contextModule: Module, contextId: ContextId, options?: {
        strict: boolean;
    }): Promise<TResult>;
    protected instantiateClass<T = any>(type: Type<T>, moduleRef: Module): Promise<T>;
}
