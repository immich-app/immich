"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVALID_EXECUTION_CONTEXT = exports.VERSIONED_CONTROLLER_MAPPING_MESSAGE = exports.CONTROLLER_MAPPING_MESSAGE = exports.VERSIONED_ROUTE_MAPPED_MESSAGE = exports.ROUTE_MAPPED_MESSAGE = exports.MODULE_INIT_MESSAGE = void 0;
const request_method_enum_1 = require("@nestjs/common/enums/request-method.enum");
const version_options_interface_1 = require("@nestjs/common/interfaces/version-options.interface");
const MODULE_INIT_MESSAGE = (text, module) => `${module} dependencies initialized`;
exports.MODULE_INIT_MESSAGE = MODULE_INIT_MESSAGE;
const ROUTE_MAPPED_MESSAGE = (path, method) => `Mapped {${path}, ${request_method_enum_1.RequestMethod[method]}} route`;
exports.ROUTE_MAPPED_MESSAGE = ROUTE_MAPPED_MESSAGE;
const VERSIONED_ROUTE_MAPPED_MESSAGE = (path, method, version) => {
    const controllerVersions = Array.isArray(version) ? version : [version];
    const versions = controllerVersions
        .map(version => (version === version_options_interface_1.VERSION_NEUTRAL ? 'Neutral' : version))
        .join(',');
    return `Mapped {${path}, ${request_method_enum_1.RequestMethod[method]}} (version: ${versions}) route`;
};
exports.VERSIONED_ROUTE_MAPPED_MESSAGE = VERSIONED_ROUTE_MAPPED_MESSAGE;
const CONTROLLER_MAPPING_MESSAGE = (name, path) => `${name} {${path}}:`;
exports.CONTROLLER_MAPPING_MESSAGE = CONTROLLER_MAPPING_MESSAGE;
const VERSIONED_CONTROLLER_MAPPING_MESSAGE = (name, path, version) => {
    const controllerVersions = Array.isArray(version) ? version : [version];
    const versions = controllerVersions
        .map(version => (version === version_options_interface_1.VERSION_NEUTRAL ? 'Neutral' : version))
        .join(',');
    return `${name} {${path}} (version: ${versions}):`;
};
exports.VERSIONED_CONTROLLER_MAPPING_MESSAGE = VERSIONED_CONTROLLER_MAPPING_MESSAGE;
const INVALID_EXECUTION_CONTEXT = (methodName, currentContext) => `Calling ${methodName} is not allowed in this context. Your current execution context is "${currentContext}".`;
exports.INVALID_EXECUTION_CONTEXT = INVALID_EXECUTION_CONTEXT;
