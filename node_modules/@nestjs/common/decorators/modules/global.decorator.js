"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Global = void 0;
const constants_1 = require("../../constants");
/**
 * Decorator that makes a module global-scoped.
 *
 * Once imported into any module, a global-scoped module will be visible
 * in all modules. Thereafter, modules that wish to inject a service exported
 * from a global module do not need to import the provider module.
 *
 * @see [Global modules](https://docs.nestjs.com/modules#global-modules)
 *
 * @publicApi
 */
function Global() {
    return (target) => {
        Reflect.defineMetadata(constants_1.GLOBAL_MODULE_METADATA, true, target);
    };
}
exports.Global = Global;
