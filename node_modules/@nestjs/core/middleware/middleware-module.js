"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareModule = void 0;
const request_method_enum_1 = require("@nestjs/common/enums/request-method.enum");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const invalid_middleware_exception_1 = require("../errors/exceptions/invalid-middleware.exception");
const runtime_exception_1 = require("../errors/exceptions/runtime.exception");
const context_id_factory_1 = require("../helpers/context-id-factory");
const execution_context_host_1 = require("../helpers/execution-context-host");
const constants_1 = require("../injector/constants");
const request_constants_1 = require("../router/request/request-constants");
const router_exception_filters_1 = require("../router/router-exception-filters");
const router_proxy_1 = require("../router/router-proxy");
const utils_1 = require("../router/utils");
const builder_1 = require("./builder");
const resolver_1 = require("./resolver");
const routes_mapper_1 = require("./routes-mapper");
class MiddlewareModule {
    constructor() {
        this.routerProxy = new router_proxy_1.RouterProxy();
        this.exceptionFiltersCache = new WeakMap();
    }
    async register(middlewareContainer, container, config, injector, httpAdapter) {
        const appRef = container.getHttpAdapterRef();
        this.routerExceptionFilter = new router_exception_filters_1.RouterExceptionFilters(container, config, appRef);
        this.routesMapper = new routes_mapper_1.RoutesMapper(container);
        this.resolver = new resolver_1.MiddlewareResolver(middlewareContainer);
        this.config = config;
        this.injector = injector;
        this.container = container;
        this.httpAdapter = httpAdapter;
        const modules = container.getModules();
        await this.resolveMiddleware(middlewareContainer, modules);
    }
    async resolveMiddleware(middlewareContainer, modules) {
        const moduleEntries = [...modules.entries()];
        const loadMiddlewareConfiguration = async ([moduleName, moduleRef]) => {
            await this.loadConfiguration(middlewareContainer, moduleRef, moduleName);
            await this.resolver.resolveInstances(moduleRef, moduleName);
        };
        await Promise.all(moduleEntries.map(loadMiddlewareConfiguration));
    }
    async loadConfiguration(middlewareContainer, moduleRef, moduleKey) {
        const { instance } = moduleRef;
        if (!instance.configure) {
            return;
        }
        const middlewareBuilder = new builder_1.MiddlewareBuilder(this.routesMapper, this.httpAdapter);
        await instance.configure(middlewareBuilder);
        if (!(middlewareBuilder instanceof builder_1.MiddlewareBuilder)) {
            return;
        }
        const config = middlewareBuilder.build();
        middlewareContainer.insertConfig(config, moduleKey);
    }
    async registerMiddleware(middlewareContainer, applicationRef) {
        const configs = middlewareContainer.getConfigurations();
        const registerAllConfigs = async (moduleKey, middlewareConfig) => {
            for (const config of middlewareConfig) {
                await this.registerMiddlewareConfig(middlewareContainer, config, moduleKey, applicationRef);
            }
        };
        const entriesSortedByDistance = [...configs.entries()].sort(([moduleA], [moduleB]) => {
            return (this.container.getModuleByKey(moduleA).distance -
                this.container.getModuleByKey(moduleB).distance);
        });
        for (const [moduleRef, moduleConfigurations] of entriesSortedByDistance) {
            await registerAllConfigs(moduleRef, [...moduleConfigurations]);
        }
    }
    async registerMiddlewareConfig(middlewareContainer, config, moduleKey, applicationRef) {
        const { forRoutes } = config;
        for (const routeInfo of forRoutes) {
            await this.registerRouteMiddleware(middlewareContainer, routeInfo, config, moduleKey, applicationRef);
        }
    }
    async registerRouteMiddleware(middlewareContainer, routeInfo, config, moduleKey, applicationRef) {
        const middlewareCollection = [].concat(config.middleware);
        const moduleRef = this.container.getModuleByKey(moduleKey);
        for (const metatype of middlewareCollection) {
            const collection = middlewareContainer.getMiddlewareCollection(moduleKey);
            const instanceWrapper = collection.get(metatype);
            if ((0, shared_utils_1.isUndefined)(instanceWrapper)) {
                throw new runtime_exception_1.RuntimeException();
            }
            if (instanceWrapper.isTransient) {
                return;
            }
            await this.bindHandler(instanceWrapper, applicationRef, routeInfo.method, routeInfo.path, moduleRef, collection);
        }
    }
    async bindHandler(wrapper, applicationRef, method, path, moduleRef, collection) {
        const { instance, metatype } = wrapper;
        if ((0, shared_utils_1.isUndefined)(instance === null || instance === void 0 ? void 0 : instance.use)) {
            throw new invalid_middleware_exception_1.InvalidMiddlewareException(metatype.name);
        }
        const isStatic = wrapper.isDependencyTreeStatic();
        if (isStatic) {
            const proxy = await this.createProxy(instance);
            return this.registerHandler(applicationRef, method, path, proxy);
        }
        await this.registerHandler(applicationRef, method, path, async (req, res, next) => {
            try {
                const contextId = context_id_factory_1.ContextIdFactory.getByRequest(req);
                if (!req[request_constants_1.REQUEST_CONTEXT_ID]) {
                    Object.defineProperty(req, request_constants_1.REQUEST_CONTEXT_ID, {
                        value: contextId,
                        enumerable: false,
                        writable: false,
                        configurable: false,
                    });
                    this.container.registerRequestProvider(req, contextId);
                }
                const contextInstance = await this.injector.loadPerContext(instance, moduleRef, collection, contextId);
                const proxy = await this.createProxy(contextInstance, contextId);
                return proxy(req, res, next);
            }
            catch (err) {
                let exceptionsHandler = this.exceptionFiltersCache.get(instance.use);
                if (!exceptionsHandler) {
                    exceptionsHandler = this.routerExceptionFilter.create(instance, instance.use, undefined);
                    this.exceptionFiltersCache.set(instance.use, exceptionsHandler);
                }
                const host = new execution_context_host_1.ExecutionContextHost([req, res, next]);
                exceptionsHandler.next(err, host);
            }
        });
    }
    async createProxy(instance, contextId = constants_1.STATIC_CONTEXT) {
        const exceptionsHandler = this.routerExceptionFilter.create(instance, instance.use, undefined, contextId);
        const middleware = instance.use.bind(instance);
        return this.routerProxy.createProxy(middleware, exceptionsHandler);
    }
    async registerHandler(applicationRef, method, path, proxy) {
        const prefix = this.config.getGlobalPrefix();
        const excludedRoutes = this.config.getGlobalPrefixOptions().exclude;
        if ((Array.isArray(excludedRoutes) &&
            (0, utils_1.isRouteExcluded)(excludedRoutes, path, method)) ||
            ['*', '/*', '(.*)', '/(.*)'].includes(path)) {
            path = (0, shared_utils_1.addLeadingSlash)(path);
        }
        else {
            const basePath = (0, shared_utils_1.addLeadingSlash)(prefix);
            if ((basePath === null || basePath === void 0 ? void 0 : basePath.endsWith('/')) && (path === null || path === void 0 ? void 0 : path.startsWith('/'))) {
                // strip slash when a wildcard is being used
                // and global prefix has been set
                path = path === null || path === void 0 ? void 0 : path.slice(1);
            }
            path = basePath + path;
        }
        const isMethodAll = (0, utils_1.isRequestMethodAll)(method);
        const requestMethod = request_method_enum_1.RequestMethod[method];
        const router = await applicationRef.createMiddlewareFactory(method);
        router(path, isMethodAll
            ? proxy
            : (req, res, next) => {
                if (applicationRef.getRequestMethod(req) === requestMethod) {
                    return proxy(req, res, next);
                }
                return next();
            });
    }
}
exports.MiddlewareModule = MiddlewareModule;
