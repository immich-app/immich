import { DynamicModule } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces/type.interface';
export declare class ModuleTokenFactory {
    private readonly moduleIdsCache;
    create(metatype: Type<unknown>, dynamicModuleMetadata?: Partial<DynamicModule> | undefined): string;
    getDynamicMetadataToken(dynamicModuleMetadata: Partial<DynamicModule> | undefined): string;
    getModuleId(metatype: Type<unknown>): string;
    getModuleName(metatype: Type<any>): string;
    private replacer;
}
