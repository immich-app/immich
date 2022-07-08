"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterExplorer = void 0;
const constants_1 = require("@nestjs/common/constants");
const version_type_enum_1 = require("@nestjs/common/enums/version-type.enum");
const exceptions_1 = require("@nestjs/common/exceptions");
const version_options_interface_1 = require("@nestjs/common/interfaces/version-options.interface");
const logger_service_1 = require("@nestjs/common/services/logger.service");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const pathToRegexp = require("path-to-regexp");
const unknown_request_mapping_exception_1 = require("../errors/exceptions/unknown-request-mapping.exception");
const guards_consumer_1 = require("../guards/guards-consumer");
const guards_context_creator_1 = require("../guards/guards-context-creator");
const context_id_factory_1 = require("../helpers/context-id-factory");
const execution_context_host_1 = require("../helpers/execution-context-host");
const messages_1 = require("../helpers/messages");
const router_method_factory_1 = require("../helpers/router-method-factory");
const constants_2 = require("../injector/constants");
const interceptors_consumer_1 = require("../interceptors/interceptors-consumer");
const interceptors_context_creator_1 = require("../interceptors/interceptors-context-creator");
const pipes_consumer_1 = require("../pipes/pipes-consumer");
const pipes_context_creator_1 = require("../pipes/pipes-context-creator");
const request_constants_1 = require("./request/request-constants");
const route_params_factory_1 = require("./route-params-factory");
const router_execution_context_1 = require("./router-execution-context");
class RouterExplorer {
    constructor(metadataScanner, container, injector, routerProxy, exceptionsFilter, config, routePathFactory) {
        this.metadataScanner = metadataScanner;
        this.container = container;
        this.injector = injector;
        this.routerProxy = routerProxy;
        this.exceptionsFilter = exceptionsFilter;
        this.config = config;
        this.routePathFactory = routePathFactory;
        this.routerMethodFactory = new router_method_factory_1.RouterMethodFactory();
        this.logger = new logger_service_1.Logger(RouterExplorer.name, {
            timestamp: true,
        });
        this.exceptionFiltersCache = new WeakMap();
        const routeParamsFactory = new route_params_factory_1.RouteParamsFactory();
        const pipesContextCreator = new pipes_context_creator_1.PipesContextCreator(container, config);
        const pipesConsumer = new pipes_consumer_1.PipesConsumer();
        const guardsContextCreator = new guards_context_creator_1.GuardsContextCreator(container, config);
        const guardsConsumer = new guards_consumer_1.GuardsConsumer();
        const interceptorsContextCreator = new interceptors_context_creator_1.InterceptorsContextCreator(container, config);
        const interceptorsConsumer = new interceptors_consumer_1.InterceptorsConsumer();
        this.executionContextCreator = new router_execution_context_1.RouterExecutionContext(routeParamsFactory, pipesContextCreator, pipesConsumer, guardsContextCreator, guardsConsumer, interceptorsContextCreator, interceptorsConsumer, container.getHttpAdapterRef());
    }
    explore(instanceWrapper, moduleKey, applicationRef, host, routePathMetadata) {
        const { instance } = instanceWrapper;
        const routerPaths = this.scanForPaths(instance);
        this.applyPathsToRouterProxy(applicationRef, routerPaths, instanceWrapper, moduleKey, routePathMetadata, host);
    }
    extractRouterPath(metatype) {
        const path = Reflect.getMetadata(constants_1.PATH_METADATA, metatype);
        if ((0, shared_utils_1.isUndefined)(path)) {
            throw new unknown_request_mapping_exception_1.UnknownRequestMappingException();
        }
        if (Array.isArray(path)) {
            return path.map(p => (0, shared_utils_1.addLeadingSlash)(p));
        }
        return [(0, shared_utils_1.addLeadingSlash)(path)];
    }
    scanForPaths(instance, prototype) {
        const instancePrototype = (0, shared_utils_1.isUndefined)(prototype)
            ? Object.getPrototypeOf(instance)
            : prototype;
        return this.metadataScanner.scanFromPrototype(instance, instancePrototype, method => this.exploreMethodMetadata(instance, instancePrototype, method));
    }
    exploreMethodMetadata(instance, prototype, methodName) {
        const instanceCallback = instance[methodName];
        const prototypeCallback = prototype[methodName];
        const routePath = Reflect.getMetadata(constants_1.PATH_METADATA, prototypeCallback);
        if ((0, shared_utils_1.isUndefined)(routePath)) {
            return null;
        }
        const requestMethod = Reflect.getMetadata(constants_1.METHOD_METADATA, prototypeCallback);
        const version = Reflect.getMetadata(constants_1.VERSION_METADATA, prototypeCallback);
        const path = (0, shared_utils_1.isString)(routePath)
            ? [(0, shared_utils_1.addLeadingSlash)(routePath)]
            : routePath.map((p) => (0, shared_utils_1.addLeadingSlash)(p));
        return {
            path,
            requestMethod,
            targetCallback: instanceCallback,
            methodName,
            version,
        };
    }
    applyPathsToRouterProxy(router, routeDefinitions, instanceWrapper, moduleKey, routePathMetadata, host) {
        (routeDefinitions || []).forEach(routeDefinition => {
            const { version: methodVersion } = routeDefinition;
            routePathMetadata.methodVersion = methodVersion;
            this.applyCallbackToRouter(router, routeDefinition, instanceWrapper, moduleKey, routePathMetadata, host);
        });
    }
    applyCallbackToRouter(router, routeDefinition, instanceWrapper, moduleKey, routePathMetadata, host) {
        const { path: paths, requestMethod, targetCallback, methodName, } = routeDefinition;
        const { instance } = instanceWrapper;
        const routerMethodRef = this.routerMethodFactory
            .get(router, requestMethod)
            .bind(router);
        const isRequestScoped = !instanceWrapper.isDependencyTreeStatic();
        const proxy = isRequestScoped
            ? this.createRequestScopedHandler(instanceWrapper, requestMethod, this.container.getModuleByKey(moduleKey), moduleKey, methodName)
            : this.createCallbackProxy(instance, targetCallback, methodName, moduleKey, requestMethod);
        const isVersioned = (routePathMetadata.methodVersion ||
            routePathMetadata.controllerVersion) &&
            routePathMetadata.versioningOptions;
        let routeHandler = this.applyHostFilter(host, proxy);
        paths.forEach(path => {
            if (isVersioned &&
                routePathMetadata.versioningOptions.type !== version_type_enum_1.VersioningType.URI) {
                // All versioning (except for URI Versioning) is done via the "Version Filter"
                routeHandler = this.applyVersionFilter(router, routePathMetadata, routeHandler);
            }
            routePathMetadata.methodPath = path;
            const pathsToRegister = this.routePathFactory.create(routePathMetadata, requestMethod);
            pathsToRegister.forEach(path => routerMethodRef(path, routeHandler));
            const pathsToLog = this.routePathFactory.create(Object.assign(Object.assign({}, routePathMetadata), { versioningOptions: undefined }), requestMethod);
            pathsToLog.forEach(path => {
                if (isVersioned) {
                    const version = this.routePathFactory.getVersion(routePathMetadata);
                    this.logger.log((0, messages_1.VERSIONED_ROUTE_MAPPED_MESSAGE)(path, requestMethod, version));
                }
                else {
                    this.logger.log((0, messages_1.ROUTE_MAPPED_MESSAGE)(path, requestMethod));
                }
            });
        });
    }
    applyHostFilter(host, handler) {
        if (!host) {
            return handler;
        }
        const httpAdapterRef = this.container.getHttpAdapterRef();
        const hosts = Array.isArray(host) ? host : [host];
        const hostRegExps = hosts.map((host) => {
            const keys = [];
            const regexp = pathToRegexp(host, keys);
            return { regexp, keys };
        });
        const unsupportedFilteringErrorMessage = Array.isArray(host)
            ? `HTTP adapter does not support filtering on hosts: ["${host.join('", "')}"]`
            : `HTTP adapter does not support filtering on host: "${host}"`;
        return (req, res, next) => {
            req.hosts = {};
            const hostname = httpAdapterRef.getRequestHostname(req) || '';
            for (const exp of hostRegExps) {
                const match = hostname.match(exp.regexp);
                if (match) {
                    exp.keys.forEach((key, i) => (req.hosts[key.name] = match[i + 1]));
                    return handler(req, res, next);
                }
            }
            if (!next) {
                throw new exceptions_1.InternalServerErrorException(unsupportedFilteringErrorMessage);
            }
            return next();
        };
    }
    applyVersionFilter(router, routePathMetadata, handler) {
        const { versioningOptions } = routePathMetadata;
        const version = this.routePathFactory.getVersion(routePathMetadata);
        if (router === null || router === void 0 ? void 0 : router.applyVersionFilter) {
            return router.applyVersionFilter(handler, version, versioningOptions);
        }
        /**
         * This can be removed in the next major release.
         * Left for backward-compatibility.
         */
        return (req, res, next) => {
            var _a, _b, _c, _d;
            if (version === version_options_interface_1.VERSION_NEUTRAL) {
                return handler(req, res, next);
            }
            // URL Versioning is done via the path, so the filter continues forward
            if (versioningOptions.type === version_type_enum_1.VersioningType.URI) {
                return handler(req, res, next);
            }
            // Custom Extractor Versioning Handler
            if (versioningOptions.type === version_type_enum_1.VersioningType.CUSTOM) {
                const extractedVersion = versioningOptions.extractor(req);
                if (Array.isArray(version)) {
                    if (Array.isArray(extractedVersion) &&
                        version.filter(extractedVersion.includes).length) {
                        return handler(req, res, next);
                    }
                    else if ((0, shared_utils_1.isString)(extractedVersion) &&
                        version.includes(extractedVersion)) {
                        return handler(req, res, next);
                    }
                }
                else {
                    if (Array.isArray(extractedVersion) &&
                        extractedVersion.includes(version)) {
                        return handler(req, res, next);
                    }
                    else if ((0, shared_utils_1.isString)(extractedVersion) &&
                        version === extractedVersion) {
                        return handler(req, res, next);
                    }
                }
            }
            // Media Type (Accept Header) Versioning Handler
            if (versioningOptions.type === version_type_enum_1.VersioningType.MEDIA_TYPE) {
                const MEDIA_TYPE_HEADER = 'Accept';
                const acceptHeaderValue = ((_a = req.headers) === null || _a === void 0 ? void 0 : _a[MEDIA_TYPE_HEADER]) ||
                    ((_b = req.headers) === null || _b === void 0 ? void 0 : _b[MEDIA_TYPE_HEADER.toLowerCase()]);
                const acceptHeaderVersionParameter = acceptHeaderValue
                    ? acceptHeaderValue.split(';')[1]
                    : '';
                if (acceptHeaderVersionParameter) {
                    const headerVersion = acceptHeaderVersionParameter.split(versioningOptions.key)[1];
                    if (Array.isArray(version)) {
                        if (version.includes(headerVersion)) {
                            return handler(req, res, next);
                        }
                    }
                    else if ((0, shared_utils_1.isString)(version)) {
                        if (version === headerVersion) {
                            return handler(req, res, next);
                        }
                    }
                }
            }
            // Header Versioning Handler
            else if (versioningOptions.type === version_type_enum_1.VersioningType.HEADER) {
                const customHeaderVersionParameter = ((_c = req.headers) === null || _c === void 0 ? void 0 : _c[versioningOptions.header]) ||
                    ((_d = req.headers) === null || _d === void 0 ? void 0 : _d[versioningOptions.header.toLowerCase()]);
                if (customHeaderVersionParameter) {
                    if (Array.isArray(version)) {
                        if (version.includes(customHeaderVersionParameter)) {
                            return handler(req, res, next);
                        }
                    }
                    else if ((0, shared_utils_1.isString)(version)) {
                        if (version === customHeaderVersionParameter) {
                            return handler(req, res, next);
                        }
                    }
                }
            }
            if (!next) {
                throw new exceptions_1.InternalServerErrorException('HTTP adapter does not support filtering on version');
            }
            return next();
        };
    }
    createCallbackProxy(instance, callback, methodName, moduleRef, requestMethod, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        const executionContext = this.executionContextCreator.create(instance, callback, methodName, moduleRef, requestMethod, contextId, inquirerId);
        const exceptionFilter = this.exceptionsFilter.create(instance, callback, moduleRef, contextId, inquirerId);
        return this.routerProxy.createProxy(executionContext, exceptionFilter);
    }
    createRequestScopedHandler(instanceWrapper, requestMethod, moduleRef, moduleKey, methodName) {
        const { instance } = instanceWrapper;
        const collection = moduleRef.controllers;
        return async (req, res, next) => {
            try {
                const contextId = this.getContextId(req);
                const contextInstance = await this.injector.loadPerContext(instance, moduleRef, collection, contextId);
                await this.createCallbackProxy(contextInstance, contextInstance[methodName], methodName, moduleKey, requestMethod, contextId, instanceWrapper.id)(req, res, next);
            }
            catch (err) {
                let exceptionFilter = this.exceptionFiltersCache.get(instance[methodName]);
                if (!exceptionFilter) {
                    exceptionFilter = this.exceptionsFilter.create(instance, instance[methodName], moduleKey);
                    this.exceptionFiltersCache.set(instance[methodName], exceptionFilter);
                }
                const host = new execution_context_host_1.ExecutionContextHost([req, res, next]);
                exceptionFilter.next(err, host);
            }
        };
    }
    getContextId(request) {
        const contextId = context_id_factory_1.ContextIdFactory.getByRequest(request);
        if (!request[request_constants_1.REQUEST_CONTEXT_ID]) {
            Object.defineProperty(request, request_constants_1.REQUEST_CONTEXT_ID, {
                value: contextId,
                enumerable: false,
                writable: false,
                configurable: false,
            });
            this.container.registerRequestProvider(request, contextId);
        }
        return contextId;
    }
}
exports.RouterExplorer = RouterExplorer;
