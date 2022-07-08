"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterceptorsConsumer = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const execution_context_host_1 = require("../helpers/execution-context-host");
class InterceptorsConsumer {
    async intercept(interceptors, args, instance, callback, next, type) {
        if ((0, shared_utils_1.isEmpty)(interceptors)) {
            return next();
        }
        const context = this.createContext(args, instance, callback);
        context.setType(type);
        const start$ = (0, rxjs_1.defer)(() => this.transformDeferred(next));
        const nextFn = (i = 0) => async () => {
            if (i >= interceptors.length) {
                return start$;
            }
            const handler = {
                handle: () => (0, rxjs_1.from)(nextFn(i + 1)()).pipe((0, operators_1.mergeAll)()),
            };
            return interceptors[i].intercept(context, handler);
        };
        return nextFn()();
    }
    createContext(args, instance, callback) {
        return new execution_context_host_1.ExecutionContextHost(args, instance.constructor, callback);
    }
    transformDeferred(next) {
        return (0, rxjs_1.from)(next()).pipe((0, operators_1.switchMap)(res => {
            const isDeferred = res instanceof Promise || res instanceof rxjs_1.Observable;
            return isDeferred ? res : Promise.resolve(res);
        }));
    }
}
exports.InterceptorsConsumer = InterceptorsConsumer;
