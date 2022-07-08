"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inject = void 0;
const constants_1 = require("../../constants");
const shared_utils_1 = require("../../utils/shared.utils");
/**
 * Decorator that marks a constructor parameter as a target for
 * [Dependency Injection (DI)](https://docs.nestjs.com/providers#dependency-injection).
 *
 * Any injected provider must be visible within the module scope (loosely
 * speaking, the containing module) of the class it is being injected into. This
 * can be done by:
 *
 * - defining the provider in the same module scope
 * - exporting the provider from one module scope and importing that module into the
 *   module scope of the class being injected into
 * - exporting the provider from a module that is marked as global using the
 *   `@Global()` decorator
 *
 * #### Injection tokens
 * Can be *types* (class names), *strings* or *symbols*. This depends on how the
 * provider with which it is associated was defined. Providers defined with the
 * `@Injectable()` decorator use the class name. Custom Providers may use strings
 * or symbols as the injection token.
 *
 * @param token lookup key for the provider to be injected (assigned to the constructor
 * parameter).
 *
 * @see [Providers](https://docs.nestjs.com/providers)
 * @see [Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)
 * @see [Injection Scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 *
 * @publicApi
 */
function Inject(token) {
    return (target, key, index) => {
        const type = token || Reflect.getMetadata('design:type', target, key);
        if (!(0, shared_utils_1.isUndefined)(index)) {
            let dependencies = Reflect.getMetadata(constants_1.SELF_DECLARED_DEPS_METADATA, target) || [];
            dependencies = [...dependencies, { index, param: type }];
            Reflect.defineMetadata(constants_1.SELF_DECLARED_DEPS_METADATA, dependencies, target);
            return;
        }
        let properties = Reflect.getMetadata(constants_1.PROPERTY_DEPS_METADATA, target.constructor) || [];
        properties = [...properties, { key, type }];
        Reflect.defineMetadata(constants_1.PROPERTY_DEPS_METADATA, properties, target.constructor);
    };
}
exports.Inject = Inject;
