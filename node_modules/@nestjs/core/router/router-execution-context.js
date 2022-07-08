"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterExecutionContext = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const route_paramtypes_enum_1 = require("@nestjs/common/enums/route-paramtypes.enum");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const constants_2 = require("../guards/constants");
const context_utils_1 = require("../helpers/context-utils");
const handler_metadata_storage_1 = require("../helpers/handler-metadata-storage");
const constants_3 = require("../injector/constants");
const router_response_controller_1 = require("./router-response-controller");
class RouterExecutionContext {
    constructor(paramsFactory, pipesContextCreator, pipesConsumer, guardsContextCreator, guardsConsumer, interceptorsContextCreator, interceptorsConsumer, applicationRef) {
        this.paramsFactory = paramsFactory;
        this.pipesContextCreator = pipesContextCreator;
        this.pipesConsumer = pipesConsumer;
        this.guardsContextCreator = guardsContextCreator;
        this.guardsConsumer = guardsConsumer;
        this.interceptorsContextCreator = interceptorsContextCreator;
        this.interceptorsConsumer = interceptorsConsumer;
        this.applicationRef = applicationRef;
        this.handlerMetadataStorage = new handler_metadata_storage_1.HandlerMetadataStorage();
        this.contextUtils = new context_utils_1.ContextUtils();
        this.responseController = new router_response_controller_1.RouterResponseController(applicationRef);
    }
    create(instance, callback, methodName, moduleKey, requestMethod, contextId = constants_3.STATIC_CONTEXT, inquirerId) {
        const contextType = 'http';
        const { argsLength, fnHandleResponse, paramtypes, getParamsMetadata, httpStatusCode, responseHeaders, hasCustomHeaders, } = this.getMetadata(instance, callback, methodName, moduleKey, requestMethod, contextType);
        const paramsOptions = this.contextUtils.mergeParamsMetatypes(getParamsMetadata(moduleKey, contextId, inquirerId), paramtypes);
        const pipes = this.pipesContextCreator.create(instance, callback, moduleKey, contextId, inquirerId);
        const guards = this.guardsContextCreator.create(instance, callback, moduleKey, contextId, inquirerId);
        const interceptors = this.interceptorsContextCreator.create(instance, callback, moduleKey, contextId, inquirerId);
        const fnCanActivate = this.createGuardsFn(guards, instance, callback, contextType);
        const fnApplyPipes = this.createPipesFn(pipes, paramsOptions);
        const handler = (args, req, res, next) => async () => {
            fnApplyPipes && (await fnApplyPipes(args, req, res, next));
            return callback.apply(instance, args);
        };
        return async (req, res, next) => {
            const args = this.contextUtils.createNullArray(argsLength);
            fnCanActivate && (await fnCanActivate([req, res, next]));
            this.responseController.setStatus(res, httpStatusCode);
            hasCustomHeaders &&
                this.responseController.setHeaders(res, responseHeaders);
            const result = await this.interceptorsConsumer.intercept(interceptors, [req, res, next], instance, callback, handler(args, req, res, next), contextType);
            await fnHandleResponse(result, res, req);
        };
    }
    getMetadata(instance, callback, methodName, moduleKey, requestMethod, contextType) {
        const cacheMetadata = this.handlerMetadataStorage.get(instance, methodName);
        if (cacheMetadata) {
            return cacheMetadata;
        }
        const metadata = this.contextUtils.reflectCallbackMetadata(instance, methodName, constants_1.ROUTE_ARGS_METADATA) || {};
        const keys = Object.keys(metadata);
        const argsLength = this.contextUtils.getArgumentsLength(keys, metadata);
        const paramtypes = this.contextUtils.reflectCallbackParamtypes(instance, methodName);
        const contextFactory = this.contextUtils.getContextFactory(contextType, instance, callback);
        const getParamsMetadata = (moduleKey, contextId = constants_3.STATIC_CONTEXT, inquirerId) => this.exchangeKeysForValues(keys, metadata, moduleKey, contextId, inquirerId, contextFactory);
        const paramsMetadata = getParamsMetadata(moduleKey);
        const isResponseHandled = this.isResponseHandled(instance, methodName, paramsMetadata);
        const httpRedirectResponse = this.reflectRedirect(callback);
        const fnHandleResponse = this.createHandleResponseFn(callback, isResponseHandled, httpRedirectResponse);
        const httpCode = this.reflectHttpStatusCode(callback);
        const httpStatusCode = httpCode
            ? httpCode
            : this.responseController.getStatusByMethod(requestMethod);
        const responseHeaders = this.reflectResponseHeaders(callback);
        const hasCustomHeaders = !(0, shared_utils_1.isEmpty)(responseHeaders);
        const handlerMetadata = {
            argsLength,
            fnHandleResponse,
            paramtypes,
            getParamsMetadata,
            httpStatusCode,
            hasCustomHeaders,
            responseHeaders,
        };
        this.handlerMetadataStorage.set(instance, methodName, handlerMetadata);
        return handlerMetadata;
    }
    reflectRedirect(callback) {
        return Reflect.getMetadata(constants_1.REDIRECT_METADATA, callback);
    }
    reflectHttpStatusCode(callback) {
        return Reflect.getMetadata(constants_1.HTTP_CODE_METADATA, callback);
    }
    reflectRenderTemplate(callback) {
        return Reflect.getMetadata(constants_1.RENDER_METADATA, callback);
    }
    reflectResponseHeaders(callback) {
        return Reflect.getMetadata(constants_1.HEADERS_METADATA, callback) || [];
    }
    reflectSse(callback) {
        return Reflect.getMetadata(constants_1.SSE_METADATA, callback);
    }
    exchangeKeysForValues(keys, metadata, moduleContext, contextId = constants_3.STATIC_CONTEXT, inquirerId, contextFactory) {
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
            const extractValue = (req, res, next) => this.paramsFactory.exchangeKeyForValue(numericType, data, {
                req,
                res,
                next,
            });
            return { index, extractValue, type: numericType, data, pipes };
        });
    }
    async getParamValue(value, { metatype, type, data, }, pipes) {
        if (!(0, shared_utils_1.isEmpty)(pipes)) {
            return this.pipesConsumer.apply(value, { metatype, type, data }, pipes);
        }
        return value;
    }
    isPipeable(type) {
        return (type === route_paramtypes_enum_1.RouteParamtypes.BODY ||
            type === route_paramtypes_enum_1.RouteParamtypes.QUERY ||
            type === route_paramtypes_enum_1.RouteParamtypes.PARAM ||
            type === route_paramtypes_enum_1.RouteParamtypes.FILE ||
            type === route_paramtypes_enum_1.RouteParamtypes.FILES ||
            (0, shared_utils_1.isString)(type));
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
    createPipesFn(pipes, paramsOptions) {
        const pipesFn = async (args, req, res, next) => {
            const resolveParamValue = async (param) => {
                const { index, extractValue, type, data, metatype, pipes: paramPipes, } = param;
                const value = extractValue(req, res, next);
                args[index] = this.isPipeable(type)
                    ? await this.getParamValue(value, { metatype, type, data }, pipes.concat(paramPipes))
                    : value;
            };
            await Promise.all(paramsOptions.map(resolveParamValue));
        };
        return paramsOptions.length ? pipesFn : null;
    }
    createHandleResponseFn(callback, isResponseHandled, redirectResponse, httpStatusCode) {
        const renderTemplate = this.reflectRenderTemplate(callback);
        if (renderTemplate) {
            return async (result, res) => {
                return await this.responseController.render(result, res, renderTemplate);
            };
        }
        if (redirectResponse && (0, shared_utils_1.isString)(redirectResponse.url)) {
            return async (result, res) => {
                await this.responseController.redirect(result, res, redirectResponse);
            };
        }
        const isSseHandler = !!this.reflectSse(callback);
        if (isSseHandler) {
            return (result, res, req) => {
                var _a;
                this.responseController.sse(result, res.raw || res, req.raw || req, { additionalHeaders: (_a = res.getHeaders) === null || _a === void 0 ? void 0 : _a.call(res) });
            };
        }
        return async (result, res) => {
            result = await this.responseController.transformToResult(result);
            !isResponseHandled &&
                (await this.responseController.apply(result, res, httpStatusCode));
        };
    }
    isResponseHandled(instance, methodName, paramsMetadata) {
        const hasResponseOrNextDecorator = paramsMetadata.some(({ type }) => type === route_paramtypes_enum_1.RouteParamtypes.RESPONSE || type === route_paramtypes_enum_1.RouteParamtypes.NEXT);
        const isPassthroughEnabled = this.contextUtils.reflectPassthrough(instance, methodName);
        return hasResponseOrNextDecorator && !isPassthroughEnabled;
    }
}
exports.RouterExecutionContext = RouterExecutionContext;
