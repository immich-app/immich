"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextUtils = void 0;
const constants_1 = require("@nestjs/common/constants");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const execution_context_host_1 = require("./execution-context-host");
class ContextUtils {
    mapParamType(key) {
        const keyPair = key.split(':');
        return keyPair[0];
    }
    reflectCallbackParamtypes(instance, methodName) {
        return Reflect.getMetadata(constants_1.PARAMTYPES_METADATA, instance, methodName);
    }
    reflectCallbackMetadata(instance, methodName, metadataKey) {
        return Reflect.getMetadata(metadataKey, instance.constructor, methodName);
    }
    reflectPassthrough(instance, methodName) {
        return Reflect.getMetadata(constants_1.RESPONSE_PASSTHROUGH_METADATA, instance.constructor, methodName);
    }
    getArgumentsLength(keys, metadata) {
        return keys.length
            ? Math.max(...keys.map(key => metadata[key].index)) + 1
            : 0;
    }
    createNullArray(length) {
        const a = new Array(length);
        for (let i = 0; i < length; ++i)
            a[i] = undefined;
        return a;
    }
    mergeParamsMetatypes(paramsProperties, paramtypes) {
        if (!paramtypes) {
            return paramsProperties;
        }
        return paramsProperties.map(param => (Object.assign(Object.assign({}, param), { metatype: paramtypes[param.index] })));
    }
    getCustomFactory(factory, data, contextFactory) {
        return (0, shared_utils_1.isFunction)(factory)
            ? (...args) => factory(data, contextFactory(args))
            : () => null;
    }
    getContextFactory(contextType, instance, callback) {
        const contextFactory = (args) => {
            const ctx = new execution_context_host_1.ExecutionContextHost(args, instance && instance.constructor, callback);
            ctx.setType(contextType);
            return ctx;
        };
        return contextFactory;
    }
}
exports.ContextUtils = ContextUtils;
