"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Optional = void 0;
const constants_1 = require("../../constants");
const shared_utils_1 = require("../../utils/shared.utils");
/**
 * Parameter decorator for an injected dependency marking the
 * dependency as optional.
 *
 * For example:
 * ```typescript
 * constructor(@Optional() @Inject('HTTP_OPTIONS')private readonly httpClient: T) {}
 * ```
 *
 * @see [Optional providers](https://docs.nestjs.com/providers#optional-providers)
 *
 * @publicApi
 */
function Optional() {
    return (target, key, index) => {
        if (!(0, shared_utils_1.isUndefined)(index)) {
            const args = Reflect.getMetadata(constants_1.OPTIONAL_DEPS_METADATA, target) || [];
            Reflect.defineMetadata(constants_1.OPTIONAL_DEPS_METADATA, [...args, index], target);
            return;
        }
        const properties = Reflect.getMetadata(constants_1.OPTIONAL_PROPERTY_DEPS_METADATA, target.constructor) || [];
        Reflect.defineMetadata(constants_1.OPTIONAL_PROPERTY_DEPS_METADATA, [...properties, key], target.constructor);
    };
}
exports.Optional = Optional;
