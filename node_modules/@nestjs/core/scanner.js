"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependenciesScanner = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const interfaces_1 = require("@nestjs/common/interfaces");
const random_string_generator_util_1 = require("@nestjs/common/utils/random-string-generator.util");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const application_config_1 = require("./application-config");
const constants_2 = require("./constants");
const circular_dependency_exception_1 = require("./errors/exceptions/circular-dependency.exception");
const invalid_class_module_exception_1 = require("./errors/exceptions/invalid-class-module.exception");
const invalid_module_exception_1 = require("./errors/exceptions/invalid-module.exception");
const undefined_module_exception_1 = require("./errors/exceptions/undefined-module.exception");
const get_class_scope_1 = require("./helpers/get-class-scope");
const internal_core_module_factory_1 = require("./injector/internal-core-module-factory");
class DependenciesScanner {
    constructor(container, metadataScanner, applicationConfig = new application_config_1.ApplicationConfig()) {
        this.container = container;
        this.metadataScanner = metadataScanner;
        this.applicationConfig = applicationConfig;
        this.logger = new common_1.Logger(DependenciesScanner.name);
        this.applicationProvidersApplyMap = [];
    }
    async scan(module) {
        await this.registerCoreModule();
        await this.scanForModules(module);
        await this.scanModulesForDependencies();
        this.calculateModulesDistance();
        this.addScopedEnhancersMetadata();
        this.container.bindGlobalScope();
    }
    async scanForModules(moduleDefinition, scope = [], ctxRegistry = []) {
        const moduleInstance = await this.insertModule(moduleDefinition, scope);
        moduleDefinition =
            moduleDefinition instanceof Promise
                ? await moduleDefinition
                : moduleDefinition;
        ctxRegistry.push(moduleDefinition);
        if (this.isForwardReference(moduleDefinition)) {
            moduleDefinition = moduleDefinition.forwardRef();
        }
        const modules = !this.isDynamicModule(moduleDefinition)
            ? this.reflectMetadata(moduleDefinition, constants_1.MODULE_METADATA.IMPORTS)
            : [
                ...this.reflectMetadata(moduleDefinition.module, constants_1.MODULE_METADATA.IMPORTS),
                ...(moduleDefinition.imports || []),
            ];
        let registeredModuleRefs = [];
        for (const [index, innerModule] of modules.entries()) {
            // In case of a circular dependency (ES module system), JavaScript will resolve the type to `undefined`.
            if (innerModule === undefined) {
                throw new undefined_module_exception_1.UndefinedModuleException(moduleDefinition, index, scope);
            }
            if (!innerModule) {
                throw new invalid_module_exception_1.InvalidModuleException(moduleDefinition, index, scope);
            }
            if (ctxRegistry.includes(innerModule)) {
                continue;
            }
            const moduleRefs = await this.scanForModules(innerModule, [].concat(scope, moduleDefinition), ctxRegistry);
            registeredModuleRefs = registeredModuleRefs.concat(moduleRefs);
        }
        if (!moduleInstance) {
            return registeredModuleRefs;
        }
        return [moduleInstance].concat(registeredModuleRefs);
    }
    async insertModule(moduleDefinition, scope) {
        const moduleToAdd = this.isForwardReference(moduleDefinition)
            ? moduleDefinition.forwardRef()
            : moduleDefinition;
        if (this.isInjectable(moduleToAdd) ||
            this.isController(moduleToAdd) ||
            this.isExceptionFilter(moduleToAdd)) {
            // TODO(v9): Throw the exception instead of printing a warning
            this.logger.warn(new invalid_class_module_exception_1.InvalidClassModuleException(moduleDefinition, scope).message);
        }
        return this.container.addModule(moduleToAdd, scope);
    }
    async scanModulesForDependencies(modules = this.container.getModules()) {
        for (const [token, { metatype }] of modules) {
            await this.reflectImports(metatype, token, metatype.name);
            this.reflectProviders(metatype, token);
            this.reflectControllers(metatype, token);
            this.reflectExports(metatype, token);
        }
    }
    async reflectImports(module, token, context) {
        const modules = [
            ...this.reflectMetadata(module, constants_1.MODULE_METADATA.IMPORTS),
            ...this.container.getDynamicMetadataByToken(token, constants_1.MODULE_METADATA.IMPORTS),
        ];
        for (const related of modules) {
            await this.insertImport(related, token, context);
        }
    }
    reflectProviders(module, token) {
        const providers = [
            ...this.reflectMetadata(module, constants_1.MODULE_METADATA.PROVIDERS),
            ...this.container.getDynamicMetadataByToken(token, constants_1.MODULE_METADATA.PROVIDERS),
        ];
        providers.forEach(provider => {
            this.insertProvider(provider, token);
            this.reflectDynamicMetadata(provider, token);
        });
    }
    reflectControllers(module, token) {
        const controllers = [
            ...this.reflectMetadata(module, constants_1.MODULE_METADATA.CONTROLLERS),
            ...this.container.getDynamicMetadataByToken(token, constants_1.MODULE_METADATA.CONTROLLERS),
        ];
        controllers.forEach(item => {
            this.insertController(item, token);
            this.reflectDynamicMetadata(item, token);
        });
    }
    reflectDynamicMetadata(obj, token) {
        if (!obj || !obj.prototype) {
            return;
        }
        this.reflectInjectables(obj, token, constants_1.GUARDS_METADATA);
        this.reflectInjectables(obj, token, constants_1.INTERCEPTORS_METADATA);
        this.reflectInjectables(obj, token, constants_1.EXCEPTION_FILTERS_METADATA);
        this.reflectInjectables(obj, token, constants_1.PIPES_METADATA);
        this.reflectParamInjectables(obj, token, constants_1.ROUTE_ARGS_METADATA);
    }
    reflectExports(module, token) {
        const exports = [
            ...this.reflectMetadata(module, constants_1.MODULE_METADATA.EXPORTS),
            ...this.container.getDynamicMetadataByToken(token, constants_1.MODULE_METADATA.EXPORTS),
        ];
        exports.forEach(exportedProvider => this.insertExportedProvider(exportedProvider, token));
    }
    reflectInjectables(component, token, metadataKey) {
        const controllerInjectables = this.reflectMetadata(component, metadataKey);
        const methodsInjectables = this.metadataScanner.scanFromPrototype(null, component.prototype, this.reflectKeyMetadata.bind(this, component, metadataKey));
        const flattenMethodsInjectables = this.flatten(methodsInjectables);
        const combinedInjectables = [
            ...controllerInjectables,
            ...flattenMethodsInjectables,
        ].filter(shared_utils_1.isFunction);
        const injectables = Array.from(new Set(combinedInjectables));
        injectables.forEach(injectable => this.insertInjectable(injectable, token, component));
    }
    reflectParamInjectables(component, token, metadataKey) {
        const paramsMetadata = this.metadataScanner.scanFromPrototype(null, component.prototype, method => Reflect.getMetadata(metadataKey, component, method));
        const paramsInjectables = this.flatten(paramsMetadata).map((param) => (0, common_1.flatten)(Object.keys(param).map(k => param[k].pipes)).filter(shared_utils_1.isFunction));
        (0, common_1.flatten)(paramsInjectables).forEach((injectable) => this.insertInjectable(injectable, token, component));
    }
    reflectKeyMetadata(component, key, method) {
        let prototype = component.prototype;
        do {
            const descriptor = Reflect.getOwnPropertyDescriptor(prototype, method);
            if (!descriptor) {
                continue;
            }
            return Reflect.getMetadata(key, descriptor.value);
        } while ((prototype = Reflect.getPrototypeOf(prototype)) &&
            prototype !== Object.prototype &&
            prototype);
        return undefined;
    }
    async calculateModulesDistance() {
        const modulesGenerator = this.container.getModules().values();
        // Skip "InternalCoreModule" from calculating distance
        modulesGenerator.next();
        const modulesStack = [];
        const calculateDistance = (moduleRef, distance = 1) => {
            if (modulesStack.includes(moduleRef)) {
                return;
            }
            modulesStack.push(moduleRef);
            const moduleImports = moduleRef.imports;
            moduleImports.forEach(importedModuleRef => {
                if (importedModuleRef) {
                    importedModuleRef.distance = distance;
                    calculateDistance(importedModuleRef, distance + 1);
                }
            });
        };
        const rootModule = modulesGenerator.next().value;
        calculateDistance(rootModule);
    }
    async insertImport(related, token, context) {
        if ((0, shared_utils_1.isUndefined)(related)) {
            throw new circular_dependency_exception_1.CircularDependencyException(context);
        }
        if (this.isForwardReference(related)) {
            return this.container.addImport(related.forwardRef(), token);
        }
        await this.container.addImport(related, token);
    }
    isCustomProvider(provider) {
        return provider && !(0, shared_utils_1.isNil)(provider.provide);
    }
    insertProvider(provider, token) {
        const isCustomProvider = this.isCustomProvider(provider);
        if (!isCustomProvider) {
            return this.container.addProvider(provider, token);
        }
        const applyProvidersMap = this.getApplyProvidersMap();
        const providersKeys = Object.keys(applyProvidersMap);
        const type = provider.provide;
        if (!providersKeys.includes(type)) {
            return this.container.addProvider(provider, token);
        }
        const providerToken = `${type} (UUID: ${(0, random_string_generator_util_1.randomStringGenerator)()})`;
        let scope = provider.scope;
        if ((0, shared_utils_1.isNil)(scope) && provider.useClass) {
            scope = (0, get_class_scope_1.getClassScope)(provider.useClass);
        }
        this.applicationProvidersApplyMap.push({
            type,
            moduleKey: token,
            providerKey: providerToken,
            scope,
        });
        const newProvider = Object.assign(Object.assign({}, provider), { provide: providerToken, scope });
        const factoryOrClassProvider = newProvider;
        if (this.isRequestOrTransient(factoryOrClassProvider.scope)) {
            return this.container.addInjectable(newProvider, token);
        }
        this.container.addProvider(newProvider, token);
    }
    insertInjectable(injectable, token, host) {
        this.container.addInjectable(injectable, token, host);
    }
    insertExportedProvider(exportedProvider, token) {
        this.container.addExportedProvider(exportedProvider, token);
    }
    insertController(controller, token) {
        this.container.addController(controller, token);
    }
    reflectMetadata(metatype, metadataKey) {
        return Reflect.getMetadata(metadataKey, metatype) || [];
    }
    async registerCoreModule() {
        const moduleDefinition = internal_core_module_factory_1.InternalCoreModuleFactory.create(this.container, this, this.container.getModuleCompiler(), this.container.getHttpAdapterHostRef());
        const [instance] = await this.scanForModules(moduleDefinition);
        this.container.registerCoreModuleRef(instance);
    }
    /**
     * Add either request or transient globally scoped enhancers
     * to all controllers metadata storage
     */
    addScopedEnhancersMetadata() {
        (0, iterare_1.iterate)(this.applicationProvidersApplyMap)
            .filter(wrapper => this.isRequestOrTransient(wrapper.scope))
            .forEach(({ moduleKey, providerKey }) => {
            const modulesContainer = this.container.getModules();
            const { injectables } = modulesContainer.get(moduleKey);
            const instanceWrapper = injectables.get(providerKey);
            (0, iterare_1.iterate)(modulesContainer.values())
                .map(module => module.controllers.values())
                .flatten()
                .forEach(controller => controller.addEnhancerMetadata(instanceWrapper));
        });
    }
    applyApplicationProviders() {
        const applyProvidersMap = this.getApplyProvidersMap();
        const applyRequestProvidersMap = this.getApplyRequestProvidersMap();
        const getInstanceWrapper = (moduleKey, providerKey, collectionKey) => {
            const modules = this.container.getModules();
            const collection = modules.get(moduleKey)[collectionKey];
            return collection.get(providerKey);
        };
        // Add global enhancers to the application config
        this.applicationProvidersApplyMap.forEach(({ moduleKey, providerKey, type, scope }) => {
            let instanceWrapper;
            if (this.isRequestOrTransient(scope)) {
                instanceWrapper = getInstanceWrapper(moduleKey, providerKey, 'injectables');
                return applyRequestProvidersMap[type](instanceWrapper);
            }
            instanceWrapper = getInstanceWrapper(moduleKey, providerKey, 'providers');
            applyProvidersMap[type](instanceWrapper.instance);
        });
    }
    getApplyProvidersMap() {
        return {
            [constants_2.APP_INTERCEPTOR]: (interceptor) => this.applicationConfig.addGlobalInterceptor(interceptor),
            [constants_2.APP_PIPE]: (pipe) => this.applicationConfig.addGlobalPipe(pipe),
            [constants_2.APP_GUARD]: (guard) => this.applicationConfig.addGlobalGuard(guard),
            [constants_2.APP_FILTER]: (filter) => this.applicationConfig.addGlobalFilter(filter),
        };
    }
    getApplyRequestProvidersMap() {
        return {
            [constants_2.APP_INTERCEPTOR]: (interceptor) => this.applicationConfig.addGlobalRequestInterceptor(interceptor),
            [constants_2.APP_PIPE]: (pipe) => this.applicationConfig.addGlobalRequestPipe(pipe),
            [constants_2.APP_GUARD]: (guard) => this.applicationConfig.addGlobalRequestGuard(guard),
            [constants_2.APP_FILTER]: (filter) => this.applicationConfig.addGlobalRequestFilter(filter),
        };
    }
    isDynamicModule(module) {
        return module && !!module.module;
    }
    /**
     * @param metatype
     * @returns `true` if `metatype` is annotated with the `@Injectable()` decorator.
     */
    isInjectable(metatype) {
        return !!Reflect.getMetadata(constants_1.INJECTABLE_WATERMARK, metatype);
    }
    /**
     * @param metatype
     * @returns `true` if `metatype` is annotated with the `@Controller()` decorator.
     */
    isController(metatype) {
        return !!Reflect.getMetadata(constants_1.CONTROLLER_WATERMARK, metatype);
    }
    /**
     * @param metatype
     * @returns `true` if `metatype` is annotated with the `@Catch()` decorator.
     */
    isExceptionFilter(metatype) {
        return !!Reflect.getMetadata(constants_1.CATCH_WATERMARK, metatype);
    }
    isForwardReference(module) {
        return module && !!module.forwardRef;
    }
    flatten(arr) {
        return arr.reduce((a, b) => a.concat(b), []);
    }
    isRequestOrTransient(scope) {
        return scope === interfaces_1.Scope.REQUEST || scope === interfaces_1.Scope.TRANSIENT;
    }
}
exports.DependenciesScanner = DependenciesScanner;
