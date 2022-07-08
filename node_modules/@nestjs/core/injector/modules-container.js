"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesContainer = void 0;
const uuid_1 = require("uuid");
class ModulesContainer extends Map {
    constructor() {
        super(...arguments);
        this._applicationId = (0, uuid_1.v4)();
    }
    get applicationId() {
        return this._applicationId;
    }
}
exports.ModulesContainer = ModulesContainer;
