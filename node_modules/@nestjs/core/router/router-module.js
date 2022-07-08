"use strict";
var RouterModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterModule = exports.targetModulesByContainer = exports.ROUTES = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const modules_container_1 = require("../injector/modules-container");
const utils_1 = require("./utils");
exports.ROUTES = Symbol('ROUTES');
exports.targetModulesByContainer = new WeakMap();
/**
 * @publicApi
 */
let RouterModule = RouterModule_1 = class RouterModule {
    constructor(modulesContainer, routes) {
        this.modulesContainer = modulesContainer;
        this.routes = routes;
        this.routes = this.deepCloneRoutes(routes);
        this.initialize();
    }
    static register(routes) {
        return {
            module: RouterModule_1,
            providers: [
                {
                    provide: exports.ROUTES,
                    useValue: routes,
                },
            ],
        };
    }
    deepCloneRoutes(routes) {
        return routes.map((routeOrType) => {
            if (typeof routeOrType === 'function') {
                return routeOrType;
            }
            if (routeOrType.children) {
                return Object.assign(Object.assign({}, routeOrType), { children: this.deepCloneRoutes(routeOrType.children) });
            }
            return Object.assign({}, routeOrType);
        });
    }
    initialize() {
        const flattenedRoutes = (0, utils_1.flattenRoutePaths)(this.routes);
        flattenedRoutes.forEach(route => {
            const modulePath = (0, shared_utils_1.normalizePath)(route.path);
            this.registerModulePathMetadata(route.module, modulePath);
            this.updateTargetModulesCache(route.module);
        });
    }
    registerModulePathMetadata(moduleCtor, modulePath) {
        Reflect.defineMetadata(constants_1.MODULE_PATH + this.modulesContainer.applicationId, modulePath, moduleCtor);
    }
    updateTargetModulesCache(moduleCtor) {
        let moduleClassSet;
        if (exports.targetModulesByContainer.has(this.modulesContainer)) {
            moduleClassSet = exports.targetModulesByContainer.get(this.modulesContainer);
        }
        else {
            moduleClassSet = new WeakSet();
            exports.targetModulesByContainer.set(this.modulesContainer, moduleClassSet);
        }
        const moduleRef = Array.from(this.modulesContainer.values()).find(item => (item === null || item === void 0 ? void 0 : item.metatype) === moduleCtor);
        if (!moduleRef) {
            return;
        }
        moduleClassSet.add(moduleRef);
    }
};
RouterModule = RouterModule_1 = tslib_1.__decorate([
    (0, common_1.Module)({}),
    tslib_1.__param(1, (0, common_1.Inject)(exports.ROUTES)),
    tslib_1.__metadata("design:paramtypes", [modules_container_1.ModulesContainer, Array])
], RouterModule);
exports.RouterModule = RouterModule;
