import { DynamicModule } from '@nestjs/common';
import { Module as ModuleClass } from '../injector/module';
import { ModulesContainer } from '../injector/modules-container';
import { Routes } from './interfaces';
export declare const ROUTES: unique symbol;
export declare const targetModulesByContainer: WeakMap<ModulesContainer, WeakSet<ModuleClass>>;
/**
 * @publicApi
 */
export declare class RouterModule {
    private readonly modulesContainer;
    private readonly routes;
    constructor(modulesContainer: ModulesContainer, routes: Routes);
    static register(routes: Routes): DynamicModule;
    private deepCloneRoutes;
    private initialize;
    private registerModulePathMetadata;
    private updateTargetModulesCache;
}
