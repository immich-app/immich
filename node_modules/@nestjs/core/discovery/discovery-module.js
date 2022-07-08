"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const metadata_scanner_1 = require("../metadata-scanner");
const discovery_service_1 = require("./discovery-service");
/**
 * @publicApi
 */
let DiscoveryModule = class DiscoveryModule {
};
DiscoveryModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [metadata_scanner_1.MetadataScanner, discovery_service_1.DiscoveryService],
        exports: [metadata_scanner_1.MetadataScanner, discovery_service_1.DiscoveryService],
    })
], DiscoveryModule);
exports.DiscoveryModule = DiscoveryModule;
