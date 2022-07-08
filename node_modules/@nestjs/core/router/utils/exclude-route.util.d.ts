import { RequestMethod } from '@nestjs/common';
import { ExcludeRouteMetadata } from '../interfaces/exclude-route-metadata.interface';
export declare const isRequestMethodAll: (method: RequestMethod) => boolean;
export declare function isRouteExcluded(excludedRoutes: ExcludeRouteMetadata[], path: string, requestMethod?: RequestMethod): boolean;
