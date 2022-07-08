"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Injector = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const cli_colors_util_1 = require("@nestjs/common/utils/cli-colors.util");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const runtime_exception_1 = require("../errors/exceptions/runtime.exception");
const undefined_dependency_exception_1 = require("../errors/exceptions/undefined-dependency.exception");
const unknown_dependencies_exception_1 = require("../errors/exceptions/unknown-dependencies.exception");
const constants_2 = require("./constants");
const inquirer_1 = require("./inquirer");
const instance_wrapper_1 = require("./instance-wrapper");
class Injector {
    constructor() {
        this.logger = new common_1.Logger('InjectorLogger');
    }
    loadPrototype({ token }, collection, contextId = constants_2.STATIC_CONTEXT) {
        if (!collection) {
            return;
        }
        const target = collection.get(token);
        const instance = target.createPrototype(contextId);
        if (instance) {
            const wrapper = new instance_wrapper_1.InstanceWrapper(Object.assign(Object.assign({}, target), { instance }));
            collection.set(token, wrapper);
        }
    }
    async loadInstance(wrapper, collection, moduleRef, contextId = constants_2.STATIC_CONTEXT, inquirer) {
        const inquirerId = this.getInquirerId(inquirer);
        const instanceHost = wrapper.getInstanceByContextId(contextId, inquirerId);
        if (instanceHost.isPending) {
            return instanceHost.donePromise;
        }
        const done = this.applyDoneHook(instanceHost);
        const token = wrapper.token || wrapper.name;
        const { inject } = wrapper;
        const targetWrapper = collection.get(token);
        if ((0, shared_utils_1.isUndefined)(targetWrapper)) {
            throw new runtime_exception_1.RuntimeException();
        }
        if (instanceHost.isResolved) {
            return done();
        }
        const callback = async (instances) => {
            const properties = await this.resolveProperties(wrapper, moduleRef, inject, contextId, wrapper, inquirer);
            const instance = await this.instantiateClass(instances, wrapper, targetWrapper, contextId, inquirer);
            this.applyProperties(instance, properties);
            done();
        };
        await this.resolveConstructorParams(wrapper, moduleRef, inject, callback, contextId, wrapper, inquirer);
    }
    async loadMiddleware(wrapper, collection, moduleRef, contextId = constants_2.STATIC_CONTEXT, inquirer) {
        const { metatype, token } = wrapper;
        const targetWrapper = collection.get(token);
        if (!(0, shared_utils_1.isUndefined)(targetWrapper.instance)) {
            return;
        }
        targetWrapper.instance = Object.create(metatype.prototype);
        await this.loadInstance(wrapper, collection, moduleRef, contextId, inquirer || wrapper);
    }
    async loadController(wrapper, moduleRef, contextId = constants_2.STATIC_CONTEXT) {
        const controllers = moduleRef.controllers;
        await this.loadInstance(wrapper, controllers, moduleRef, contextId, wrapper);
        await this.loadEnhancersPerContext(wrapper, contextId, wrapper);
    }
    async loadInjectable(wrapper, moduleRef, contextId = constants_2.STATIC_CONTEXT, inquirer) {
        const injectables = moduleRef.injectables;
        await this.loadInstance(wrapper, injectables, moduleRef, contextId, inquirer);
    }
    async loadProvider(wrapper, moduleRef, contextId = constants_2.STATIC_CONTEXT, inquirer) {
        const providers = moduleRef.providers;
        await this.loadInstance(wrapper, providers, moduleRef, contextId, inquirer);
        await this.loadEnhancersPerContext(wrapper, contextId, wrapper);
    }
    applyDoneHook(wrapper) {
        let done;
        wrapper.donePromise = new Promise((resolve, reject) => {
            done = resolve;
        });
        wrapper.isPending = true;
        return done;
    }
    async resolveConstructorParams(wrapper, moduleRef, inject, callback, contextId = constants_2.STATIC_CONTEXT, inquirer, parentInquirer) {
        let inquirerId = this.getInquirerId(inquirer);
        const metadata = wrapper.getCtorMetadata();
        if (metadata && contextId !== constants_2.STATIC_CONTEXT) {
            const deps = await this.loadCtorMetadata(metadata, contextId, inquirer, parentInquirer);
            return callback(deps);
        }
        const isFactoryProvider = !(0, shared_utils_1.isNil)(inject);
        const [dependencies, optionalDependenciesIds] = isFactoryProvider
            ? this.getFactoryProviderDependencies(wrapper)
            : this.getClassDependencies(wrapper);
        let isResolved = true;
        const resolveParam = async (param, index) => {
            try {
                if (this.isInquirer(param, parentInquirer)) {
                    return parentInquirer && parentInquirer.instance;
                }
                if ((inquirer === null || inquirer === void 0 ? void 0 : inquirer.isTransient) && parentInquirer) {
                    inquirer = parentInquirer;
                    inquirerId = this.getInquirerId(parentInquirer);
                }
                const paramWrapper = await this.resolveSingleParam(wrapper, param, { index, dependencies }, moduleRef, contextId, inquirer, index);
                const instanceHost = paramWrapper.getInstanceByContextId(contextId, inquirerId);
                if (!instanceHost.isResolved && !paramWrapper.forwardRef) {
                    isResolved = false;
                }
                return instanceHost === null || instanceHost === void 0 ? void 0 : instanceHost.instance;
            }
            catch (err) {
                const isOptional = optionalDependenciesIds.includes(index);
                if (!isOptional) {
                    throw err;
                }
                return undefined;
            }
        };
        const instances = await Promise.all(dependencies.map(resolveParam));
        isResolved && (await callback(instances));
    }
    getClassDependencies(wrapper) {
        const ctorRef = wrapper.metatype;
        return [
            this.reflectConstructorParams(ctorRef),
            this.reflectOptionalParams(ctorRef),
        ];
    }
    getFactoryProviderDependencies(wrapper) {
        var _a, _b;
        const optionalDependenciesIds = [];
        const isOptionalFactoryDep = (item) => !(0, shared_utils_1.isUndefined)(item.token) &&
            !(0, shared_utils_1.isUndefined)(item.optional);
        const mapFactoryProviderInjectArray = (item, index) => {
            if (typeof item !== 'object') {
                return item;
            }
            if (isOptionalFactoryDep(item)) {
                if (item.optional) {
                    optionalDependenciesIds.push(index);
                }
                return item === null || item === void 0 ? void 0 : item.token;
            }
            return item;
        };
        return [
            (_b = (_a = wrapper.inject) === null || _a === void 0 ? void 0 : _a.map) === null || _b === void 0 ? void 0 : _b.call(_a, mapFactoryProviderInjectArray),
            optionalDependenciesIds,
        ];
    }
    reflectConstructorParams(type) {
        const paramtypes = Reflect.getMetadata(constants_1.PARAMTYPES_METADATA, type) || [];
        const selfParams = this.reflectSelfParams(type);
        selfParams.forEach(({ index, param }) => (paramtypes[index] = param));
        return paramtypes;
    }
    reflectOptionalParams(type) {
        return Reflect.getMetadata(constants_1.OPTIONAL_DEPS_METADATA, type) || [];
    }
    reflectSelfParams(type) {
        return Reflect.getMetadata(constants_1.SELF_DECLARED_DEPS_METADATA, type) || [];
    }
    async resolveSingleParam(wrapper, param, dependencyContext, moduleRef, contextId = constants_2.STATIC_CONTEXT, inquirer, keyOrIndex) {
        if ((0, shared_utils_1.isUndefined)(param)) {
            this.logger.log('Nest encountered an undefined dependency. This may be due to a circular import or a missing dependency declaration.');
            throw new undefined_dependency_exception_1.UndefinedDependencyException(wrapper.name, dependencyContext, moduleRef);
        }
        const token = this.resolveParamToken(wrapper, param);
        return this.resolveComponentInstance(moduleRef, token, dependencyContext, wrapper, contextId, inquirer, keyOrIndex);
    }
    resolveParamToken(wrapper, param) {
        if (!param.forwardRef) {
            return param;
        }
        wrapper.forwardRef = true;
        return param.forwardRef();
    }
    async resolveComponentInstance(moduleRef, token, dependencyContext, wrapper, contextId = constants_2.STATIC_CONTEXT, inquirer, keyOrIndex) {
        this.printResolvingDependenciesLog(token, inquirer);
        this.printLookingForProviderLog(token, moduleRef);
        const providers = moduleRef.providers;
        const instanceWrapper = await this.lookupComponent(providers, moduleRef, Object.assign(Object.assign({}, dependencyContext), { name: token }), wrapper, contextId, inquirer, keyOrIndex);
        return this.resolveComponentHost(moduleRef, instanceWrapper, contextId, inquirer);
    }
    async resolveComponentHost(moduleRef, instanceWrapper, contextId = constants_2.STATIC_CONTEXT, inquirer) {
        var _a;
        const inquirerId = this.getInquirerId(inquirer);
        const instanceHost = instanceWrapper.getInstanceByContextId(contextId, inquirerId);
        if (!instanceHost.isResolved && !instanceWrapper.forwardRef) {
            await this.loadProvider(instanceWrapper, (_a = instanceWrapper.host) !== null && _a !== void 0 ? _a : moduleRef, contextId, inquirer);
        }
        else if (!instanceHost.isResolved &&
            instanceWrapper.forwardRef &&
            (contextId !== constants_2.STATIC_CONTEXT || !!inquirerId)) {
            /**
             * When circular dependency has been detected between
             * either request/transient providers, we have to asynchronously
             * resolve instance host for a specific contextId or inquirer, to ensure
             * that eventual lazily created instance will be merged with the prototype
             * instantiated beforehand.
             */
            instanceHost.donePromise &&
                instanceHost.donePromise.then(() => this.loadProvider(instanceWrapper, moduleRef, contextId, inquirer));
        }
        if (instanceWrapper.async) {
            const host = instanceWrapper.getInstanceByContextId(contextId, inquirerId);
            host.instance = await host.instance;
            instanceWrapper.setInstanceByContextId(contextId, host, inquirerId);
        }
        return instanceWrapper;
    }
    async lookupComponent(providers, moduleRef, dependencyContext, wrapper, contextId = constants_2.STATIC_CONTEXT, inquirer, keyOrIndex) {
        const token = wrapper.token || wrapper.name;
        const { name } = dependencyContext;
        if (wrapper && token === name) {
            throw new unknown_dependencies_exception_1.UnknownDependenciesException(wrapper.name, dependencyContext, moduleRef);
        }
        if (providers.has(name)) {
            const instanceWrapper = providers.get(name);
            this.printFoundInModuleLog(name, moduleRef);
            this.addDependencyMetadata(keyOrIndex, wrapper, instanceWrapper);
            return instanceWrapper;
        }
        return this.lookupComponentInParentModules(dependencyContext, moduleRef, wrapper, contextId, inquirer, keyOrIndex);
    }
    async lookupComponentInParentModules(dependencyContext, moduleRef, wrapper, contextId = constants_2.STATIC_CONTEXT, inquirer, keyOrIndex) {
        const instanceWrapper = await this.lookupComponentInImports(moduleRef, dependencyContext.name, wrapper, [], contextId, inquirer, keyOrIndex);
        if ((0, shared_utils_1.isNil)(instanceWrapper)) {
            throw new unknown_dependencies_exception_1.UnknownDependenciesException(wrapper.name, dependencyContext, moduleRef);
        }
        return instanceWrapper;
    }
    async lookupComponentInImports(moduleRef, name, wrapper, moduleRegistry = [], contextId = constants_2.STATIC_CONTEXT, inquirer, keyOrIndex, isTraversing) {
        let instanceWrapperRef = null;
        const imports = moduleRef.imports || new Set();
        const identity = (item) => item;
        let children = [...imports.values()].filter(identity);
        if (isTraversing) {
            const contextModuleExports = moduleRef.exports;
            children = children.filter(child => contextModuleExports.has(child.metatype));
        }
        for (const relatedModule of children) {
            if (moduleRegistry.includes(relatedModule.id)) {
                continue;
            }
            this.printLookingForProviderLog(name, relatedModule);
            moduleRegistry.push(relatedModule.id);
            const { providers, exports } = relatedModule;
            if (!exports.has(name) || !providers.has(name)) {
                const instanceRef = await this.lookupComponentInImports(relatedModule, name, wrapper, moduleRegistry, contextId, inquirer, keyOrIndex, true);
                if (instanceRef) {
                    this.addDependencyMetadata(keyOrIndex, wrapper, instanceRef);
                    return instanceRef;
                }
                continue;
            }
            this.printFoundInModuleLog(name, relatedModule);
            instanceWrapperRef = providers.get(name);
            this.addDependencyMetadata(keyOrIndex, wrapper, instanceWrapperRef);
            const inquirerId = this.getInquirerId(inquirer);
            const instanceHost = instanceWrapperRef.getInstanceByContextId(contextId, inquirerId);
            if (!instanceHost.isResolved && !instanceWrapperRef.forwardRef) {
                await this.loadProvider(instanceWrapperRef, relatedModule, contextId, wrapper);
                break;
            }
        }
        return instanceWrapperRef;
    }
    async resolveProperties(wrapper, moduleRef, inject, contextId = constants_2.STATIC_CONTEXT, inquirer, parentInquirer) {
        if (!(0, shared_utils_1.isNil)(inject)) {
            return [];
        }
        const metadata = wrapper.getPropertiesMetadata();
        if (metadata && contextId !== constants_2.STATIC_CONTEXT) {
            return this.loadPropertiesMetadata(metadata, contextId, inquirer);
        }
        const properties = this.reflectProperties(wrapper.metatype);
        const instances = await Promise.all(properties.map(async (item) => {
            try {
                const dependencyContext = {
                    key: item.key,
                    name: item.name,
                };
                if (this.isInquirer(item.name, parentInquirer)) {
                    return parentInquirer && parentInquirer.instance;
                }
                const paramWrapper = await this.resolveSingleParam(wrapper, item.name, dependencyContext, moduleRef, contextId, inquirer, item.key);
                if (!paramWrapper) {
                    return undefined;
                }
                const inquirerId = this.getInquirerId(inquirer);
                const instanceHost = paramWrapper.getInstanceByContextId(contextId, inquirerId);
                return instanceHost.instance;
            }
            catch (err) {
                if (!item.isOptional) {
                    throw err;
                }
                return undefined;
            }
        }));
        return properties.map((item, index) => (Object.assign(Object.assign({}, item), { instance: instances[index] })));
    }
    reflectProperties(type) {
        const properties = Reflect.getMetadata(constants_1.PROPERTY_DEPS_METADATA, type) || [];
        const optionalKeys = Reflect.getMetadata(constants_1.OPTIONAL_PROPERTY_DEPS_METADATA, type) || [];
        return properties.map((item) => (Object.assign(Object.assign({}, item), { name: item.type, isOptional: optionalKeys.includes(item.key) })));
    }
    applyProperties(instance, properties) {
        if (!(0, shared_utils_1.isObject)(instance)) {
            return undefined;
        }
        (0, iterare_1.iterate)(properties)
            .filter(item => !(0, shared_utils_1.isNil)(item.instance))
            .forEach(item => (instance[item.key] = item.instance));
    }
    async instantiateClass(instances, wrapper, targetMetatype, contextId = constants_2.STATIC_CONTEXT, inquirer) {
        const { metatype, inject } = wrapper;
        const inquirerId = this.getInquirerId(inquirer);
        const instanceHost = targetMetatype.getInstanceByContextId(contextId, inquirerId);
        const isInContext = wrapper.isStatic(contextId, inquirer) ||
            wrapper.isInRequestScope(contextId, inquirer) ||
            wrapper.isLazyTransient(contextId, inquirer) ||
            wrapper.isExplicitlyRequested(contextId, inquirer);
        if ((0, shared_utils_1.isNil)(inject) && isInContext) {
            instanceHost.instance = wrapper.forwardRef
                ? Object.assign(instanceHost.instance, new metatype(...instances))
                : new metatype(...instances);
        }
        else if (isInContext) {
            const factoryReturnValue = targetMetatype.metatype(...instances);
            instanceHost.instance = await factoryReturnValue;
        }
        instanceHost.isResolved = true;
        return instanceHost.instance;
    }
    async loadPerContext(instance, moduleRef, collection, ctx, wrapper) {
        if (!wrapper) {
            const injectionToken = instance.constructor;
            wrapper = collection.get(injectionToken);
        }
        await this.loadInstance(wrapper, collection, moduleRef, ctx, wrapper);
        await this.loadEnhancersPerContext(wrapper, ctx, wrapper);
        const host = wrapper.getInstanceByContextId(ctx, wrapper.id);
        return host && host.instance;
    }
    async loadEnhancersPerContext(wrapper, ctx, inquirer) {
        const enhancers = wrapper.getEnhancersMetadata() || [];
        const loadEnhancer = (item) => {
            const hostModule = item.host;
            return this.loadInstance(item, hostModule.injectables, hostModule, ctx, inquirer);
        };
        await Promise.all(enhancers.map(loadEnhancer));
    }
    async loadCtorMetadata(metadata, contextId, inquirer, parentInquirer) {
        const hosts = await Promise.all(metadata.map(async (item) => this.resolveScopedComponentHost(item, contextId, inquirer, parentInquirer)));
        const inquirerId = this.getInquirerId(inquirer);
        return hosts.map(item => item.getInstanceByContextId(contextId, inquirerId).instance);
    }
    async loadPropertiesMetadata(metadata, contextId, inquirer) {
        const dependenciesHosts = await Promise.all(metadata.map(async ({ wrapper: item, key }) => ({
            key,
            host: await this.resolveComponentHost(item.host, item, contextId, inquirer),
        })));
        const inquirerId = this.getInquirerId(inquirer);
        return dependenciesHosts.map(({ key, host }) => ({
            key,
            name: key,
            instance: host.getInstanceByContextId(contextId, inquirerId).instance,
        }));
    }
    getInquirerId(inquirer) {
        return inquirer && inquirer.id;
    }
    resolveScopedComponentHost(item, contextId, inquirer, parentInquirer) {
        return this.isInquirerRequest(item, parentInquirer)
            ? parentInquirer
            : this.resolveComponentHost(item.host, item, contextId, inquirer);
    }
    isInquirerRequest(item, parentInquirer) {
        return item.isTransient && item.name === inquirer_1.INQUIRER && parentInquirer;
    }
    isInquirer(param, parentInquirer) {
        return param === inquirer_1.INQUIRER && parentInquirer;
    }
    addDependencyMetadata(keyOrIndex, hostWrapper, instanceWrapper) {
        (0, shared_utils_1.isString)(keyOrIndex)
            ? hostWrapper.addPropertiesMetadata(keyOrIndex, instanceWrapper)
            : hostWrapper.addCtorMetadata(keyOrIndex, instanceWrapper);
    }
    getTokenName(token) {
        return (0, shared_utils_1.isFunction)(token) ? token.name : token.toString();
    }
    printResolvingDependenciesLog(token, inquirer) {
        var _a, _b, _c;
        if (!this.isDebugMode()) {
            return;
        }
        const tokenName = this.getTokenName(token);
        const dependentName = (_c = ((inquirer === null || inquirer === void 0 ? void 0 : inquirer.name) && ((_b = (_a = inquirer.name).toString) === null || _b === void 0 ? void 0 : _b.call(_a)))) !== null && _c !== void 0 ? _c : 'unknown';
        const isAlias = dependentName === tokenName;
        const messageToPrint = `Resolving dependency ${cli_colors_util_1.clc.cyanBright(tokenName)}${cli_colors_util_1.clc.green(' in the ')}${cli_colors_util_1.clc.yellow(dependentName)}${cli_colors_util_1.clc.green(` provider ${isAlias ? '(alias)' : ''}`)}`;
        this.logger.log(messageToPrint);
    }
    printLookingForProviderLog(token, moduleRef) {
        var _a, _b;
        if (!this.isDebugMode()) {
            return;
        }
        const tokenName = this.getTokenName(token);
        const moduleRefName = (_b = (_a = moduleRef === null || moduleRef === void 0 ? void 0 : moduleRef.metatype) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'unknown';
        this.logger.log(`Looking for ${cli_colors_util_1.clc.cyanBright(tokenName)}${cli_colors_util_1.clc.green(' in ')}${cli_colors_util_1.clc.magentaBright(moduleRefName)}`);
    }
    printFoundInModuleLog(token, moduleRef) {
        var _a, _b;
        if (!this.isDebugMode()) {
            return;
        }
        const tokenName = this.getTokenName(token);
        const moduleRefName = (_b = (_a = moduleRef === null || moduleRef === void 0 ? void 0 : moduleRef.metatype) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'unknown';
        this.logger.log(`Found ${cli_colors_util_1.clc.cyanBright(tokenName)}${cli_colors_util_1.clc.green(' in ')}${cli_colors_util_1.clc.magentaBright(moduleRefName)}`);
    }
    isDebugMode() {
        return !!process.env.NEST_DEBUG;
    }
}
exports.Injector = Injector;
