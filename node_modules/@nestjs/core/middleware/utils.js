"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMiddlewareRouteExcluded = exports.assignToken = exports.isMiddlewareClass = exports.mapToClass = exports.filterMiddleware = exports.mapToExcludeRoute = void 0;
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const pathToRegexp = require("path-to-regexp");
const uuid_1 = require("uuid");
const utils_1 = require("../router/utils");
const mapToExcludeRoute = (routes) => {
    return routes.map(({ path, method }) => ({
        pathRegex: pathToRegexp(path),
        requestMethod: method,
    }));
};
exports.mapToExcludeRoute = mapToExcludeRoute;
const filterMiddleware = (middleware, routes, httpAdapter) => {
    const excludedRoutes = (0, exports.mapToExcludeRoute)(routes);
    return (0, iterare_1.iterate)([])
        .concat(middleware)
        .filter(shared_utils_1.isFunction)
        .map((item) => (0, exports.mapToClass)(item, excludedRoutes, httpAdapter))
        .toArray();
};
exports.filterMiddleware = filterMiddleware;
const mapToClass = (middleware, excludedRoutes, httpAdapter) => {
    if (isMiddlewareClass(middleware)) {
        if (excludedRoutes.length <= 0) {
            return middleware;
        }
        const MiddlewareHost = class extends middleware {
            use(...params) {
                const [req, _, next] = params;
                const isExcluded = isMiddlewareRouteExcluded(req, excludedRoutes, httpAdapter);
                if (isExcluded) {
                    return next();
                }
                return super.use(...params);
            }
        };
        return assignToken(MiddlewareHost, middleware.name);
    }
    return assignToken(class {
        constructor() {
            this.use = (...params) => {
                const [req, _, next] = params;
                const isExcluded = isMiddlewareRouteExcluded(req, excludedRoutes, httpAdapter);
                if (isExcluded) {
                    return next();
                }
                return middleware(...params);
            };
        }
    });
};
exports.mapToClass = mapToClass;
function isMiddlewareClass(middleware) {
    var _a, _b;
    const middlewareStr = middleware.toString();
    if (middlewareStr.substring(0, 5) === 'class') {
        return true;
    }
    const middlewareArr = middlewareStr.split(' ');
    return (middlewareArr[0] === 'function' &&
        /[A-Z]/.test((_a = middlewareArr[1]) === null || _a === void 0 ? void 0 : _a[0]) &&
        (0, shared_utils_1.isFunction)((_b = middleware.prototype) === null || _b === void 0 ? void 0 : _b.use));
}
exports.isMiddlewareClass = isMiddlewareClass;
function assignToken(metatype, token = (0, uuid_1.v4)()) {
    Object.defineProperty(metatype, 'name', { value: token });
    return metatype;
}
exports.assignToken = assignToken;
function isMiddlewareRouteExcluded(req, excludedRoutes, httpAdapter) {
    if (excludedRoutes.length <= 0) {
        return false;
    }
    const reqMethod = httpAdapter.getRequestMethod(req);
    const originalUrl = httpAdapter.getRequestUrl(req);
    const queryParamsIndex = originalUrl && originalUrl.indexOf('?');
    const pathname = queryParamsIndex >= 0
        ? originalUrl.slice(0, queryParamsIndex)
        : originalUrl;
    return (0, utils_1.isRouteExcluded)(excludedRoutes, pathname, common_1.RequestMethod[reqMethod]);
}
exports.isMiddlewareRouteExcluded = isMiddlewareRouteExcluded;
