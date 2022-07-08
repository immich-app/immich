export interface LiteralObject {
    [key: string]: any;
}
/**
 * Interface defining a cache store. Implement this interface to create a custom
 * cache store.
 *
 * @publicApi
 */
export interface CacheStore {
    /**
     * Create a key/value pair in the cache.
     *
     * @param key cache key
     * @param value cache value
     */
    set<T>(key: string, value: T, options?: CacheStoreSetOptions<T>): Promise<void> | void;
    /**
     * Retrieve a key/value pair from the cache.
     *
     * @param key cache key
     */
    get<T>(key: string): Promise<T | undefined> | T | undefined;
    /**
     * Destroy a key/value pair from the cache.
     *
     * @param key cache key
     */
    del?(key: string): void | Promise<void>;
}
export interface CacheStoreSetOptions<T> {
    /**
     * Time to live - amount of time in seconds that a response is cached before it
     * is deleted. Defaults based on your cache manager settings.
     */
    ttl?: ((value: T) => number) | number;
}
/**
 * Interface defining a factory to create a cache store.
 *
 * @publicApi
 */
export interface CacheStoreFactory {
    /**
     * Return a configured cache store.
     *
     * @param args Cache manager options received from `CacheModule.register()`
     * or `CacheModule.registerAsync()`
     */
    create(args: LiteralObject): CacheStore;
}
/**
 * Interface defining Cache Manager configuration options.
 *
 * @publicApi
 */
export interface CacheManagerOptions {
    /**
     * Cache storage manager.  Default is `'memory'` (in-memory store).  See
     * [Different stores](https://docs.nestjs.com/techniques/caching#different-stores)
     * for more info.
     */
    store?: string | CacheStoreFactory | CacheStore;
    /**
     * Time to live - amount of time in seconds that a response is cached before it
     * is deleted. Subsequent request will call through the route handler and refresh
     * the cache.  Defaults to 5 seconds.
     */
    ttl?: number;
    /**
     * Maximum number of responses to store in the cache.  Defaults to 100.
     */
    max?: number;
    isCacheableValue?: (value: any) => boolean;
}
