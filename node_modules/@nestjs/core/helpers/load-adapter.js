"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAdapter = void 0;
const common_1 = require("@nestjs/common");
const MISSING_REQUIRED_DEPENDENCY = (defaultPlatform, transport) => `No driver (${transport}) has been selected. In order to take advantage of the default driver, please, ensure to install the "${defaultPlatform}" package ($ npm install ${defaultPlatform}).`;
const logger = new common_1.Logger('PackageLoader');
function loadAdapter(defaultPlatform, transport, loaderFn) {
    try {
        return loaderFn ? loaderFn() : require(defaultPlatform);
    }
    catch (e) {
        logger.error(MISSING_REQUIRED_DEPENDENCY(defaultPlatform, transport));
        process.exit(1);
    }
}
exports.loadAdapter = loadAdapter;
