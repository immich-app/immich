import { Module } from '../injector/module';
import { MiddlewareContainer } from './container';
export declare class MiddlewareResolver {
    private readonly middlewareContainer;
    private readonly instanceLoader;
    constructor(middlewareContainer: MiddlewareContainer);
    resolveInstances(moduleRef: Module, moduleName: string): Promise<void>;
    private resolveMiddlewareInstance;
}
