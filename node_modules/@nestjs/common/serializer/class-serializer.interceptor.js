"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassSerializerInterceptor = void 0;
const tslib_1 = require("tslib");
const operators_1 = require("rxjs/operators");
const core_1 = require("../decorators/core");
const file_stream_1 = require("../file-stream");
const load_package_util_1 = require("../utils/load-package.util");
const shared_utils_1 = require("../utils/shared.utils");
const class_serializer_constants_1 = require("./class-serializer.constants");
let classTransformer = {};
// NOTE (external)
// We need to deduplicate them here due to the circular dependency
// between core and common packages
const REFLECTOR = 'Reflector';
let ClassSerializerInterceptor = class ClassSerializerInterceptor {
    constructor(reflector, defaultOptions = {}) {
        var _a;
        this.reflector = reflector;
        this.defaultOptions = defaultOptions;
        classTransformer =
            (_a = defaultOptions === null || defaultOptions === void 0 ? void 0 : defaultOptions.transformerPackage) !== null && _a !== void 0 ? _a : (0, load_package_util_1.loadPackage)('class-transformer', 'ClassSerializerInterceptor', () => require('class-transformer'));
        if (!(defaultOptions === null || defaultOptions === void 0 ? void 0 : defaultOptions.transformerPackage)) {
            require('class-transformer');
        }
    }
    intercept(context, next) {
        const contextOptions = this.getContextOptions(context);
        const options = Object.assign(Object.assign({}, this.defaultOptions), contextOptions);
        return next
            .handle()
            .pipe((0, operators_1.map)((res) => this.serialize(res, options)));
    }
    /**
     * Serializes responses that are non-null objects nor streamable files.
     */
    serialize(response, options) {
        if (!(0, shared_utils_1.isObject)(response) || response instanceof file_stream_1.StreamableFile) {
            return response;
        }
        return Array.isArray(response)
            ? response.map(item => this.transformToPlain(item, options))
            : this.transformToPlain(response, options);
    }
    transformToPlain(plainOrClass, options) {
        return plainOrClass
            ? classTransformer.classToPlain(plainOrClass, options)
            : plainOrClass;
    }
    getContextOptions(context) {
        return (this.reflectSerializeMetadata(context.getHandler()) ||
            this.reflectSerializeMetadata(context.getClass()));
    }
    reflectSerializeMetadata(obj) {
        return this.reflector.get(class_serializer_constants_1.CLASS_SERIALIZER_OPTIONS, obj);
    }
};
ClassSerializerInterceptor = tslib_1.__decorate([
    (0, core_1.Injectable)(),
    tslib_1.__param(0, (0, core_1.Inject)(REFLECTOR)),
    tslib_1.__param(1, (0, core_1.Optional)()),
    tslib_1.__metadata("design:paramtypes", [Object, Object])
], ClassSerializerInterceptor);
exports.ClassSerializerInterceptor = ClassSerializerInterceptor;
