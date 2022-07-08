import { InjectorDependencyContext } from '../../injector/injector';
import { RuntimeException } from './runtime.exception';
import { Module } from '../../injector/module';
export declare class UnknownDependenciesException extends RuntimeException {
    constructor(type: string | symbol, unknownDependencyContext: InjectorDependencyContext, module?: Module);
}
