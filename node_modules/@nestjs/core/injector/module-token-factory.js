"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleTokenFactory = void 0;
const random_string_generator_util_1 = require("@nestjs/common/utils/random-string-generator.util");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const fast_safe_stringify_1 = require("fast-safe-stringify");
const hash = require("object-hash");
class ModuleTokenFactory {
    constructor() {
        this.moduleIdsCache = new WeakMap();
    }
    create(metatype, dynamicModuleMetadata) {
        const moduleId = this.getModuleId(metatype);
        const opaqueToken = {
            id: moduleId,
            module: this.getModuleName(metatype),
            dynamic: this.getDynamicMetadataToken(dynamicModuleMetadata),
        };
        return hash(opaqueToken, { ignoreUnknown: true });
    }
    getDynamicMetadataToken(dynamicModuleMetadata) {
        // Uses safeStringify instead of JSON.stringify to support circular dynamic modules
        // The replacer function is also required in order to obtain real class names
        // instead of the unified "Function" key
        return dynamicModuleMetadata
            ? (0, fast_safe_stringify_1.default)(dynamicModuleMetadata, this.replacer)
            : '';
    }
    getModuleId(metatype) {
        let moduleId = this.moduleIdsCache.get(metatype);
        if (moduleId) {
            return moduleId;
        }
        moduleId = (0, random_string_generator_util_1.randomStringGenerator)();
        this.moduleIdsCache.set(metatype, moduleId);
        return moduleId;
    }
    getModuleName(metatype) {
        return metatype.name;
    }
    replacer(key, value) {
        if ((0, shared_utils_1.isFunction)(value)) {
            const funcAsString = value.toString();
            const isClass = /^class\s/.test(funcAsString);
            if (isClass) {
                return value.name;
            }
            return hash(funcAsString, { ignoreUnknown: true });
        }
        if ((0, shared_utils_1.isSymbol)(value)) {
            return value.toString();
        }
        return value;
    }
}
exports.ModuleTokenFactory = ModuleTokenFactory;
