"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCacheManager = void 0;
const load_package_util_1 = require("../utils/load-package.util");
const cache_constants_1 = require("./cache.constants");
const default_options_1 = require("./default-options");
/**
 * Creates a CacheManager Provider.
 *
 * @publicApi
 */
function createCacheManager() {
    return {
        provide: cache_constants_1.CACHE_MANAGER,
        useFactory: (options) => {
            const cacheManager = (0, load_package_util_1.loadPackage)('cache-manager', 'CacheModule', () => require('cache-manager'));
            return Array.isArray(options)
                ? cacheManager.multiCaching(options.map(store => cacheManager.caching(Object.assign(Object.assign({}, default_options_1.defaultCacheOptions), (store || {})))))
                : cacheManager.caching(Object.assign(Object.assign({}, default_options_1.defaultCacheOptions), (options || {})));
        },
        inject: [cache_constants_1.CACHE_MODULE_OPTIONS],
    };
}
exports.createCacheManager = createCacheManager;
