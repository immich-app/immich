"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipesConsumer = void 0;
const params_token_factory_1 = require("./params-token-factory");
class PipesConsumer {
    constructor() {
        this.paramsTokenFactory = new params_token_factory_1.ParamsTokenFactory();
    }
    async apply(value, { metatype, type, data }, pipes) {
        const token = this.paramsTokenFactory.exchangeEnumForString(type);
        return this.applyPipes(value, { metatype, type: token, data }, pipes);
    }
    async applyPipes(value, { metatype, type, data }, transforms) {
        return transforms.reduce(async (deferredValue, pipe) => {
            const val = await deferredValue;
            const result = pipe.transform(val, { metatype, type, data });
            return result;
        }, Promise.resolve(value));
    }
}
exports.PipesConsumer = PipesConsumer;
