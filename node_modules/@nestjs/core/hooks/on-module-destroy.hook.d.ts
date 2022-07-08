import { Module } from '../injector/module';
/**
 * Calls the `onModuleDestroy` function on the module and its children
 * (providers / controllers).
 *
 * @param module The module which will be initialized
 */
export declare function callModuleDestroyHook(module: Module): Promise<any>;
