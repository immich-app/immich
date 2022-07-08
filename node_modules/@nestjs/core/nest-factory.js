"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestFactory = exports.NestFactoryStatic = void 0;
const logger_service_1 = require("@nestjs/common/services/logger.service");
const load_package_util_1 = require("@nestjs/common/utils/load-package.util");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const application_config_1 = require("./application-config");
const constants_1 = require("./constants");
const exceptions_zone_1 = require("./errors/exceptions-zone");
const load_adapter_1 = require("./helpers/load-adapter");
const rethrow_1 = require("./helpers/rethrow");
const container_1 = require("./injector/container");
const instance_loader_1 = require("./injector/instance-loader");
const metadata_scanner_1 = require("./metadata-scanner");
const nest_application_1 = require("./nest-application");
const nest_application_context_1 = require("./nest-application-context");
const scanner_1 = require("./scanner");
/**
 * @publicApi
 */
class NestFactoryStatic {
    constructor() {
        this.logger = new logger_service_1.Logger('NestFactory', {
            timestamp: true,
        });
        this.abortOnError = true;
        this.autoFlushLogs = false;
    }
    async create(module, serverOrOptions, options) {
        const [httpServer, appOptions] = this.isHttpServer(serverOrOptions)
            ? [serverOrOptions, options]
            : [this.createHttpAdapter(), serverOrOptions];
        const applicationConfig = new application_config_1.ApplicationConfig();
        const container = new container_1.NestContainer(applicationConfig);
        this.setAbortOnError(serverOrOptions, options);
        this.registerLoggerConfiguration(appOptions);
        await this.initialize(module, container, applicationConfig, httpServer);
        const instance = new nest_application_1.NestApplication(container, httpServer, applicationConfig, appOptions);
        const target = this.createNestInstance(instance);
        return this.createAdapterProxy(target, httpServer);
    }
    /**
     * Creates an instance of NestMicroservice.
     *
     * @param module Entry (root) application module class
     * @param options Optional microservice configuration
     *
     * @returns A promise that, when resolved,
     * contains a reference to the NestMicroservice instance.
     */
    async createMicroservice(module, options) {
        const { NestMicroservice } = (0, load_package_util_1.loadPackage)('@nestjs/microservices', 'NestFactory', () => require('@nestjs/microservices'));
        const applicationConfig = new application_config_1.ApplicationConfig();
        const container = new container_1.NestContainer(applicationConfig);
        this.setAbortOnError(options);
        this.registerLoggerConfiguration(options);
        await this.initialize(module, container, applicationConfig);
        return this.createNestInstance(new NestMicroservice(container, options, applicationConfig));
    }
    /**
     * Creates an instance of NestApplicationContext.
     *
     * @param module Entry (root) application module class
     * @param options Optional Nest application configuration
     *
     * @returns A promise that, when resolved,
     * contains a reference to the NestApplicationContext instance.
     */
    async createApplicationContext(module, options) {
        const container = new container_1.NestContainer();
        this.setAbortOnError(options);
        this.registerLoggerConfiguration(options);
        await this.initialize(module, container);
        const modules = container.getModules().values();
        const root = modules.next().value;
        const context = this.createNestInstance(new nest_application_context_1.NestApplicationContext(container, [], root));
        if (this.autoFlushLogs) {
            context.flushLogsOnOverride();
        }
        return context.init();
    }
    createNestInstance(instance) {
        return this.createProxy(instance);
    }
    async initialize(module, container, config = new application_config_1.ApplicationConfig(), httpServer = null) {
        const instanceLoader = new instance_loader_1.InstanceLoader(container);
        const metadataScanner = new metadata_scanner_1.MetadataScanner();
        const dependenciesScanner = new scanner_1.DependenciesScanner(container, metadataScanner, config);
        container.setHttpAdapter(httpServer);
        const teardown = this.abortOnError === false ? rethrow_1.rethrow : undefined;
        await (httpServer === null || httpServer === void 0 ? void 0 : httpServer.init());
        try {
            this.logger.log(constants_1.MESSAGES.APPLICATION_START);
            await exceptions_zone_1.ExceptionsZone.asyncRun(async () => {
                await dependenciesScanner.scan(module);
                await instanceLoader.createInstancesOfDependencies();
                dependenciesScanner.applyApplicationProviders();
            }, teardown, this.autoFlushLogs);
        }
        catch (e) {
            this.handleInitializationError(e);
        }
    }
    handleInitializationError(err) {
        if (this.abortOnError) {
            process.abort();
        }
        (0, rethrow_1.rethrow)(err);
    }
    createProxy(target) {
        const proxy = this.createExceptionProxy();
        return new Proxy(target, {
            get: proxy,
            set: proxy,
        });
    }
    createExceptionProxy() {
        return (receiver, prop) => {
            if (!(prop in receiver)) {
                return;
            }
            if ((0, shared_utils_1.isFunction)(receiver[prop])) {
                return this.createExceptionZone(receiver, prop);
            }
            return receiver[prop];
        };
    }
    createExceptionZone(receiver, prop) {
        const teardown = this.abortOnError === false ? rethrow_1.rethrow : undefined;
        return (...args) => {
            let result;
            exceptions_zone_1.ExceptionsZone.run(() => {
                result = receiver[prop](...args);
            }, teardown);
            return result;
        };
    }
    registerLoggerConfiguration(options) {
        if (!options) {
            return;
        }
        const { logger, bufferLogs, autoFlushLogs } = options;
        if (logger !== true && !(0, shared_utils_1.isNil)(logger)) {
            logger_service_1.Logger.overrideLogger(logger);
        }
        if (bufferLogs) {
            logger_service_1.Logger.attachBuffer();
        }
        this.autoFlushLogs = autoFlushLogs !== null && autoFlushLogs !== void 0 ? autoFlushLogs : true;
    }
    createHttpAdapter(httpServer) {
        const { ExpressAdapter } = (0, load_adapter_1.loadAdapter)('@nestjs/platform-express', 'HTTP', () => require('@nestjs/platform-express'));
        return new ExpressAdapter(httpServer);
    }
    isHttpServer(serverOrOptions) {
        return !!(serverOrOptions && serverOrOptions.patch);
    }
    setAbortOnError(serverOrOptions, options) {
        this.abortOnError = this.isHttpServer(serverOrOptions)
            ? !(options && options.abortOnError === false)
            : !(serverOrOptions && serverOrOptions.abortOnError === false);
    }
    createAdapterProxy(app, adapter) {
        const proxy = new Proxy(app, {
            get: (receiver, prop) => {
                const mapToProxy = (result) => {
                    return result instanceof Promise
                        ? result.then(mapToProxy)
                        : result instanceof nest_application_1.NestApplication
                            ? proxy
                            : result;
                };
                if (!(prop in receiver) && prop in adapter) {
                    return (...args) => {
                        const result = this.createExceptionZone(adapter, prop)(...args);
                        return mapToProxy(result);
                    };
                }
                if ((0, shared_utils_1.isFunction)(receiver[prop])) {
                    return (...args) => {
                        const result = receiver[prop](...args);
                        return mapToProxy(result);
                    };
                }
                return receiver[prop];
            },
        });
        return proxy;
    }
}
exports.NestFactoryStatic = NestFactoryStatic;
/**
 * Use NestFactory to create an application instance.
 *
 * ### Specifying an entry module
 *
 * Pass the required *root module* for the application via the module parameter.
 * By convention, it is usually called `ApplicationModule`.  Starting with this
 * module, Nest assembles the dependency graph and begins the process of
 * Dependency Injection and instantiates the classes needed to launch your
 * application.
 *
 * @publicApi
 */
exports.NestFactory = new NestFactoryStatic();
