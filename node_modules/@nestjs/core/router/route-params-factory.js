"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteParamsFactory = void 0;
const route_paramtypes_enum_1 = require("@nestjs/common/enums/route-paramtypes.enum");
class RouteParamsFactory {
    exchangeKeyForValue(key, data, { req, res, next }) {
        switch (key) {
            case route_paramtypes_enum_1.RouteParamtypes.NEXT:
                return next;
            case route_paramtypes_enum_1.RouteParamtypes.REQUEST:
                return req;
            case route_paramtypes_enum_1.RouteParamtypes.RESPONSE:
                return res;
            case route_paramtypes_enum_1.RouteParamtypes.BODY:
                return data && req.body ? req.body[data] : req.body;
            case route_paramtypes_enum_1.RouteParamtypes.PARAM:
                return data ? req.params[data] : req.params;
            case route_paramtypes_enum_1.RouteParamtypes.HOST:
                const hosts = req.hosts || {};
                return data ? hosts[data] : hosts;
            case route_paramtypes_enum_1.RouteParamtypes.QUERY:
                return data ? req.query[data] : req.query;
            case route_paramtypes_enum_1.RouteParamtypes.HEADERS:
                return data ? req.headers[data.toLowerCase()] : req.headers;
            case route_paramtypes_enum_1.RouteParamtypes.SESSION:
                return req.session;
            case route_paramtypes_enum_1.RouteParamtypes.FILE:
                return req[data || 'file'];
            case route_paramtypes_enum_1.RouteParamtypes.FILES:
                return req.files;
            case route_paramtypes_enum_1.RouteParamtypes.IP:
                return req.ip;
            default:
                return null;
        }
    }
}
exports.RouteParamsFactory = RouteParamsFactory;
