"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleCompiler = void 0;
const tslib_1 = require("tslib");
const module_token_factory_1 = require("./module-token-factory");
class ModuleCompiler {
    constructor(moduleTokenFactory = new module_token_factory_1.ModuleTokenFactory()) {
        this.moduleTokenFactory = moduleTokenFactory;
    }
    async compile(metatype) {
        const { type, dynamicMetadata } = this.extractMetadata(await metatype);
        const token = this.moduleTokenFactory.create(type, dynamicMetadata);
        return { type, dynamicMetadata, token };
    }
    extractMetadata(metatype) {
        if (!this.isDynamicModule(metatype)) {
            return { type: metatype };
        }
        const { module: type } = metatype, dynamicMetadata = tslib_1.__rest(metatype, ["module"]);
        return { type, dynamicMetadata };
    }
    isDynamicModule(module) {
        return !!module.module;
    }
}
exports.ModuleCompiler = ModuleCompiler;
