import { DynamicModule } from '../interfaces';
import { HttpModuleAsyncOptions, HttpModuleOptions } from './interfaces';
/**
 * @deprecated "HttpModule" (from the "@nestjs/common" package) is deprecated and will be removed in the next major release. Please, use the "@nestjs/axios" package instead.
 */
export declare class HttpModule {
    static register(config: HttpModuleOptions): DynamicModule;
    static registerAsync(options: HttpModuleAsyncOptions): DynamicModule;
    private static createAsyncProviders;
    private static createAsyncOptionsProvider;
}
