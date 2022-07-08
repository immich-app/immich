import { VersioningOptions } from '@nestjs/common';
import { VersionValue } from '@nestjs/common/interfaces';
export interface RoutePathMetadata {
    /**
     * Controller-level path (e.g., @Controller('resource') = "resource").
     */
    ctrlPath?: string;
    /**
     * Method-level path (e.g., @Get('resource') = "resource").
     */
    methodPath?: string;
    /**
     * Global route prefix specified with the "NestApplication#setGlobalPrefix" method.
     */
    globalPrefix?: string;
    /**
     * Module-level path registered through the "RouterModule".
     */
    modulePath?: string;
    /**
     * Controller-level version (e.g., @Controller({ version: '1.0' }) = "1.0").
     */
    controllerVersion?: VersionValue;
    /**
     * Method-level version (e.g., @Version('1.0') = "1.0").
     */
    methodVersion?: VersionValue;
    /**
     * API versioning options object.
     */
    versioningOptions?: VersioningOptions;
}
