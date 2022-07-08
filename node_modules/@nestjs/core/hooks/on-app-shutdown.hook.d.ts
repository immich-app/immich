import { Module } from '../injector/module';
/**
 * Calls the `onApplicationShutdown` function on the module and its children
 * (providers / controllers).
 *
 * @param module The module which will be initialized
 */
export declare function callAppShutdownHook(module: Module, signal?: string): Promise<any>;
