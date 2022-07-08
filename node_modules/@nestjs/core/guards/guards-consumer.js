"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardsConsumer = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const rxjs_1 = require("rxjs");
const execution_context_host_1 = require("../helpers/execution-context-host");
class GuardsConsumer {
    async tryActivate(guards, args, instance, callback, type) {
        if (!guards || (0, shared_utils_1.isEmpty)(guards)) {
            return true;
        }
        const context = this.createContext(args, instance, callback);
        context.setType(type);
        for (const guard of guards) {
            const result = guard.canActivate(context);
            if (await this.pickResult(result)) {
                continue;
            }
            return false;
        }
        return true;
    }
    createContext(args, instance, callback) {
        return new execution_context_host_1.ExecutionContextHost(args, instance.constructor, callback);
    }
    async pickResult(result) {
        if (result instanceof rxjs_1.Observable) {
            return (0, rxjs_1.lastValueFrom)(result);
        }
        return result;
    }
}
exports.GuardsConsumer = GuardsConsumer;
