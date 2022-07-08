"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryService = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const modules_container_1 = require("../injector/modules-container");
/**
 * @publicApi
 */
let DiscoveryService = class DiscoveryService {
    constructor(modulesContainer) {
        this.modulesContainer = modulesContainer;
    }
    getProviders(options = {}, modules = this.getModules(options)) {
        const providers = modules.map(item => [...item.providers.values()]);
        return (0, common_1.flatten)(providers);
    }
    getControllers(options = {}, modules = this.getModules(options)) {
        const controllers = modules.map(item => [...item.controllers.values()]);
        return (0, common_1.flatten)(controllers);
    }
    getModules(options = {}) {
        if (!options.include) {
            const moduleRefs = [...this.modulesContainer.values()];
            return moduleRefs;
        }
        const whitelisted = this.includeWhitelisted(options.include);
        return whitelisted;
    }
    includeWhitelisted(include) {
        const moduleRefs = [...this.modulesContainer.values()];
        return moduleRefs.filter(({ metatype }) => include.some(item => item === metatype));
    }
};
DiscoveryService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [modules_container_1.ModulesContainer])
], DiscoveryService);
exports.DiscoveryService = DiscoveryService;
