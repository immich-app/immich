"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Res = exports.Req = exports.HostParam = exports.Param = exports.Body = exports.Query = exports.Headers = exports.UploadedFiles = exports.UploadedFile = exports.Session = exports.Ip = exports.Next = exports.Response = exports.Request = exports.assignMetadata = void 0;
const constants_1 = require("../../constants");
const route_paramtypes_enum_1 = require("../../enums/route-paramtypes.enum");
const shared_utils_1 = require("../../utils/shared.utils");
function assignMetadata(args, paramtype, index, data, ...pipes) {
    return Object.assign(Object.assign({}, args), { [`${paramtype}:${index}`]: {
            index,
            data,
            pipes,
        } });
}
exports.assignMetadata = assignMetadata;
function createRouteParamDecorator(paramtype) {
    return (data) => (target, key, index) => {
        const args = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, target.constructor, key) || {};
        Reflect.defineMetadata(constants_1.ROUTE_ARGS_METADATA, assignMetadata(args, paramtype, index, data), target.constructor, key);
    };
}
const createPipesRouteParamDecorator = (paramtype) => (data, ...pipes) => (target, key, index) => {
    const args = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, target.constructor, key) || {};
    const hasParamData = (0, shared_utils_1.isNil)(data) || (0, shared_utils_1.isString)(data);
    const paramData = hasParamData ? data : undefined;
    const paramPipes = hasParamData ? pipes : [data, ...pipes];
    Reflect.defineMetadata(constants_1.ROUTE_ARGS_METADATA, assignMetadata(args, paramtype, index, paramData, ...paramPipes), target.constructor, key);
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
exports.Request = createRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.REQUEST);
/**
 * Route handler parameter decorator. Extracts the `Response`
 * object from the underlying platform and populates the decorated
 * parameter with the value of `Response`.
 *
 * Example: `logout(@Response() res)`
 *
 * @publicApi
 */
const Response = (options) => (target, key, index) => {
    if (options === null || options === void 0 ? void 0 : options.passthrough) {
        Reflect.defineMetadata(constants_1.RESPONSE_PASSTHROUGH_METADATA, options === null || options === void 0 ? void 0 : options.passthrough, target.constructor, key);
    }
    return createRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.RESPONSE)()(target, key, index);
};
exports.Response = Response;
/**
 * Route handler parameter decorator. Extracts reference to the `Next` function
 * from the underlying platform and populates the decorated
 * parameter with the value of `Next`.
 *
 * @publicApi
 */
exports.Next = createRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.NEXT);
/**
 * Route handler parameter decorator. Extracts the `Ip` property
 * from the `req` object and populates the decorated
 * parameter with the value of `ip`.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
exports.Ip = createRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.IP);
/**
 * Route handler parameter decorator. Extracts the `Session` object
 * from the underlying platform and populates the decorated
 * parameter with the value of `Session`.
 *
 * @see [Request object](https://docs.nestjs.com/controllers#request-object)
 *
 * @publicApi
 */
exports.Session = createRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.SESSION);
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
function UploadedFile(fileKey, ...pipes) {
    return createPipesRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.FILE)(fileKey, ...pipes);
}
exports.UploadedFile = UploadedFile;
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
function UploadedFiles(...pipes) {
    return createPipesRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.FILES)(undefined, ...pipes);
}
exports.UploadedFiles = UploadedFiles;
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
exports.Headers = createRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.HEADERS);
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
function Query(property, ...pipes) {
    return createPipesRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.QUERY)(property, ...pipes);
}
exports.Query = Query;
/**
 * Route handler parameter decorator. Extracts the entire `body` object
 * property, or optionally a named property of the `body` object, from
 * the `req` object and populates the decorated parameter with that value.
 * Also applies pipes to the bound body parameter.
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
function Body(property, ...pipes) {
    return createPipesRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.BODY)(property, ...pipes);
}
exports.Body = Body;
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
function Param(property, ...pipes) {
    return createPipesRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.PARAM)(property, ...pipes);
}
exports.Param = Param;
/**
 * Route handler parameter decorator. Extracts the `hosts`
 * property from the `req` object and populates the decorated
 * parameter with the value of `params`. May also apply pipes to the bound
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
function HostParam(property) {
    return createRouteParamDecorator(route_paramtypes_enum_1.RouteParamtypes.HOST)(property);
}
exports.HostParam = HostParam;
exports.Req = exports.Request;
exports.Res = exports.Response;
