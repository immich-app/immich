import { RouteInfo } from './middleware';
/**
 * @publicApi
 */
export interface GlobalPrefixOptions<T = string | RouteInfo> {
    exclude?: T[];
}
