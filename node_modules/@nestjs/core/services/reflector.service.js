"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reflector = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
/**
 * Helper class providing Nest reflection capabilities.
 *
 * @see [Reflection](https://docs.nestjs.com/guards#putting-it-all-together)
 *
 * @publicApi
 */
class Reflector {
    /**
     * Retrieve metadata for a specified key for a specified target.
     *
     * @example
     * `const roles = this.reflector.get<string[]>('roles', context.getHandler());`
     *
     * @param metadataKey lookup key for metadata to retrieve
     * @param target context (decorated object) to retrieve metadata from
     *
     */
    get(metadataKey, target) {
        return Reflect.getMetadata(metadataKey, target);
    }
    /**
     * Retrieve metadata for a specified key for a specified set of targets.
     *
     * @param metadataKey lookup key for metadata to retrieve
     * @param targets context (decorated objects) to retrieve metadata from
     *
     */
    getAll(metadataKey, targets) {
        return (targets || []).map(target => Reflect.getMetadata(metadataKey, target));
    }
    /**
     * Retrieve metadata for a specified key for a specified set of targets and merge results.
     *
     * @param metadataKey lookup key for metadata to retrieve
     * @param targets context (decorated objects) to retrieve metadata from
     *
     */
    getAllAndMerge(metadataKey, targets) {
        const metadataCollection = this.getAll(metadataKey, targets).filter(item => item !== undefined);
        if ((0, shared_utils_1.isEmpty)(metadataCollection)) {
            return metadataCollection;
        }
        return metadataCollection.reduce((a, b) => {
            if (Array.isArray(a)) {
                return a.concat(b);
            }
            if ((0, shared_utils_1.isObject)(a) && (0, shared_utils_1.isObject)(b)) {
                return Object.assign(Object.assign({}, a), b);
            }
            return [a, b];
        });
    }
    /**
     * Retrieve metadata for a specified key for a specified set of targets and return a first not undefined value.
     *
     * @param metadataKey lookup key for metadata to retrieve
     * @param targets context (decorated objects) to retrieve metadata from
     *
     */
    getAllAndOverride(metadataKey, targets) {
        const metadataCollection = this.getAll(metadataKey, targets).filter(item => item !== undefined);
        return metadataCollection[0];
    }
}
exports.Reflector = Reflector;
