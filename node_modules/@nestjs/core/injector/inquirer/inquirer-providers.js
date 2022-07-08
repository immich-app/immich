"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquirerProvider = void 0;
const common_1 = require("@nestjs/common");
const inquirer_constants_1 = require("./inquirer-constants");
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => { };
exports.inquirerProvider = {
    provide: inquirer_constants_1.INQUIRER,
    scope: common_1.Scope.TRANSIENT,
    useFactory: noop,
};
