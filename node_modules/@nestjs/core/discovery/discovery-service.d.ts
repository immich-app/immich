import { InstanceWrapper } from '../injector/instance-wrapper';
import { Module } from '../injector/module';
import { ModulesContainer } from '../injector/modules-container';
/**
 * @publicApi
 */
export interface DiscoveryOptions {
    include?: Function[];
}
/**
 * @publicApi
 */
export declare class DiscoveryService {
    private readonly modulesContainer;
    constructor(modulesContainer: ModulesContainer);
    getProviders(options?: DiscoveryOptions, modules?: Module[]): InstanceWrapper[];
    getControllers(options?: DiscoveryOptions, modules?: Module[]): InstanceWrapper[];
    protected getModules(options?: DiscoveryOptions): Module[];
    private includeWhitelisted;
}
