"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyModuleLoader = void 0;
const module_ref_1 = require("./module-ref");
class LazyModuleLoader {
    constructor(dependenciesScanner, instanceLoader, moduleCompiler, modulesContainer) {
        this.dependenciesScanner = dependenciesScanner;
        this.instanceLoader = instanceLoader;
        this.moduleCompiler = moduleCompiler;
        this.modulesContainer = modulesContainer;
    }
    async load(loaderFn) {
        const moduleClassOrDynamicDefinition = await loaderFn();
        const moduleInstances = await this.dependenciesScanner.scanForModules(moduleClassOrDynamicDefinition);
        if (moduleInstances.length === 0) {
            // The module has been loaded already. In this case, we must
            // retrieve a module reference from the exising container.
            const { token } = await this.moduleCompiler.compile(moduleClassOrDynamicDefinition);
            const moduleInstance = this.modulesContainer.get(token);
            return moduleInstance && this.getTargetModuleRef(moduleInstance);
        }
        const lazyModulesContainer = this.createLazyModulesContainer(moduleInstances);
        await this.dependenciesScanner.scanModulesForDependencies(lazyModulesContainer);
        await this.instanceLoader.createInstancesOfDependencies(lazyModulesContainer);
        const [targetModule] = moduleInstances;
        return this.getTargetModuleRef(targetModule);
    }
    createLazyModulesContainer(moduleInstances) {
        moduleInstances = Array.from(new Set(moduleInstances));
        return new Map(moduleInstances.map(ref => [ref.token, ref]));
    }
    getTargetModuleRef(moduleInstance) {
        const moduleRefInstanceWrapper = moduleInstance.getProviderByKey(module_ref_1.ModuleRef);
        return moduleRefInstanceWrapper.instance;
    }
}
exports.LazyModuleLoader = LazyModuleLoader;
