"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mixin = exports.Injectable = void 0;
const uuid_1 = require("uuid");
const constants_1 = require("../../constants");
/**
 * Decorator that marks a class as a [provider](https://docs.nestjs.com/providers).
 * Providers can be injected into other classes via constructor parameter injection
 * using Nest's built-in [Dependency Injection (DI)](https://docs.nestjs.com/providers#dependency-injection)
 * system.
 *
 * When injecting a provider, it must be visible within the module scope (loosely
 * speaking, the containing module) of the class it is being injected into. This
 * can be done by:
 *
 * - defining the provider in the same module scope
 * - exporting the provider from one module scope and importing that module into the
 *   module scope of the class being injected into
 * - exporting the provider from a module that is marked as global using the
 *   `@Global()` decorator
 *
 * Providers can also be defined in a more explicit and imperative form using
 * various [custom provider](https://docs.nestjs.com/fundamentals/custom-providers) techniques that expose
 * more capabilities of the DI system.
 *
 * @param options options specifying scope of injectable
 *
 * @see [Providers](https://docs.nestjs.com/providers)
 * @see [Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)
 * @see [Injection Scopes](https://docs.nestjs.com/fundamentals/injection-scopes)
 *
 * @publicApi
 */
function Injectable(options) {
    return (target) => {
        Reflect.defineMetadata(constants_1.INJECTABLE_WATERMARK, true, target);
        Reflect.defineMetadata(constants_1.SCOPE_OPTIONS_METADATA, options, target);
    };
}
exports.Injectable = Injectable;
function mixin(mixinClass) {
    Object.defineProperty(mixinClass, 'name', {
        value: (0, uuid_1.v4)(),
    });
    Injectable()(mixinClass);
    return mixinClass;
}
exports.mixin = mixin;
