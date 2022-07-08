"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
const constants_1 = require("../../constants");
const shared_utils_1 = require("../../utils/shared.utils");
/**
 * Decorator that marks a class as a Nest controller that can receive inbound
 * requests and produce responses.
 *
 * An HTTP Controller responds to inbound HTTP Requests and produces HTTP Responses.
 * It defines a class that provides the context for one or more related route
 * handlers that correspond to HTTP request methods and associated routes
 * for example `GET /api/profile`, `POST /users/resume`
 *
 * A Microservice Controller responds to requests as well as events, running over
 * a variety of transports [(read more here)](https://docs.nestjs.com/microservices/basics).
 * It defines a class that provides a context for one or more message or event
 * handlers.
 *
 * @param prefixOrOptions a `route path prefix` or a `ControllerOptions` object.
 * A `route path prefix` is pre-pended to the path specified in any request decorator
 * in the class. `ControllerOptions` is an options configuration object specifying:
 * - `scope` - symbol that determines the lifetime of a Controller instance.
 * [See Scope](https://docs.nestjs.com/fundamentals/injection-scopes#usage) for
 * more details.
 * - `prefix` - string that defines a `route path prefix`.  The prefix
 * is pre-pended to the path specified in any request decorator in the class.
 * - `version` - string, array of strings, or Symbol that defines the version
 * of all routes in the class. [See Versioning](https://docs.nestjs.com/techniques/versioning)
 * for more details.
 *
 * @see [Routing](https://docs.nestjs.com/controllers#routing)
 * @see [Controllers](https://docs.nestjs.com/controllers)
 * @see [Microservices](https://docs.nestjs.com/microservices/basics#request-response)
 * @see [Scope](https://docs.nestjs.com/fundamentals/injection-scopes#usage)
 * @see [Versioning](https://docs.nestjs.com/techniques/versioning)
 *
 * @publicApi
 */
function Controller(prefixOrOptions) {
    const defaultPath = '/';
    const [path, host, scopeOptions, versionOptions] = (0, shared_utils_1.isUndefined)(prefixOrOptions)
        ? [defaultPath, undefined, undefined, undefined]
        : (0, shared_utils_1.isString)(prefixOrOptions) || Array.isArray(prefixOrOptions)
            ? [prefixOrOptions, undefined, undefined, undefined]
            : [
                prefixOrOptions.path || defaultPath,
                prefixOrOptions.host,
                { scope: prefixOrOptions.scope },
                Array.isArray(prefixOrOptions.version)
                    ? Array.from(new Set(prefixOrOptions.version))
                    : prefixOrOptions.version,
            ];
    return (target) => {
        Reflect.defineMetadata(constants_1.CONTROLLER_WATERMARK, true, target);
        Reflect.defineMetadata(constants_1.PATH_METADATA, path, target);
        Reflect.defineMetadata(constants_1.HOST_METADATA, host, target);
        Reflect.defineMetadata(constants_1.SCOPE_OPTIONS_METADATA, scopeOptions, target);
        Reflect.defineMetadata(constants_1.VERSION_METADATA, versionOptions, target);
    };
}
exports.Controller = Controller;
