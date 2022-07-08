import { HttpServer, RouteInfo, Type } from '@nestjs/common/interfaces';
import { ExcludeRouteMetadata } from '../router/interfaces/exclude-route-metadata.interface';
export declare const mapToExcludeRoute: (routes: RouteInfo[]) => ExcludeRouteMetadata[];
export declare const filterMiddleware: <T extends Function | Type<any> = any>(middleware: T[], routes: RouteInfo[], httpAdapter: HttpServer) => Type<any>[];
export declare const mapToClass: <T extends Function | Type<any>>(middleware: T, excludedRoutes: ExcludeRouteMetadata[], httpAdapter: HttpServer) => Type<any>;
export declare function isMiddlewareClass(middleware: any): middleware is Type<any>;
export declare function assignToken(metatype: Type<any>, token?: any): Type<any>;
export declare function isMiddlewareRouteExcluded(req: Record<string, any>, excludedRoutes: ExcludeRouteMetadata[], httpAdapter: HttpServer): boolean;
