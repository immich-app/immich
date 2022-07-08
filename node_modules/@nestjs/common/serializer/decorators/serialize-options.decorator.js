"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializeOptions = void 0;
const decorators_1 = require("../../decorators");
const class_serializer_constants_1 = require("../class-serializer.constants");
const SerializeOptions = (options) => (0, decorators_1.SetMetadata)(class_serializer_constants_1.CLASS_SERIALIZER_OPTIONS, options);
exports.SerializeOptions = SerializeOptions;
