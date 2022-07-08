"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestProvider = void 0;
const common_1 = require("@nestjs/common");
const request_constants_1 = require("./request-constants");
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => { };
exports.requestProvider = {
    provide: request_constants_1.REQUEST,
    scope: common_1.Scope.REQUEST,
    useFactory: noop,
};
