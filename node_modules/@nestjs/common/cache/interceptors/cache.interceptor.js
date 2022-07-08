"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInterceptor = void 0;
const tslib_1 = require("tslib");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const decorators_1 = require("../../decorators");
const shared_utils_1 = require("../../utils/shared.utils");
const cache_constants_1 = require("../cache.constants");
const HTTP_ADAPTER_HOST = 'HttpAdapterHost';
const REFLECTOR = 'Reflector';
let CacheInterceptor = class CacheInterceptor {
    constructor(cacheManager, reflector) {
        this.cacheManager = cacheManager;
        this.reflector = reflector;
        this.allowedMethods = ['GET'];
    }
    async intercept(context, next) {
        var _a;
        const key = this.trackBy(context);
        const ttlValueOrFactory = (_a = this.reflector.get(cache_constants_1.CACHE_TTL_METADATA, context.getHandler())) !== null && _a !== void 0 ? _a : null;
        if (!key) {
            return next.handle();
        }
        try {
            const value = await this.cacheManager.get(key);
            if (!(0, shared_utils_1.isNil)(value)) {
                return (0, rxjs_1.of)(value);
            }
            const ttl = (0, shared_utils_1.isFunction)(ttlValueOrFactory)
                ? await ttlValueOrFactory(context)
                : ttlValueOrFactory;
            return next.handle().pipe((0, operators_1.tap)(response => {
                const args = (0, shared_utils_1.isNil)(ttl) ? [key, response] : [key, response, { ttl }];
                this.cacheManager.set(...args);
            }));
        }
        catch (_b) {
            return next.handle();
        }
    }
    trackBy(context) {
        const httpAdapter = this.httpAdapterHost.httpAdapter;
        const isHttpApp = httpAdapter && !!httpAdapter.getRequestMethod;
        const cacheMetadata = this.reflector.get(cache_constants_1.CACHE_KEY_METADATA, context.getHandler());
        if (!isHttpApp || cacheMetadata) {
            return cacheMetadata;
        }
        const request = context.getArgByIndex(0);
        if (!this.isRequestCacheable(context)) {
            return undefined;
        }
        return httpAdapter.getRequestUrl(request);
    }
    isRequestCacheable(context) {
        const req = context.switchToHttp().getRequest();
        return this.allowedMethods.includes(req.method);
    }
};
tslib_1.__decorate([
    (0, decorators_1.Optional)(),
    (0, decorators_1.Inject)(HTTP_ADAPTER_HOST),
    tslib_1.__metadata("design:type", Object)
], CacheInterceptor.prototype, "httpAdapterHost", void 0);
CacheInterceptor = tslib_1.__decorate([
    (0, decorators_1.Injectable)(),
    tslib_1.__param(0, (0, decorators_1.Inject)(cache_constants_1.CACHE_MANAGER)),
    tslib_1.__param(1, (0, decorators_1.Inject)(REFLECTOR)),
    tslib_1.__metadata("design:paramtypes", [Object, Object])
], CacheInterceptor);
exports.CacheInterceptor = CacheInterceptor;
