"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParamsTokenFactory = void 0;
const route_paramtypes_enum_1 = require("@nestjs/common/enums/route-paramtypes.enum");
class ParamsTokenFactory {
    exchangeEnumForString(type) {
        switch (type) {
            case route_paramtypes_enum_1.RouteParamtypes.BODY:
                return 'body';
            case route_paramtypes_enum_1.RouteParamtypes.PARAM:
                return 'param';
            case route_paramtypes_enum_1.RouteParamtypes.QUERY:
                return 'query';
            default:
                return 'custom';
        }
    }
}
exports.ParamsTokenFactory = ParamsTokenFactory;
