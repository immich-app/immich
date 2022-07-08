"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandlerMetadataStorage = exports.HANDLER_METADATA_SYMBOL = void 0;
const constants_1 = require("../injector/constants");
exports.HANDLER_METADATA_SYMBOL = Symbol.for('handler_metadata:cache');
class HandlerMetadataStorage {
    constructor() {
        this[_a] = new Map();
    }
    set(controller, methodName, metadata) {
        const metadataKey = this.getMetadataKey(controller, methodName);
        this[exports.HANDLER_METADATA_SYMBOL].set(metadataKey, metadata);
    }
    get(controller, methodName) {
        const metadataKey = this.getMetadataKey(controller, methodName);
        return this[exports.HANDLER_METADATA_SYMBOL].get(metadataKey);
    }
    getMetadataKey(controller, methodName) {
        const ctor = controller.constructor;
        const controllerKey = ctor && (ctor[constants_1.CONTROLLER_ID_KEY] || ctor.name);
        return controllerKey + methodName;
    }
}
exports.HandlerMetadataStorage = HandlerMetadataStorage;
_a = exports.HANDLER_METADATA_SYMBOL;
