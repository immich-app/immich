"use strict";
var HttpModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpModule = void 0;
const tslib_1 = require("tslib");
const axios_1 = require("axios");
const module_decorator_1 = require("../decorators/modules/module.decorator");
const random_string_generator_util_1 = require("../utils/random-string-generator.util");
const http_constants_1 = require("./http.constants");
const http_service_1 = require("./http.service");
/**
 * @deprecated "HttpModule" (from the "@nestjs/common" package) is deprecated and will be removed in the next major release. Please, use the "@nestjs/axios" package instead.
 */
let HttpModule = HttpModule_1 = class HttpModule {
    static register(config) {
        return {
            module: HttpModule_1,
            providers: [
                {
                    provide: http_constants_1.AXIOS_INSTANCE_TOKEN,
                    useValue: axios_1.default.create(config),
                },
                {
                    provide: http_constants_1.HTTP_MODULE_ID,
                    useValue: (0, random_string_generator_util_1.randomStringGenerator)(),
                },
            ],
        };
    }
    static registerAsync(options) {
        return {
            module: HttpModule_1,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options),
                {
                    provide: http_constants_1.AXIOS_INSTANCE_TOKEN,
                    useFactory: (config) => axios_1.default.create(config),
                    inject: [http_constants_1.HTTP_MODULE_OPTIONS],
                },
                {
                    provide: http_constants_1.HTTP_MODULE_ID,
                    useValue: (0, random_string_generator_util_1.randomStringGenerator)(),
                },
                ...(options.extraProviders || []),
            ],
        };
    }
    static createAsyncProviders(options) {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass,
                useClass: options.useClass,
            },
        ];
    }
    static createAsyncOptionsProvider(options) {
        if (options.useFactory) {
            return {
                provide: http_constants_1.HTTP_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        return {
            provide: http_constants_1.HTTP_MODULE_OPTIONS,
            useFactory: async (optionsFactory) => optionsFactory.createHttpOptions(),
            inject: [options.useExisting || options.useClass],
        };
    }
};
HttpModule = HttpModule_1 = tslib_1.__decorate([
    (0, module_decorator_1.Module)({
        providers: [
            http_service_1.HttpService,
            {
                provide: http_constants_1.AXIOS_INSTANCE_TOKEN,
                useValue: axios_1.default,
            },
        ],
        exports: [http_service_1.HttpService],
    })
], HttpModule);
exports.HttpModule = HttpModule;
