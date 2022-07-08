"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterProxy = void 0;
const execution_context_host_1 = require("../helpers/execution-context-host");
class RouterProxy {
    createProxy(targetCallback, exceptionsHandler) {
        return async (req, res, next) => {
            try {
                await targetCallback(req, res, next);
            }
            catch (e) {
                const host = new execution_context_host_1.ExecutionContextHost([req, res, next]);
                exceptionsHandler.next(e, host);
            }
        };
    }
    createExceptionLayerProxy(targetCallback, exceptionsHandler) {
        return async (err, req, res, next) => {
            try {
                await targetCallback(err, req, res, next);
            }
            catch (e) {
                const host = new execution_context_host_1.ExecutionContextHost([req, res, next]);
                exceptionsHandler.next(e, host);
            }
        };
    }
}
exports.RouterProxy = RouterProxy;
