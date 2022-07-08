"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalProvidersStorage = void 0;
const http_adapter_host_1 = require("../helpers/http-adapter-host");
class InternalProvidersStorage {
    constructor() {
        this._httpAdapterHost = new http_adapter_host_1.HttpAdapterHost();
    }
    get httpAdapterHost() {
        return this._httpAdapterHost;
    }
    get httpAdapter() {
        return this._httpAdapter;
    }
    set httpAdapter(httpAdapter) {
        this._httpAdapter = httpAdapter;
    }
}
exports.InternalProvidersStorage = InternalProvidersStorage;
