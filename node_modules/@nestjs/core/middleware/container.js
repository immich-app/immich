"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareContainer = void 0;
const instance_wrapper_1 = require("../injector/instance-wrapper");
const get_class_scope_1 = require("../helpers/get-class-scope");
class MiddlewareContainer {
    constructor(container) {
        this.container = container;
        this.middleware = new Map();
        this.configurationSets = new Map();
    }
    getMiddlewareCollection(moduleKey) {
        if (!this.middleware.has(moduleKey)) {
            const moduleRef = this.container.getModuleByKey(moduleKey);
            this.middleware.set(moduleKey, moduleRef.middlewares);
        }
        return this.middleware.get(moduleKey);
    }
    getConfigurations() {
        return this.configurationSets;
    }
    insertConfig(configList, moduleKey) {
        const middleware = this.getMiddlewareCollection(moduleKey);
        const targetConfig = this.getTargetConfig(moduleKey);
        const configurations = configList || [];
        const insertMiddleware = (metatype) => {
            const token = metatype;
            middleware.set(token, new instance_wrapper_1.InstanceWrapper({
                scope: (0, get_class_scope_1.getClassScope)(metatype),
                name: token,
                metatype,
                token,
            }));
        };
        configurations.forEach(config => {
            [].concat(config.middleware).map(insertMiddleware);
            targetConfig.add(config);
        });
    }
    getTargetConfig(moduleName) {
        if (!this.configurationSets.has(moduleName)) {
            this.configurationSets.set(moduleName, new Set());
        }
        return this.configurationSets.get(moduleName);
    }
}
exports.MiddlewareContainer = MiddlewareContainer;
