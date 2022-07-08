import { VersionValue } from '@nestjs/common/interfaces/version-options.interface';
export declare const MODULE_INIT_MESSAGE: (text: TemplateStringsArray, module: string) => string;
export declare const ROUTE_MAPPED_MESSAGE: (path: string, method: string | number) => string;
export declare const VERSIONED_ROUTE_MAPPED_MESSAGE: (path: string, method: string | number, version: VersionValue) => string;
export declare const CONTROLLER_MAPPING_MESSAGE: (name: string, path: string) => string;
export declare const VERSIONED_CONTROLLER_MAPPING_MESSAGE: (name: string, path: string, version: VersionValue) => string;
export declare const INVALID_EXECUTION_CONTEXT: (methodName: string, currentContext: string) => string;
