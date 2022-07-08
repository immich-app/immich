"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipesContextCreator = void 0;
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const context_creator_1 = require("../helpers/context-creator");
const constants_2 = require("../injector/constants");
class PipesContextCreator extends context_creator_1.ContextCreator {
    constructor(container, config) {
        super();
        this.container = container;
        this.config = config;
    }
    create(instance, callback, moduleKey, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        this.moduleContext = moduleKey;
        return this.createContext(instance, callback, constants_1.PIPES_METADATA, contextId, inquirerId);
    }
    createConcreteContext(metadata, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        if ((0, shared_utils_1.isEmpty)(metadata)) {
            return [];
        }
        return (0, iterare_1.iterate)(metadata)
            .filter((pipe) => pipe && (pipe.name || pipe.transform))
            .map(pipe => this.getPipeInstance(pipe, contextId, inquirerId))
            .filter(pipe => pipe && pipe.transform && (0, shared_utils_1.isFunction)(pipe.transform))
            .toArray();
    }
    getPipeInstance(pipe, contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        const isObject = pipe.transform;
        if (isObject) {
            return pipe;
        }
        const instanceWrapper = this.getInstanceByMetatype(pipe);
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
    getGlobalMetadata(contextId = constants_2.STATIC_CONTEXT, inquirerId) {
        if (!this.config) {
            return [];
        }
        const globalPipes = this.config.getGlobalPipes();
        if (contextId === constants_2.STATIC_CONTEXT && !inquirerId) {
            return globalPipes;
        }
        const scopedPipeWrappers = this.config.getGlobalRequestPipes();
        const scopedPipes = (0, iterare_1.iterate)(scopedPipeWrappers)
            .map(wrapper => wrapper.getInstanceByContextId(contextId, inquirerId))
            .filter(host => !!host)
            .map(host => host.instance)
            .toArray();
        return globalPipes.concat(scopedPipes);
    }
    setModuleContext(context) {
        this.moduleContext = context;
    }
}
exports.PipesContextCreator = PipesContextCreator;
