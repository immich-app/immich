/**
 * Options to be passed during transformation.
 *
 * @see https://github.com/typestack/class-transformer
 *
 * @publicApi
 */
export interface ClassTransformOptions {
    /**
     * Exclusion strategy. By default exposeAll is used, which means that it will expose all properties that
     * are transformed by default.
     */
    strategy?: 'excludeAll' | 'exposeAll';
    /**
     * Only properties with given groups will be transformed.
     */
    groups?: string[];
    /**
     * Only properties with "since" > version < "until" will be transformed.
     */
    version?: number;
    /**
     * Excludes properties with the given prefixes. For example, if you mark your private properties with "_" and "__"
     * you can set this option's value to ["_", "__"] and all private properties will be skipped.
     * This works only for "exposeAll" strategy.
     */
    excludePrefixes?: string[];
    /**
     * If set to true then class transformer will ignore all @Expose and @Exclude decorators and what's inside them.
     * This option is useful if you want to "clone" your object but not apply decorators affects.
     */
    ignoreDecorators?: boolean;
    /**
     * Target maps allows to set a Types of the transforming object without using @Type decorator.
     * This is useful when you are transforming external classes, or if you already have type metadata for
     * objects and you don't want to set it up again.
     */
    targetMaps?: any[];
    /**
     * If set to true then class transformer will perform a circular check. (Circular check is turned off by default)
     * This option is useful when you know for sure that your types might have a circular dependency.
     */
    enableCircularCheck?: boolean;
    /**
     * If set to true class-transformer will attempt conversion based on TS reflected type
     */
    enableImplicitConversion?: boolean;
    /**
     * If set to true class-transformer will exclude properties which are not part of the original class
     * and exposing all class properties (with undefined, if nothing else is given)
     */
    excludeExtraneousValues?: boolean;
    /**
     * If set to true then class transformer will take default values for unprovided fields.
     * This is useful when you convert a plain object to a class and have an optional field with a default value.
     */
    exposeDefaultValues?: boolean;
    /**
     * When set to true, fields with `undefined` as value will be included in class to plain transformation. Otherwise
     * those fields will be omitted from the result.
     *
     * DEFAULT: `true`
     */
    exposeUnsetFields?: boolean;
}
