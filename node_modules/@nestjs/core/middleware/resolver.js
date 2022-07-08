"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddlewareResolver = void 0;
const injector_1 = require("../injector/injector");
class MiddlewareResolver {
    constructor(middlewareContainer) {
        this.middlewareContainer = middlewareContainer;
        this.instanceLoader = new injector_1.Injector();
    }
    async resolveInstances(moduleRef, moduleName) {
        const middleware = this.middlewareContainer.getMiddlewareCollection(moduleName);
        const resolveInstance = async (wrapper) => this.resolveMiddlewareInstance(wrapper, middleware, moduleRef);
        await Promise.all([...middleware.values()].map(resolveInstance));
    }
    async resolveMiddlewareInstance(wrapper, middleware, moduleRef) {
        await this.instanceLoader.loadMiddleware(wrapper, middleware, moduleRef);
    }
}
exports.MiddlewareResolver = MiddlewareResolver;
