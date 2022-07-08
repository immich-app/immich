import { AxiosRequestConfig } from 'axios';
import { ModuleMetadata, Provider, Type } from '../../interfaces';
export declare type HttpModuleOptions = AxiosRequestConfig;
export interface HttpModuleOptionsFactory {
    createHttpOptions(): Promise<HttpModuleOptions> | HttpModuleOptions;
}
export interface HttpModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<HttpModuleOptionsFactory>;
    useClass?: Type<HttpModuleOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<HttpModuleOptions> | HttpModuleOptions;
    inject?: any[];
    extraProviders?: Provider[];
}
