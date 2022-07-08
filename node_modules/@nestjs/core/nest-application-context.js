"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestApplicationContext = void 0;
const common_1 = require("@nestjs/common");
const interfaces_1 = require("@nestjs/common/interfaces");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const constants_1 = require("./constants");
const invalid_class_scope_exception_1 = require("./errors/exceptions/invalid-class-scope.exception");
const unknown_element_exception_1 = require("./errors/exceptions/unknown-element.exception");
const unknown_module_exception_1 = require("./errors/exceptions/unknown-module.exception");
const context_id_factory_1 = require("./helpers/context-id-factory");
const hooks_1 = require("./hooks");
const compiler_1 = require("./injector/compiler");
const injector_1 = require("./injector/injector");
const instance_links_host_1 = require("./injector/instance-links-host");
/**
 * @publicApi
 */
class NestApplicationContext {
    constructor(container, scope = new Array(), contextModule = null) {
        this.container = container;
        this.scope = scope;
        this.contextModule = contextModule;
        this.isInitialized = false;
        this.injector = new injector_1.Injector();
        this.shouldFlushLogsOnOverride = false;
        this.activeShutdownSignals = new Array();
        this.moduleCompiler = new compiler_1.ModuleCompiler();
    }
    get instanceLinksHost() {
        if (!this._instanceLinksHost) {
            this._instanceLinksHost = new instance_links_host_1.InstanceLinksHost(this.container);
        }
        return this._instanceLinksHost;
    }
    selectContextModule() {
        const modules = this.container.getModules().values();
        this.contextModule = modules.next().value;
    }
    select(moduleType) {
        const modulesContainer = this.container.getModules();
        const contextModuleCtor = this.contextModule.metatype;
        const scope = this.scope.concat(contextModuleCtor);
        const moduleTokenFactory = this.container.getModuleTokenFactory();
        const { type, dynamicMetadata } = this.moduleCompiler.extractMetadata(moduleType);
        const token = moduleTokenFactory.create(type, dynamicMetadata);
        const selectedModule = modulesContainer.get(token);
        if (!selectedModule) {
            throw new unknown_module_exception_1.UnknownModuleException();
        }
        return new NestApplicationContext(this.container, scope, selectedModule);
    }
    get(typeOrToken, options = { strict: false }) {
        return !(options && options.strict)
            ? this.find(typeOrToken)
            : this.find(typeOrToken, this.contextModule);
    }
    resolve(typeOrToken, contextId = (0, context_id_factory_1.createContextId)(), options = { strict: false }) {
        return this.resolvePerContext(typeOrToken, this.contextModule, contextId, options);
    }
    registerRequestByContextId(request, contextId) {
        this.container.registerRequestProvider(request, contextId);
    }
    /**
     * Initalizes the Nest application.
     * Calls the Nest lifecycle events.
     *
     * @returns {Promise<this>} The NestApplicationContext instance as Promise
     */
    async init() {
        if (this.isInitialized) {
            return this;
        }
        await this.callInitHook();
        await this.callBootstrapHook();
        this.isInitialized = true;
        return this;
    }
    async close() {
        await this.callDestroyHook();
        await this.callBeforeShutdownHook();
        await this.dispose();
        await this.callShutdownHook();
        this.unsubscribeFromProcessSignals();
    }
    useLogger(logger) {
        common_1.Logger.overrideLogger(logger);
        if (this.shouldFlushLogsOnOverride) {
            this.flushLogs();
        }
    }
    flushLogs() {
        common_1.Logger.flush();
    }
    /**
     * Define that it must flush logs right after defining a custom logger.
     */
    flushLogsOnOverride() {
        this.shouldFlushLogsOnOverride = true;
    }
    /**
     * Enables the usage of shutdown hooks. Will call the
     * `onApplicationShutdown` function of a provider if the
     * process receives a shutdown signal.
     *
     * @param {ShutdownSignal[]} [signals=[]] The system signals it should listen to
     *
     * @returns {this} The Nest application context instance
     */
    enableShutdownHooks(signals = []) {
        if ((0, shared_utils_1.isEmpty)(signals)) {
            signals = Object.keys(common_1.ShutdownSignal).map((key) => common_1.ShutdownSignal[key]);
        }
        else {
            // given signals array should be unique because
            // process shouldn't listen to the same signal more than once.
            signals = Array.from(new Set(signals));
        }
        signals = (0, iterare_1.iterate)(signals)
            .map((signal) => signal.toString().toUpperCase().trim())
            // filter out the signals which is already listening to
            .filter(signal => !this.activeShutdownSignals.includes(signal))
            .toArray();
        this.listenToShutdownSignals(signals);
        return this;
    }
    async dispose() {
        // Nest application context has no server
        // to dispose, therefore just call a noop
        return Promise.resolve();
    }
    /**
     * Listens to shutdown signals by listening to
     * process events
     *
     * @param {string[]} signals The system signals it should listen to
     */
    listenToShutdownSignals(signals) {
        const cleanup = async (signal) => {
            try {
                signals.forEach(sig => process.removeListener(sig, cleanup));
                await this.callDestroyHook();
                await this.callBeforeShutdownHook(signal);
                await this.dispose();
                await this.callShutdownHook(signal);
                process.kill(process.pid, signal);
            }
            catch (err) {
                common_1.Logger.error(constants_1.MESSAGES.ERROR_DURING_SHUTDOWN, err === null || err === void 0 ? void 0 : err.stack, NestApplicationContext.name);
                process.exit(1);
            }
        };
        this.shutdownCleanupRef = cleanup;
        signals.forEach((signal) => {
            this.activeShutdownSignals.push(signal);
            process.on(signal, cleanup);
        });
    }
    /**
     * Unsubscribes from shutdown signals (process events)
     */
    unsubscribeFromProcessSignals() {
        if (!this.shutdownCleanupRef) {
            return;
        }
        this.activeShutdownSignals.forEach(signal => {
            process.removeListener(signal, this.shutdownCleanupRef);
        });
    }
    /**
     * Calls the `onModuleInit` function on the registered
     * modules and its children.
     */
    async callInitHook() {
        const modulesSortedByDistance = this.getModulesSortedByDistance();
        for (const module of modulesSortedByDistance) {
            await (0, hooks_1.callModuleInitHook)(module);
        }
    }
    /**
     * Calls the `onModuleDestroy` function on the registered
     * modules and its children.
     */
    async callDestroyHook() {
        const modulesSortedByDistance = this.getModulesSortedByDistance();
        for (const module of modulesSortedByDistance) {
            await (0, hooks_1.callModuleDestroyHook)(module);
        }
    }
    /**
     * Calls the `onApplicationBootstrap` function on the registered
     * modules and its children.
     */
    async callBootstrapHook() {
        const modulesSortedByDistance = this.getModulesSortedByDistance();
        for (const module of modulesSortedByDistance) {
            await (0, hooks_1.callModuleBootstrapHook)(module);
        }
    }
    /**
     * Calls the `onApplicationShutdown` function on the registered
     * modules and children.
     */
    async callShutdownHook(signal) {
        const modulesSortedByDistance = this.getModulesSortedByDistance();
        for (const module of modulesSortedByDistance) {
            await (0, hooks_1.callAppShutdownHook)(module, signal);
        }
    }
    /**
     * Calls the `beforeApplicationShutdown` function on the registered
     * modules and children.
     */
    async callBeforeShutdownHook(signal) {
        const modulesSortedByDistance = this.getModulesSortedByDistance();
        for (const module of modulesSortedByDistance) {
            await (0, hooks_1.callBeforeAppShutdownHook)(module, signal);
        }
    }
    find(typeOrToken, contextModule) {
        const moduleId = contextModule && contextModule.id;
        const { wrapperRef } = this.instanceLinksHost.get(typeOrToken, moduleId);
        if (wrapperRef.scope === interfaces_1.Scope.REQUEST ||
            wrapperRef.scope === interfaces_1.Scope.TRANSIENT) {
            throw new invalid_class_scope_exception_1.InvalidClassScopeException(typeOrToken);
        }
        return wrapperRef.instance;
    }
    async resolvePerContext(typeOrToken, contextModule, contextId, options) {
        const isStrictModeEnabled = options && options.strict;
        const instanceLink = isStrictModeEnabled
            ? this.instanceLinksHost.get(typeOrToken, contextModule.id)
            : this.instanceLinksHost.get(typeOrToken);
        const { wrapperRef, collection } = instanceLink;
        if (wrapperRef.isDependencyTreeStatic() && !wrapperRef.isTransient) {
            return this.get(typeOrToken, options);
        }
        const ctorHost = wrapperRef.instance || { constructor: typeOrToken };
        const instance = await this.injector.loadPerContext(ctorHost, wrapperRef.host, collection, contextId);
        if (!instance) {
            throw new unknown_element_exception_1.UnknownElementException();
        }
        return instance;
    }
    getModulesSortedByDistance() {
        if (this._moduleRefsByDistance) {
            return this._moduleRefsByDistance;
        }
        const modulesContainer = this.container.getModules();
        const compareFn = (a, b) => b.distance - a.distance;
        this._moduleRefsByDistance = Array.from(modulesContainer.values()).sort(compareFn);
        return this._moduleRefsByDistance;
    }
}
exports.NestApplicationContext = NestApplicationContext;
