export declare const isUndefined: (obj: any) => obj is undefined;
export declare const isObject: (fn: any) => fn is object;
export declare const isPlainObject: (fn: any) => fn is object;
export declare const addLeadingSlash: (path?: string) => string;
/**
 * Deprecated. Use the "addLeadingSlash" function instead.
 * @deprecated
 */
export declare const validatePath: (path?: string) => string;
export declare const normalizePath: (path?: string) => string;
export declare const stripEndSlash: (path: string) => string;
export declare const isFunction: (val: any) => boolean;
export declare const isString: (val: any) => val is string;
export declare const isNumber: (val: any) => val is number;
export declare const isConstructor: (val: any) => boolean;
export declare const isNil: (val: any) => val is null;
export declare const isEmpty: (array: any) => boolean;
export declare const isSymbol: (val: any) => val is symbol;
