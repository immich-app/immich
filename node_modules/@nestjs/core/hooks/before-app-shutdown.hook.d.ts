import { Module } from '../injector/module';
/**
 * Calls the `beforeApplicationShutdown` function on the module and its children
 * (providers / controllers).
 *
 * @param module The module which will be initialized
 * @param signal The signal which caused the shutdown
 */
export declare function callBeforeAppShutdownHook(module: Module, signal?: string): Promise<void>;
