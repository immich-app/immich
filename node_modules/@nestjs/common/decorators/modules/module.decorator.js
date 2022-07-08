"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Module = void 0;
const validate_module_keys_util_1 = require("../../utils/validate-module-keys.util");
/**
 * Decorator that marks a class as a [module](https://docs.nestjs.com/modules).
 *
 * Modules are used by Nest to organize the application structure into scopes. Controllers
 * and Providers are scoped by the module they are declared in. Modules and their
 * classes (Controllers and Providers) form a graph that determines how Nest
 * performs [Dependency Injection (DI)](https://docs.nestjs.com/providers#dependency-injection).
 *
 * @param metadata module configuration metadata
 *
 * @see [Modules](https://docs.nestjs.com/modules)
 *
 * @publicApi
 */
function Module(metadata) {
    const propsKeys = Object.keys(metadata);
    (0, validate_module_keys_util_1.validateModuleKeys)(propsKeys);
    return (target) => {
        for (const property in metadata) {
            if (metadata.hasOwnProperty(property)) {
                Reflect.defineMetadata(property, metadata[property], target);
            }
        }
    };
}
exports.Module = Module;
