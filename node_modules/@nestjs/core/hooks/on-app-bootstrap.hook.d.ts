import { Module } from '../injector/module';
/**
 * Calls the `onApplicationBootstrap` function on the module and its children
 * (providers / controllers).
 *
 * @param module The module which will be initialized
 */
export declare function callModuleBootstrapHook(module: Module): Promise<any>;
