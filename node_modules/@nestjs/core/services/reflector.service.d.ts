import { Type } from '@nestjs/common';
/**
 * Helper class providing Nest reflection capabilities.
 *
 * @see [Reflection](https://docs.nestjs.com/guards#putting-it-all-together)
 *
 * @publicApi
 */
export declare class Reflector {
    /**
     * Retrieve metadata for a specified key for a specified target.
     *
     * @example
     * `const roles = this.reflector.get<string[]>('roles', context.getHandler());`
     *
     * @param metadataKey lookup key for metadata to retrieve
     * @param target context (decorated object) to retrieve metadata from
     *
     */
    get<TResult = any, TKey = any>(metadataKey: TKey, target: Type<any> | Function): TResult;
    /**
     * Retrieve metadata for a specified key for a specified set of targets.
     *
     * @param metadataKey lookup key for metadata to retrieve
     * @param targets context (decorated objects) to retrieve metadata from
     *
     */
    getAll<TResult extends any[] = any[], TKey = any>(metadataKey: TKey, targets: (Type<any> | Function)[]): TResult;
    /**
     * Retrieve metadata for a specified key for a specified set of targets and merge results.
     *
     * @param metadataKey lookup key for metadata to retrieve
     * @param targets context (decorated objects) to retrieve metadata from
     *
     */
    getAllAndMerge<TResult extends any[] = any[], TKey = any>(metadataKey: TKey, targets: (Type<any> | Function)[]): TResult;
    /**
     * Retrieve metadata for a specified key for a specified set of targets and return a first not undefined value.
     *
     * @param metadataKey lookup key for metadata to retrieve
     * @param targets context (decorated objects) to retrieve metadata from
     *
     */
    getAllAndOverride<TResult = any, TKey = any>(metadataKey: TKey, targets: (Type<any> | Function)[]): TResult;
}
