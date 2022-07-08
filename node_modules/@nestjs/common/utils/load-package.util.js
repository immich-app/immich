"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPackage = void 0;
const logger_service_1 = require("../services/logger.service");
const MISSING_REQUIRED_DEPENDENCY = (name, reason) => `The "${name}" package is missing. Please, make sure to install this library ($ npm install ${name}) to take advantage of ${reason}.`;
const logger = new logger_service_1.Logger('PackageLoader');
function loadPackage(packageName, context, loaderFn) {
    try {
        return loaderFn ? loaderFn() : require(packageName);
    }
    catch (e) {
        logger.error(MISSING_REQUIRED_DEPENDENCY(packageName, context));
        logger_service_1.Logger.flush();
        process.exit(1);
    }
}
exports.loadPackage = loadPackage;
