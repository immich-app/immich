import { PipeTransform } from '../../index';
import { Type } from '../../interfaces';
/**
 * The `@Response()`/`@Res` parameter decorator options.
 */
export interface ResponseDecoratorOptions {
    /**
     * Determines whether the response will be sent manually within the route handler,
     * with the use of native response handling methods exposed by the platform-specific response object,
     * or if it should passthrough Nest response processing pipeline.
     *
     * @default false
     */
    passthrough: boolean;
}
export declare type ParamData = object | string | number;
export interface RouteParamMetadata {
    index: number;
    data?: ParamData;
}
export declare function assignMetadata<TParamtype = any, TArgs = any>(args: TArgs, paramtype: TParamtype, index: number, data?: ParamData, ...pipes: (Type<PipeTransform> | PipeTransform)[]): TArgs & {
    [x: string]: {
        index: number;
        data: ParamData;
        pipes: (PipeTransform<any, any> | Type<PipeTransform<any, any>>)[];
    };
};
/**
 * Route handler parameter decorator. Extracts the `Request`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Request`.
 *
 * Example: `logout(@Request() req)`
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare const Request: () => ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `Response`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Response`.
 *
 * Example: `logout(@Response() res)`
 *
 * @publicApi
 */
export declare const Response: (options?: ResponseDecoratorOptions) => ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts reference to the `Next` function
 * from the underlying platform and populates the decorated
 * parameter with the value of `Next`.
 *
 * @publicApi
 */
export declare const Next: () => ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `Ip` property
 * from the `req` object and populates the decorated
 * parameter with the value of `ip`.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare const Ip: () => ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `Session` object
 * from the underlying platform and populates the decorated
 * parameter with the value of `Session`.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare const Session: () => ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `file` object
 * and populates the decorated parameter with the value of `file`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFile() file) {
 *   console.log(file);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export declare function UploadedFile(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `file` object
 * and populates the decorated parameter with the value of `file`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFile() file) {
 *   console.log(file);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export declare function UploadedFile(...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `file` object
 * and populates the decorated parameter with the value of `file`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFile() file) {
 *   console.log(file);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export declare function UploadedFile(fileKey?: string, ...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `files` object
 * and populates the decorated parameter with the value of `files`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFiles() files) {
 *   console.log(files);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export declare function UploadedFiles(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `files` object
 * and populates the decorated parameter with the value of `files`.
 * Used in conjunction with
 * [multer middleware](https://github.com/expressjs/multer) for Express-based applications.
 *
 * For example:
 * ```typescript
 * uploadFile(@UploadedFiles() files) {
 *   console.log(files);
 * }
 * ```
 * @see [Request object](https://docs.nestjs.com/techniques/file-upload)
 *
 * @publicApi
 */
export declare function UploadedFiles(...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `headers`
 * property from the `req` object and populates the decorated
 * parameter with the value of `headers`.
 *
 * For example: `async update(@Headers('Cache-Control') cacheControl: string)`
 *
 * @param property name of single header property to extract.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare const Headers: (property?: string) => ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `query`
 * property from the `req` object and populates the decorated
 * parameter with the value of `query`. May also apply pipes to the bound
 * query parameter.
 *
 * For example:
 * ```typescript
 * async find(@Query('user') user: string)
 * ```
 *
 * @param property name of single property to extract from the `query` object
 * @param pipes one or more pipes to apply to the bound query parameter
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare function Query(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `query`
 * property from the `req` object and populates the decorated
 * parameter with the value of `query`. May also apply pipes to the bound
 * query parameter.
 *
 * For example:
 * ```typescript
 * async find(@Query('user') user: string)
 * ```
 *
 * @param property name of single property to extract from the `query` object
 * @param pipes one or more pipes to apply to the bound query parameter
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare function Query(...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `query`
 * property from the `req` object and populates the decorated
 * parameter with the value of `query`. May also apply pipes to the bound
 * query parameter.
 *
 * For example:
 * ```typescript
 * async find(@Query('user') user: string)
 * ```
 *
 * @param property name of single property to extract from the `query` object
 * @param pipes one or more pipes to apply to the bound query parameter
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare function Query(property: string, ...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the entire `body`
 * object from the `req` object and populates the decorated
 * parameter with the value of `body`.
 *
 * For example:
 * ```typescript
 * async create(@Body() createDto: CreateCatDto)
 * ```
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare function Body(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the entire `body`
 * object from the `req` object and populates the decorated
 * parameter with the value of `body`. Also applies the specified
 * pipes to that parameter.
 *
 * For example:
 * ```typescript
 * async create(@Body(new ValidationPipe()) createDto: CreateCatDto)
 * ```
 *
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound body parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export declare function Body(...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts a single property from
 * the `body` object property of the `req` object and populates the decorated
 * parameter with the value of that property. Also applies pipes to the bound
 * body parameter.
 *
 * For example:
 * ```typescript
 * async create(@Body('role', new ValidationPipe()) role: string)
 * ```
 *
 * @param property name of single property to extract from the `body` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound body parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export declare function Body(property: string, ...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `params`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@Param() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@Param('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export declare function Param(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `params`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@Param() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@Param('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export declare function Param(...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `params`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@Param() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@Param('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 * @param pipes one or more pipes - either instances or classes - to apply to
 * the bound parameter.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 * @see [Working with pipes](https://docs.nestjs.com/custom-decorators#working-with-pipes)
 *
 * @publicApi
 */
export declare function Param(property: string, ...pipes: (Type<PipeTransform> | PipeTransform)[]): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `hosts`
 * property from the `req` object and populates the decorated
 * parameter with the value of `hosts`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@HostParam() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@HostParam('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare function HostParam(): ParameterDecorator;
/**
 * Route handler parameter decorator. Extracts the `hosts`
 * property from the `req` object and populates the decorated
 * parameter with the value of `hosts`. May also apply pipes to the bound
 * parameter.
 *
 * For example, extracting all params:
 * ```typescript
 * findOne(@HostParam() params: string[])
 * ```
 *
 * For example, extracting a single param:
 * ```typescript
 * findOne(@HostParam('id') id: string)
 * ```
 * @param property name of single property to extract from the `req` object
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
export declare function HostParam(property: string): ParameterDecorator;
export declare const Req: () => ParameterDecorator;
export declare const Res: (options?: ResponseDecoratorOptions) => ParameterDecorator;
