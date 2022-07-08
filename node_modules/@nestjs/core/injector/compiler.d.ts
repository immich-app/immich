import { DynamicModule, Type } from '@nestjs/common/interfaces';
import { ModuleTokenFactory } from './module-token-factory';
export interface ModuleFactory {
    type: Type<any>;
    token: string;
    dynamicMetadata?: Partial<DynamicModule>;
}
export declare class ModuleCompiler {
    private readonly moduleTokenFactory;
    constructor(moduleTokenFactory?: ModuleTokenFactory);
    compile(metatype: Type<any> | DynamicModule | Promise<DynamicModule>): Promise<ModuleFactory>;
    extractMetadata(metatype: Type<any> | DynamicModule): {
        type: Type<any>;
        dynamicMetadata?: Partial<DynamicModule> | undefined;
    };
    isDynamicModule(module: Type<any> | DynamicModule): module is DynamicModule;
}
