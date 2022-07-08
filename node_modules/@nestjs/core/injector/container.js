"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestContainer = void 0;
const constants_1 = require("@nestjs/common/constants");
const circular_dependency_exception_1 = require("../errors/exceptions/circular-dependency.exception");
const undefined_forwardref_exception_1 = require("../errors/exceptions/undefined-forwardref.exception");
const unknown_module_exception_1 = require("../errors/exceptions/unknown-module.exception");
const request_constants_1 = require("../router/request/request-constants");
const compiler_1 = require("./compiler");
const internal_core_module_1 = require("./internal-core-module");
const internal_providers_storage_1 = require("./internal-providers-storage");
const module_1 = require("./module");
const module_token_factory_1 = require("./module-token-factory");
const modules_container_1 = require("./modules-container");
class NestContainer {
    constructor(_applicationConfig = undefined) {
        this._applicationConfig = _applicationConfig;
        this.globalModules = new Set();
        this.moduleTokenFactory = new module_token_factory_1.ModuleTokenFactory();
        this.moduleCompiler = new compiler_1.ModuleCompiler(this.moduleTokenFactory);
        this.modules = new modules_container_1.ModulesContainer();
        this.dynamicModulesMetadata = new Map();
        this.internalProvidersStorage = new internal_providers_storage_1.InternalProvidersStorage();
    }
    get applicationConfig() {
        return this._applicationConfig;
    }
    setHttpAdapter(httpAdapter) {
        this.internalProvidersStorage.httpAdapter = httpAdapter;
        if (!this.internalProvidersStorage.httpAdapterHost) {
            return;
        }
        const host = this.internalProvidersStorage.httpAdapterHost;
        host.httpAdapter = httpAdapter;
    }
    getHttpAdapterRef() {
        return this.internalProvidersStorage.httpAdapter;
    }
    getHttpAdapterHostRef() {
        return this.internalProvidersStorage.httpAdapterHost;
    }
    async addModule(metatype, scope) {
        // In DependenciesScanner#scanForModules we already check for undefined or invalid modules
        // We still need to catch the edge-case of `forwardRef(() => undefined)`
        if (!metatype) {
            throw new undefined_forwardref_exception_1.UndefinedForwardRefException(scope);
        }
        const { type, dynamicMetadata, token } = await this.moduleCompiler.compile(metatype);
        if (this.modules.has(token)) {
            return this.modules.get(token);
        }
        const moduleRef = new module_1.Module(type, this);
        moduleRef.token = token;
        this.modules.set(token, moduleRef);
        await this.addDynamicMetadata(token, dynamicMetadata, [].concat(scope, type));
        if (this.isGlobalModule(type, dynamicMetadata)) {
            this.addGlobalModule(moduleRef);
        }
        return moduleRef;
    }
    async addDynamicMetadata(token, dynamicModuleMetadata, scope) {
        if (!dynamicModuleMetadata) {
            return;
        }
        this.dynamicModulesMetadata.set(token, dynamicModuleMetadata);
        const { imports } = dynamicModuleMetadata;
        await this.addDynamicModules(imports, scope);
    }
    async addDynamicModules(modules, scope) {
        if (!modules) {
            return;
        }
        await Promise.all(modules.map(module => this.addModule(module, scope)));
    }
    isGlobalModule(metatype, dynamicMetadata) {
        if (dynamicMetadata && dynamicMetadata.global) {
            return true;
        }
        return !!Reflect.getMetadata(constants_1.GLOBAL_MODULE_METADATA, metatype);
    }
    addGlobalModule(module) {
        this.globalModules.add(module);
    }
    getModules() {
        return this.modules;
    }
    getModuleCompiler() {
        return this.moduleCompiler;
    }
    getModuleByKey(moduleKey) {
        return this.modules.get(moduleKey);
    }
    getInternalCoreModuleRef() {
        return this.internalCoreModule;
    }
    async addImport(relatedModule, token) {
        if (!this.modules.has(token)) {
            return;
        }
        const moduleRef = this.modules.get(token);
        const { token: relatedModuleToken } = await this.moduleCompiler.compile(relatedModule);
        const related = this.modules.get(relatedModuleToken);
        moduleRef.addRelatedModule(related);
    }
    addProvider(provider, token) {
        if (!provider) {
            throw new circular_dependency_exception_1.CircularDependencyException();
        }
        if (!this.modules.has(token)) {
            throw new unknown_module_exception_1.UnknownModuleException();
        }
        const moduleRef = this.modules.get(token);
        return moduleRef.addProvider(provider);
    }
    addInjectable(injectable, token, host) {
        if (!this.modules.has(token)) {
            throw new unknown_module_exception_1.UnknownModuleException();
        }
        const moduleRef = this.modules.get(token);
        moduleRef.addInjectable(injectable, host);
    }
    addExportedProvider(provider, token) {
        if (!this.modules.has(token)) {
            throw new unknown_module_exception_1.UnknownModuleException();
        }
        const moduleRef = this.modules.get(token);
        moduleRef.addExportedProvider(provider);
    }
    addController(controller, token) {
        if (!this.modules.has(token)) {
            throw new unknown_module_exception_1.UnknownModuleException();
        }
        const moduleRef = this.modules.get(token);
        moduleRef.addController(controller);
    }
    clear() {
        this.modules.clear();
    }
    replace(toReplace, options) {
        this.modules.forEach(moduleRef => moduleRef.replace(toReplace, options));
    }
    bindGlobalScope() {
        this.modules.forEach(moduleRef => this.bindGlobalsToImports(moduleRef));
    }
    bindGlobalsToImports(moduleRef) {
        this.globalModules.forEach(globalModule => this.bindGlobalModuleToModule(moduleRef, globalModule));
    }
    bindGlobalModuleToModule(target, globalModule) {
        if (target === globalModule || target === this.internalCoreModule) {
            return;
        }
        target.addRelatedModule(globalModule);
    }
    getDynamicMetadataByToken(token, metadataKey) {
        const metadata = this.dynamicModulesMetadata.get(token);
        if (metadata && metadata[metadataKey]) {
            return metadata[metadataKey];
        }
        return [];
    }
    registerCoreModuleRef(moduleRef) {
        this.internalCoreModule = moduleRef;
        this.modules[internal_core_module_1.InternalCoreModule.name] = moduleRef;
    }
    getModuleTokenFactory() {
        return this.moduleTokenFactory;
    }
    registerRequestProvider(request, contextId) {
        const wrapper = this.internalCoreModule.getProviderByKey(request_constants_1.REQUEST);
        wrapper.setInstanceByContextId(contextId, {
            instance: request,
            isResolved: true,
        });
    }
}
exports.NestContainer = NestContainer;
