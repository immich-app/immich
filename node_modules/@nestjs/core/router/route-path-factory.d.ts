import { RequestMethod, VersioningOptions } from '@nestjs/common';
import { ApplicationConfig } from '../application-config';
import { RoutePathMetadata } from './interfaces/route-path-metadata.interface';
export declare class RoutePathFactory {
    private readonly applicationConfig;
    constructor(applicationConfig: ApplicationConfig);
    create(metadata: RoutePathMetadata, requestMethod?: RequestMethod): string[];
    getVersion(metadata: RoutePathMetadata): import("@nestjs/common/interfaces").VersionValue;
    getVersionPrefix(versioningOptions: VersioningOptions): string;
    appendToAllIfDefined(paths: string[], fragmentToAppend: string | string[] | undefined): string[];
    isExcludedFromGlobalPrefix(path: string, requestMethod?: RequestMethod): boolean;
}
