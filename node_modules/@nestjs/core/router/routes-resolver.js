"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutesResolver = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const logger_service_1 = require("@nestjs/common/services/logger.service");
const messages_1 = require("../helpers/messages");
const metadata_scanner_1 = require("../metadata-scanner");
const route_path_factory_1 = require("./route-path-factory");
const router_exception_filters_1 = require("./router-exception-filters");
const router_explorer_1 = require("./router-explorer");
const router_proxy_1 = require("./router-proxy");
class RoutesResolver {
    constructor(container, applicationConfig, injector) {
        this.container = container;
        this.applicationConfig = applicationConfig;
        this.injector = injector;
        this.logger = new logger_service_1.Logger(RoutesResolver.name, {
            timestamp: true,
        });
        this.routerProxy = new router_proxy_1.RouterProxy();
        const httpAdapterRef = container.getHttpAdapterRef();
        this.routerExceptionsFilter = new router_exception_filters_1.RouterExceptionFilters(container, applicationConfig, httpAdapterRef);
        this.routePathFactory = new route_path_factory_1.RoutePathFactory(this.applicationConfig);
        const metadataScanner = new metadata_scanner_1.MetadataScanner();
        this.routerExplorer = new router_explorer_1.RouterExplorer(metadataScanner, this.container, this.injector, this.routerProxy, this.routerExceptionsFilter, this.applicationConfig, this.routePathFactory);
    }
    resolve(applicationRef, globalPrefix) {
        const modules = this.container.getModules();
        modules.forEach(({ controllers, metatype }, moduleName) => {
            const modulePath = this.getModulePathMetadata(metatype);
            this.registerRouters(controllers, moduleName, globalPrefix, modulePath, applicationRef);
        });
    }
    registerRouters(routes, moduleName, globalPrefix, modulePath, applicationRef) {
        routes.forEach(instanceWrapper => {
            const { metatype } = instanceWrapper;
            const host = this.getHostMetadata(metatype);
            const routerPaths = this.routerExplorer.extractRouterPath(metatype);
            const controllerVersion = this.getVersionMetadata(metatype);
            const controllerName = metatype.name;
            routerPaths.forEach(path => {
                const pathsToLog = this.routePathFactory.create({
                    ctrlPath: path,
                    modulePath,
                    globalPrefix,
                });
                if (!controllerVersion) {
                    pathsToLog.forEach(path => {
                        const logMessage = (0, messages_1.CONTROLLER_MAPPING_MESSAGE)(controllerName, path);
                        this.logger.log(logMessage);
                    });
                }
                else {
                    pathsToLog.forEach(path => {
                        const logMessage = (0, messages_1.VERSIONED_CONTROLLER_MAPPING_MESSAGE)(controllerName, path, controllerVersion);
                        this.logger.log(logMessage);
                    });
                }
                const versioningOptions = this.applicationConfig.getVersioning();
                const routePathMetadata = {
                    ctrlPath: path,
                    modulePath,
                    globalPrefix,
                    controllerVersion,
                    versioningOptions,
                };
                this.routerExplorer.explore(instanceWrapper, moduleName, applicationRef, host, routePathMetadata);
            });
        });
    }
    registerNotFoundHandler() {
        const applicationRef = this.container.getHttpAdapterRef();
        const callback = (req, res) => {
            const method = applicationRef.getRequestMethod(req);
            const url = applicationRef.getRequestUrl(req);
            throw new common_1.NotFoundException(`Cannot ${method} ${url}`);
        };
        const handler = this.routerExceptionsFilter.create({}, callback, undefined);
        const proxy = this.routerProxy.createProxy(callback, handler);
        applicationRef.setNotFoundHandler &&
            applicationRef.setNotFoundHandler(proxy, this.applicationConfig.getGlobalPrefix());
    }
    registerExceptionHandler() {
        const callback = (err, req, res, next) => {
            throw this.mapExternalException(err);
        };
        const handler = this.routerExceptionsFilter.create({}, callback, undefined);
        const proxy = this.routerProxy.createExceptionLayerProxy(callback, handler);
        const applicationRef = this.container.getHttpAdapterRef();
        applicationRef.setErrorHandler &&
            applicationRef.setErrorHandler(proxy, this.applicationConfig.getGlobalPrefix());
    }
    mapExternalException(err) {
        switch (true) {
            // SyntaxError is thrown by Express body-parser when given invalid JSON (#422, #430)
            // URIError is thrown by Express when given a path parameter with an invalid percentage
            // encoding, e.g. '%FF' (#8915)
            case err instanceof SyntaxError || err instanceof URIError:
                return new common_1.BadRequestException(err.message);
            default:
                return err;
        }
    }
    getModulePathMetadata(metatype) {
        const modulesContainer = this.container.getModules();
        const modulePath = Reflect.getMetadata(constants_1.MODULE_PATH + modulesContainer.applicationId, metatype);
        return modulePath !== null && modulePath !== void 0 ? modulePath : Reflect.getMetadata(constants_1.MODULE_PATH, metatype);
    }
    getHostMetadata(metatype) {
        return Reflect.getMetadata(constants_1.HOST_METADATA, metatype);
    }
    getVersionMetadata(metatype) {
        var _a;
        const versioningConfig = this.applicationConfig.getVersioning();
        if (versioningConfig) {
            return ((_a = Reflect.getMetadata(constants_1.VERSION_METADATA, metatype)) !== null && _a !== void 0 ? _a : versioningConfig.defaultVersion);
        }
    }
}
exports.RoutesResolver = RoutesResolver;
