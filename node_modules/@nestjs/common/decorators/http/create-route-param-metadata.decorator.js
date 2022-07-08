"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParamDecorator = void 0;
const uuid_1 = require("uuid");
const constants_1 = require("../../constants");
const assign_custom_metadata_util_1 = require("../../utils/assign-custom-metadata.util");
const shared_utils_1 = require("../../utils/shared.utils");
/**
 * Defines HTTP route param decorator
 *
 * @param factory
 */
function createParamDecorator(factory, enhancers = []) {
    const paramtype = (0, uuid_1.v4)();
    return (data, ...pipes) => (target, key, index) => {
        const args = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, target.constructor, key) || {};
        const isPipe = (pipe) => pipe &&
            (((0, shared_utils_1.isFunction)(pipe) &&
                pipe.prototype &&
                (0, shared_utils_1.isFunction)(pipe.prototype.transform)) ||
                (0, shared_utils_1.isFunction)(pipe.transform));
        const hasParamData = (0, shared_utils_1.isNil)(data) || !isPipe(data);
        const paramData = hasParamData ? data : undefined;
        const paramPipes = hasParamData ? pipes : [data, ...pipes];
        Reflect.defineMetadata(constants_1.ROUTE_ARGS_METADATA, (0, assign_custom_metadata_util_1.assignCustomParameterMetadata)(args, paramtype, index, factory, paramData, ...paramPipes), target.constructor, key);
        enhancers.forEach(fn => fn(target, key, index));
    };
}
exports.createParamDecorator = createParamDecorator;
