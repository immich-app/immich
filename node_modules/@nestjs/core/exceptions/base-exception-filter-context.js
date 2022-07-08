"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseExceptionFilterContext = void 0;
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const context_creator_1 = require("../helpers/context-creator");
const constants_2 = require("../injector/constants");
class BaseExceptionFilterContext extends context_creator_1.ContextCreator {
    constructor(container) {
        super();
        this.container = container;
    }
    createConcreteContext(metadata, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        if ((0, shared_utils_1.isEmpty)(metadata)) {
            return [];
        }
        return (0, iterare_1.iterate)(metadata)
            .filter(instance => instance && ((0, shared_utils_1.isFunction)(instance.catch) || instance.name))
            .map(filter => this.getFilterInstance(filter, contextId, inquirerId))
            .filter(item => !!item)
            .map(instance => ({
            func: instance.catch.bind(instance),
            exceptionMetatypes: this.reflectCatchExceptions(instance),
        }))
            .toArray();
    }
    getFilterInstance(filter, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        const isObject = filter.catch;
        if (isObject) {
            return filter;
        }
        const instanceWrapper = this.getInstanceByMetatype(filter);
        if (!instanceWrapper) {
            return null;
        }
        const instanceHost = instanceWrapper.getInstanceByContextId(contextId, inquirerId);
        return instanceHost && instanceHost.instance;
    }
    getInstanceByMetatype(metatype) {
        if (!this.moduleContext) {
            return;
        }
        const collection = this.container.getModules();
        const moduleRef = collection.get(this.moduleContext);
        if (!moduleRef) {
            return;
        }
        return moduleRef.injectables.get(metatype);
    }
    reflectCatchExceptions(instance) {
        const prototype = Object.getPrototypeOf(instance);
        return (Reflect.getMetadata(constants_1.FILTER_CATCH_EXCEPTIONS, prototype.constructor) || []);
    }
}
exports.BaseExceptionFilterContext = BaseExceptionFilterContext;
