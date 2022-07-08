"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callModuleBootstrapHook = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const transient_instances_1 = require("../injector/helpers/transient-instances");
/**
 * Checks if the given instance has the `onApplicationBootstrap` function
 *
 * @param instance The instance which should be checked
 */
function hasOnAppBootstrapHook(instance) {
    return (0, shared_utils_1.isFunction)(instance.onApplicationBootstrap);
}
/**
 * Calls the given instances
 */
function callOperator(instances) {
    return (0, iterare_1.iterate)(instances)
        .filter(instance => !(0, shared_utils_1.isNil)(instance))
        .filter(hasOnAppBootstrapHook)
        .map(async (instance) => instance.onApplicationBootstrap())
        .toArray();
}
/**
 * Calls the `onApplicationBootstrap` function on the module and its children
 * (providers / controllers).
 *
 * @param module The module which will be initialized
 */
async function callModuleBootstrapHook(module) {
    const providers = module.getNonAliasProviders();
    // Module (class) instance is the first element of the providers array
    // Lifecycle hook has to be called once all classes are properly initialized
    const [_, moduleClassHost] = providers.shift();
    const instances = [
        ...module.controllers,
        ...providers,
        ...module.injectables,
        ...module.middlewares,
    ];
    const nonTransientInstances = (0, transient_instances_1.getNonTransientInstances)(instances);
    await Promise.all(callOperator(nonTransientInstances));
    const transientInstances = (0, transient_instances_1.getTransientInstances)(instances);
    await Promise.all(callOperator(transientInstances));
    // Call the instance itself
    const moduleClassInstance = moduleClassHost.instance;
    if (moduleClassInstance &&
        hasOnAppBootstrapHook(moduleClassInstance) &&
        moduleClassHost.isDependencyTreeStatic()) {
        await moduleClassInstance.onApplicationBootstrap();
    }
}
exports.callModuleBootstrapHook = callModuleBootstrapHook;
