import { Module } from '../injector/module';
/**
 * Calls the `onModuleInit` function on the module and its children
 * (providers / controllers).
 *
 * @param module The module which will be initialized
 */
export declare function callModuleInitHook(module: Module): Promise<void>;
