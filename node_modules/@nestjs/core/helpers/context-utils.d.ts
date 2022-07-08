import { ParamData } from '@nestjs/common';
import { ContextType, Controller, PipeTransform } from '@nestjs/common/interfaces';
import { ExecutionContextHost } from './execution-context-host';
export interface ParamProperties<T = any, IExtractor extends Function = any> {
    index: number;
    type: T | string;
    data: ParamData;
    pipes: PipeTransform[];
    extractValue: IExtractor;
}
export declare class ContextUtils {
    mapParamType(key: string): string;
    reflectCallbackParamtypes(instance: Controller, methodName: string): any[];
    reflectCallbackMetadata<T = any>(instance: Controller, methodName: string, metadataKey: string): T;
    reflectPassthrough(instance: Controller, methodName: string): boolean;
    getArgumentsLength<T>(keys: string[], metadata: T): number;
    createNullArray(length: number): any[];
    mergeParamsMetatypes(paramsProperties: ParamProperties[], paramtypes: any[]): (ParamProperties & {
        metatype?: any;
    })[];
    getCustomFactory(factory: (...args: unknown[]) => void, data: unknown, contextFactory: (args: unknown[]) => ExecutionContextHost): (...args: unknown[]) => unknown;
    getContextFactory<TContext extends string = ContextType>(contextType: TContext, instance?: object, callback?: Function): (args: unknown[]) => ExecutionContextHost;
}
