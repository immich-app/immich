"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalErrorProxy = void 0;
const execution_context_host_1 = require("../helpers/execution-context-host");
class ExternalErrorProxy {
    createProxy(targetCallback, exceptionsHandler, type) {
        return async (...args) => {
            try {
                return await targetCallback(...args);
            }
            catch (e) {
                const host = new execution_context_host_1.ExecutionContextHost(args);
                host.setType(type);
                return exceptionsHandler.next(e, host);
            }
        };
    }
}
exports.ExternalErrorProxy = ExternalErrorProxy;
