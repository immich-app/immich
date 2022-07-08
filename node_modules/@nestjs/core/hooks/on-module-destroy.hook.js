"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callModuleDestroyHook = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const transient_instances_1 = require("../injector/helpers/transient-instances");
/**
 * Returns true or false if the given instance has a `onModuleDestroy` function
 *
 * @param instance The instance which should be checked
 */
function hasOnModuleDestroyHook(instance) {
    return (0, shared_utils_1.isFunction)(instance.onModuleDestroy);
}
/**
 * Calls the given instances onModuleDestroy hook
 */
function callOperator(instances) {
    return (0, iterare_1.iterate)(instances)
        .filter(instance => !(0, shared_utils_1.isNil)(instance))
        .filter(hasOnModuleDestroyHook)
        .map(async (instance) => instance.onModuleDestroy())
        .toArray();
}
/**
 * Calls the `onModuleDestroy` function on the module and its children
 * (providers / controllers).
 *
 * @param module The module which will be initialized
 */
async function callModuleDestroyHook(module) {
    const providers = module.getNonAliasProviders();
    // Module (class) instance is the first element of the providers array
    // Lifecycle hook has to be called once all classes are properly destroyed
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
    // Call the module instance itself
    const moduleClassInstance = moduleClassHost.instance;
    if (moduleClassInstance &&
        hasOnModuleDestroyHook(moduleClassInstance) &&
        moduleClassHost.isDependencyTreeStatic()) {
        await moduleClassInstance.onModuleDestroy();
    }
}
exports.callModuleDestroyHook = callModuleDestroyHook;
