"use strict";
var CacheModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = void 0;
const tslib_1 = require("tslib");
const decorators_1 = require("../decorators");
const cache_constants_1 = require("./cache.constants");
const cache_providers_1 = require("./cache.providers");
/**
 * Module that provides Nest cache-manager.
 *
 * @see [Caching](https://docs.nestjs.com/techniques/caching)
 *
 * @publicApi
 */
let CacheModule = CacheModule_1 = class CacheModule {
    /**
     * Configure the cache manager statically.
     *
     * @param options options to configure the cache manager
     *
     * @see [Customize caching](https://docs.nestjs.com/techniques/caching#customize-caching)
     */
    static register(options = {}) {
        return {
            module: CacheModule_1,
            global: options.isGlobal,
            providers: [{ provide: cache_constants_1.CACHE_MODULE_OPTIONS, useValue: options }],
        };
    }
    /**
     * Configure the cache manager dynamically.
     *
     * @param options method for dynamically supplying cache manager configuration
     * options
     *
     * @see [Async configuration](https://docs.nestjs.com/techniques/caching#async-configuration)
     */
    static registerAsync(options) {
        return {
            module: CacheModule_1,
            global: options.isGlobal,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options),
                ...(options.extraProviders || []),
            ],
        };
    }
    static createAsyncProviders(options) {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass,
                useClass: options.useClass,
            },
        ];
    }
    static createAsyncOptionsProvider(options) {
        if (options.useFactory) {
            return {
                provide: cache_constants_1.CACHE_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        return {
            provide: cache_constants_1.CACHE_MODULE_OPTIONS,
            useFactory: async (optionsFactory) => optionsFactory.createCacheOptions(),
            inject: [options.useExisting || options.useClass],
        };
    }
};
CacheModule = CacheModule_1 = tslib_1.__decorate([
    (0, decorators_1.Module)({
        providers: [(0, cache_providers_1.createCacheManager)()],
        exports: [cache_constants_1.CACHE_MANAGER],
    })
], CacheModule);
exports.CacheModule = CacheModule;
