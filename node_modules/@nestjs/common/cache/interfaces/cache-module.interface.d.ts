import { ModuleMetadata, Provider, Type } from '../../interfaces';
import { CacheManagerOptions } from './cache-manager.interface';
export declare type CacheModuleOptions<StoreConfig extends Record<any, any> = Record<string, any>> = CacheManagerOptions & StoreConfig & {
    /**
     * If "true', register `CacheModule` as a global module.
     */
    isGlobal?: boolean;
};
/**
 * Interface describing a `CacheOptionsFactory`.  Providers supplying configuration
 * options for the Cache module must implement this interface.
 *
 * @see [Async configuration](https://docs.nestjs.com/techniques/caching#async-configuration)
 *
 * @publicApi
 */
export interface CacheOptionsFactory<StoreConfig extends Record<any, any> = Record<string, any>> {
    createCacheOptions(): Promise<CacheModuleOptions<StoreConfig>> | CacheModuleOptions<StoreConfig>;
}
/**
 * Options for dynamically configuring the Cache module.
 *
 * @see [Async configuration](https://docs.nestjs.com/techniques/caching#async-configuration)
 *
 * @publicApi
 */
export interface CacheModuleAsyncOptions<StoreConfig extends Record<any, any> = Record<string, any>> extends Pick<ModuleMetadata, 'imports'> {
    /**
     * Injection token resolving to an existing provider. The provider must implement
     * the `CacheOptionsFactory` interface.
     */
    useExisting?: Type<CacheOptionsFactory<StoreConfig>>;
    /**
     * Injection token resolving to a class that will be instantiated as a provider.
     * The class must implement the `CacheOptionsFactory` interface.
     */
    useClass?: Type<CacheOptionsFactory<StoreConfig>>;
    /**
     * Function returning options (or a Promise resolving to options) to configure the
     * cache module.
     */
    useFactory?: (...args: any[]) => Promise<CacheModuleOptions<StoreConfig>> | CacheModuleOptions<StoreConfig>;
    /**
     * Dependencies that a Factory may inject.
     */
    inject?: any[];
    extraProviders?: Provider[];
    /**
     * If "true', register `CacheModule` as a global module.
     */
    isGlobal?: boolean;
}
