"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutePathFactory = void 0;
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const utils_1 = require("./utils");
class RoutePathFactory {
    constructor(applicationConfig) {
        this.applicationConfig = applicationConfig;
    }
    create(metadata, requestMethod) {
        var _a;
        let paths = [''];
        const versionOrVersions = this.getVersion(metadata);
        if (versionOrVersions &&
            ((_a = metadata.versioningOptions) === null || _a === void 0 ? void 0 : _a.type) === common_1.VersioningType.URI) {
            const versionPrefix = this.getVersionPrefix(metadata.versioningOptions);
            if (Array.isArray(versionOrVersions)) {
                paths = (0, common_1.flatten)(paths.map(path => versionOrVersions.map(version => 
                // Version Neutral - Do not include version in URL
                version === common_1.VERSION_NEUTRAL
                    ? path
                    : `${path}/${versionPrefix}${version}`)));
            }
            else {
                // Version Neutral - Do not include version in URL
                if (versionOrVersions !== common_1.VERSION_NEUTRAL) {
                    paths = paths.map(path => `${path}/${versionPrefix}${versionOrVersions}`);
                }
            }
        }
        paths = this.appendToAllIfDefined(paths, metadata.modulePath);
        paths = this.appendToAllIfDefined(paths, metadata.ctrlPath);
        paths = this.appendToAllIfDefined(paths, metadata.methodPath);
        if (metadata.globalPrefix) {
            paths = paths.map(path => {
                if (this.isExcludedFromGlobalPrefix(path, requestMethod)) {
                    return path;
                }
                return (0, shared_utils_1.stripEndSlash)(metadata.globalPrefix || '') + path;
            });
        }
        return paths
            .map(path => (0, shared_utils_1.addLeadingSlash)(path || '/'))
            .map(path => (path !== '/' ? (0, shared_utils_1.stripEndSlash)(path) : path));
    }
    getVersion(metadata) {
        // The version will be either the path version or the controller version,
        // with the pathVersion taking priority.
        return metadata.methodVersion || metadata.controllerVersion;
    }
    getVersionPrefix(versioningOptions) {
        const defaultPrefix = 'v';
        if (versioningOptions.type === common_1.VersioningType.URI) {
            if (versioningOptions.prefix === false) {
                return '';
            }
            else if (versioningOptions.prefix !== undefined) {
                return versioningOptions.prefix;
            }
        }
        return defaultPrefix;
    }
    appendToAllIfDefined(paths, fragmentToAppend) {
        if (!fragmentToAppend) {
            return paths;
        }
        const concatPaths = (a, b) => (0, shared_utils_1.stripEndSlash)(a) + (0, shared_utils_1.addLeadingSlash)(b);
        if (Array.isArray(fragmentToAppend)) {
            const paths2dArray = paths.map(path => fragmentToAppend.map(fragment => concatPaths(path, fragment)));
            return (0, common_1.flatten)(paths2dArray);
        }
        return paths.map(path => concatPaths(path, fragmentToAppend));
    }
    isExcludedFromGlobalPrefix(path, requestMethod) {
        if ((0, shared_utils_1.isUndefined)(requestMethod)) {
            return false;
        }
        const options = this.applicationConfig.getGlobalPrefixOptions();
        const excludedRoutes = options.exclude;
        return (Array.isArray(excludedRoutes) &&
            (0, utils_1.isRouteExcluded)(excludedRoutes, path, requestMethod));
    }
}
exports.RoutePathFactory = RoutePathFactory;
