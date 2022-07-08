import { RouteInfo, Type } from '@nestjs/common/interfaces';
import { NestContainer } from '../injector/container';
export declare class RoutesMapper {
    private readonly container;
    private readonly routerExplorer;
    constructor(container: NestContainer);
    mapRouteToRouteInfo(route: Type<any> | RouteInfo | string): RouteInfo[];
    private isRouteInfo;
    private normalizeGlobalPath;
    private getRoutePath;
    private getHostModuleOfController;
    private getModulePath;
}
