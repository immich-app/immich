"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const tslib_1 = require("tslib");
const axios_1 = require("axios");
const rxjs_1 = require("rxjs");
const decorators_1 = require("../decorators");
const services_1 = require("../services");
const http_constants_1 = require("./http.constants");
/**
 * @deprecated "HttpModule" (from the "@nestjs/common" package) is deprecated and will be removed in the next major release. Please, use the "@nestjs/axios" package instead.
 */
let HttpService = class HttpService {
    constructor(instance = axios_1.default) {
        this.instance = instance;
        this.logger = new services_1.Logger(HttpService.name);
        this.logger.warn('DEPRECATED! "HttpModule" (from the "@nestjs/common" package) is deprecated and will be removed in the next major release. Please, use the "@nestjs/axios" package instead.');
    }
    request(config) {
        return this.makeObservable(this.instance.request, config);
    }
    get(url, config) {
        return this.makeObservable(this.instance.get, url, config);
    }
    delete(url, config) {
        return this.makeObservable(this.instance.delete, url, config);
    }
    head(url, config) {
        return this.makeObservable(this.instance.head, url, config);
    }
    post(url, data, config) {
        return this.makeObservable(this.instance.post, url, data, config);
    }
    put(url, data, config) {
        return this.makeObservable(this.instance.put, url, data, config);
    }
    patch(url, data, config) {
        return this.makeObservable(this.instance.patch, url, data, config);
    }
    get axiosRef() {
        return this.instance;
    }
    makeObservable(axios, ...args) {
        return new rxjs_1.Observable(subscriber => {
            const config = Object.assign({}, (args[args.length - 1] || {}));
            let cancelSource;
            if (!config.cancelToken) {
                cancelSource = axios_1.default.CancelToken.source();
                config.cancelToken = cancelSource.token;
            }
            axios(...args)
                .then(res => {
                subscriber.next(res);
                subscriber.complete();
            })
                .catch(err => {
                subscriber.error(err);
            });
            return () => {
                if (config.responseType === 'stream') {
                    return;
                }
                if (cancelSource) {
                    cancelSource.cancel();
                }
            };
        });
    }
};
HttpService = tslib_1.__decorate([
    tslib_1.__param(0, (0, decorators_1.Inject)(http_constants_1.AXIOS_INSTANCE_TOKEN)),
    tslib_1.__metadata("design:paramtypes", [Function])
], HttpService);
exports.HttpService = HttpService;
