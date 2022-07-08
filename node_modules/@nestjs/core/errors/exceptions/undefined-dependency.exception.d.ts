import { InjectorDependencyContext } from '../../injector/injector';
import { RuntimeException } from './runtime.exception';
import { Module } from '../../injector/module';
export declare class UndefinedDependencyException extends RuntimeException {
    constructor(type: string, undefinedDependencyContext: InjectorDependencyContext, module?: Module);
}
