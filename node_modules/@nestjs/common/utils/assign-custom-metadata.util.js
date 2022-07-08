"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignCustomParameterMetadata = void 0;
const constants_1 = require("../constants");
function assignCustomParameterMetadata(args, paramtype, index, factory, data, ...pipes) {
    return Object.assign(Object.assign({}, args), { [`${paramtype}${constants_1.CUSTOM_ROUTE_AGRS_METADATA}:${index}`]: {
            index,
            factory,
            data,
            pipes,
        } });
}
exports.assignCustomParameterMetadata = assignCustomParameterMetadata;
