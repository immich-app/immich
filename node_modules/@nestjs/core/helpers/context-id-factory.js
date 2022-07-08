"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextIdFactory = exports.createContextId = void 0;
const request_constants_1 = require("../router/request/request-constants");
function createContextId() {
    /**
     * We are generating random identifier to track asynchronous
     * execution context. An identifier does not have to be neither unique
     * nor unpredictable because WeakMap uses objects as keys (reference comparison).
     * Thus, even though identifier number might be equal, WeakMap would properly
     * associate asynchronous context with its internal map values using object reference.
     * Object is automatically removed once request has been processed (closure).
     */
    return { id: Math.random() };
}
exports.createContextId = createContextId;
class ContextIdFactory {
    /**
     * Generates a context identifier based on the request object.
     */
    static create() {
        return createContextId();
    }
    /**
     * Generates a random identifier to track asynchronous execution context.
     * @param request request object
     */
    static getByRequest(request) {
        if (!request) {
            return createContextId();
        }
        if (request[request_constants_1.REQUEST_CONTEXT_ID]) {
            return request[request_constants_1.REQUEST_CONTEXT_ID];
        }
        if (request.raw && request.raw[request_constants_1.REQUEST_CONTEXT_ID]) {
            return request.raw[request_constants_1.REQUEST_CONTEXT_ID];
        }
        return createContextId();
    }
}
exports.ContextIdFactory = ContextIdFactory;
