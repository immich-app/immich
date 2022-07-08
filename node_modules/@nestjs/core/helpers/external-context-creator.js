"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalContextCreator = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const rxjs_1 = require("rxjs");
const external_exception_filter_context_1 = require("../exceptions/external-exception-filter-context");
const constants_2 = require("../guards/constants");
const guards_consumer_1 = require("../guards/guards-consumer");
const guards_context_creator_1 = require("../guards/guards-context-creator");
const constants_3 = require("../injector/constants");
const interceptors_consumer_1 = require("../interceptors/interceptors-consumer");
const interceptors_context_creator_1 = require("../interceptors/interceptors-context-creator");
const pipes_consumer_1 = require("../pipes/pipes-consumer");
const pipes_context_creator_1 = require("../pipes/pipes-context-creator");
const context_utils_1 = require("./context-utils");
const external_proxy_1 = require("./external-proxy");
const handler_metadata_storage_1 = require("./handler-metadata-storage");
class ExternalContextCreator {
    constructor(guardsContextCreator, guardsConsumer, interceptorsContextCreator, interceptorsConsumer, modulesContainer, pipesContextCreator, pipesConsumer, filtersContextCreator) {
        this.guardsContextCreator = guardsContextCreator;
        this.guardsConsumer = guardsConsumer;
        this.interceptorsContextCreator = interceptorsContextCreator;
        this.interceptorsConsumer = interceptorsConsumer;
        this.modulesContainer = modulesContainer;
        this.pipesContextCreator = pipesContextCreator;
        this.pipesConsumer = pipesConsumer;
        this.filtersContextCreator = filtersContextCreator;
        this.contextUtils = new context_utils_1.ContextUtils();
        this.externalErrorProxy = new external_proxy_1.ExternalErrorProxy();
        this.handlerMetadataStorage = new handler_metadata_storage_1.HandlerMetadataStorage();
    }
    static fromContainer(container) {
        const guardsContextCreator = new guards_context_creator_1.GuardsContextCreator(container, container.applicationConfig);
        const guardsConsumer = new guards_consumer_1.GuardsConsumer();
        const interceptorsContextCreator = new interceptors_context_creator_1.InterceptorsContextCreator(container, container.applicationConfig);
        const interceptorsConsumer = new interceptors_consumer_1.InterceptorsConsumer();
        const pipesContextCreator = new pipes_context_creator_1.PipesContextCreator(container, container.applicationConfig);
        const pipesConsumer = new pipes_consumer_1.PipesConsumer();
        const filtersContextCreator = new external_exception_filter_context_1.ExternalExceptionFilterContext(container, container.applicationConfig);
        const externalContextCreator = new ExternalContextCreator(guardsContextCreator, guardsConsumer, interceptorsContextCreator, interceptorsConsumer, container.getModules(), pipesContextCreator, pipesConsumer, filtersContextCreator);
        externalContextCreator.container = container;
        return externalContextCreator;
    }
    create(instance, callback, methodName, metadataKey, paramsFactory, contextId = constants_3.STATIC_CONTEXT, inquirerId, options = {
        interceptors: true,
        guards: true,
        filters: true,
    }, contextType = 'http') {
        const module = this.getContextModuleKey(instance.constructor);
        const { argsLength, paramtypes, getParamsMetadata } = this.getMetadata(instance, methodName, metadataKey, paramsFactory, contextType);
        const pipes = this.pipesContextCreator.create(instance, callback, module, contextId, inquirerId);
        const guards = this.guardsContextCreator.create(instance, callback, module, contextId, inquirerId);
        const exceptionFilter = this.filtersContextCreator.create(instance, callback, module, contextId, inquirerId);
        const interceptors = options.interceptors
            ? this.interceptorsContextCreator.create(instance, callback, module, contextId, inquirerId)
            : [];
        const paramsMetadata = getParamsMetadata(module, contextId, inquirerId);
        const paramsOptions = paramsMetadata
            ? this.contextUtils.mergeParamsMetatypes(paramsMetadata, paramtypes)
            : [];
        const fnCanActivate = options.guards
            ? this.createGuardsFn(guards, instance, callback, contextType)
            : null;
        const fnApplyPipes = this.createPipesFn(pipes, paramsOptions);
        const handler = (initialArgs, ...args) => async () => {
            if (fnApplyPipes) {
                await fnApplyPipes(initialArgs, ...args);
                return callback.apply(instance, initialArgs);
            }
            return callback.apply(instance, args);
        };
        const target = async (...args) => {
            const initialArgs = this.contextUtils.createNullArray(argsLength);
            fnCanActivate && (await fnCanActivate(args));
            const result = await this.interceptorsConsumer.intercept(interceptors, args, instance, callback, handler(initialArgs, ...args), contextType);
            return this.transformToResult(result);
        };
        return options.filters
            ? this.externalErrorProxy.createProxy(target, exceptionFilter, contextType)
            : target;
    }
    getMetadata(instance, methodName, metadataKey, paramsFactory, contextType) {
        const cacheMetadata = this.handlerMetadataStorage.get(instance, methodName);
        if (cacheMetadata) {
            return cacheMetadata;
        }
        const metadata = this.contextUtils.reflectCallbackMetadata(instance, methodName, metadataKey || '') || {};
        const keys = Object.keys(metadata);
        const argsLength = this.contextUtils.getArgumentsLength(keys, metadata);
        const paramtypes = this.contextUtils.reflectCallbackParamtypes(instance, methodName);
        const contextFactory = this.contextUtils.getContextFactory(contextType, instance, instance[methodName]);
        const getParamsMetadata = (moduleKey, contextId = constants_3.STATIC_CONTEXT, inquirerId) => paramsFactory
            ? this.exchangeKeysForValues(keys, metadata, moduleKey, paramsFactory, contextId, inquirerId, contextFactory)
            : null;
        const handlerMetadata = {
            argsLength,
            paramtypes,
            getParamsMetadata,
        };
        this.handlerMetadataStorage.set(instance, methodName, handlerMetadata);
        return handlerMetadata;
    }
    getContextModuleKey(moduleCtor) {
        const emptyModuleKey = '';
        if (!moduleCtor) {
            return emptyModuleKey;
        }
        const moduleContainerEntries = this.modulesContainer.entries();
        for (const [key, moduleRef] of moduleContainerEntries) {
            if (moduleRef.hasProvider(moduleCtor)) {
                return key;
            }
        }
        return emptyModuleKey;
    }
    exchangeKeysForValues(keys, metadata, moduleContext, paramsFactory, contextId = constants_3.STATIC_CONTEXT, inquirerId, contextFactory = this.contextUtils.getContextFactory('http')) {
        this.pipesContextCreator.setModuleContext(moduleContext);
        return keys.map(key => {
            const { index, data, pipes: pipesCollection } = metadata[key];
            const pipes = this.pipesContextCreator.createConcreteContext(pipesCollection, contextId, inquirerId);
            const type = this.contextUtils.mapParamType(key);
            if (key.includes(constants_1.CUSTOM_ROUTE_AGRS_METADATA)) {
                const { factory } = metadata[key];
                const customExtractValue = this.contextUtils.getCustomFactory(factory, data, contextFactory);
                return { index, extractValue: customExtractValue, type, data, pipes };
            }
            const numericType = Number(type);
            const extractValue = (...args) => paramsFactory.exchangeKeyForValue(numericType, data, args);
            return { index, extractValue, type: numericType, data, pipes };
        });
    }
    createPipesFn(pipes, paramsOptions) {
        const pipesFn = async (args, ...params) => {
            const resolveParamValue = async (param) => {
                const { index, extractValue, type, data, metatype, pipes: paramPipes, } = param;
                const value = extractValue(...params);
                args[index] = await this.getParamValue(value, { metatype, type, data }, pipes.concat(paramPipes));
            };
            await Promise.all(paramsOptions.map(resolveParamValue));
        };
        return paramsOptions.length ? pipesFn : null;
    }
    async getParamValue(value, { metatype, type, data }, pipes) {
        return (0, shared_utils_1.isEmpty)(pipes)
            ? value
            : this.pipesConsumer.apply(value, { metatype, type, data }, pipes);
    }
    async transformToResult(resultOrDeferred) {
        if ((0, rxjs_1.isObservable)(resultOrDeferred)) {
            return (0, rxjs_1.lastValueFrom)(resultOrDeferred);
        }
        return resultOrDeferred;
    }
    createGuardsFn(guards, instance, callback, contextType) {
        const canActivateFn = async (args) => {
            const canActivate = await this.guardsConsumer.tryActivate(guards, args, instance, callback, contextType);
            if (!canActivate) {
                throw new common_1.ForbiddenException(constants_2.FORBIDDEN_MESSAGE);
            }
        };
        return guards.length ? canActivateFn : null;
    }
    registerRequestProvider(request, contextId) {
        this.container.registerRequestProvider(request, contextId);
    }
}
exports.ExternalContextCreator = ExternalContextCreator;
