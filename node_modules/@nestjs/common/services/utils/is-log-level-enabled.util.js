"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLogLevelEnabled = void 0;
const LOG_LEVEL_VALUES = {
    debug: 0,
    verbose: 1,
    log: 2,
    warn: 3,
    error: 4,
};
/**
 * Checks if target level is enabled.
 * @param targetLevel target level
 * @param logLevels array of enabled log levels
 */
function isLogLevelEnabled(targetLevel, logLevels) {
    var _a;
    if (!logLevels || (Array.isArray(logLevels) && (logLevels === null || logLevels === void 0 ? void 0 : logLevels.length) === 0)) {
        return false;
    }
    if (logLevels.includes(targetLevel)) {
        return true;
    }
    const highestLogLevelValue = (_a = logLevels
        .map(level => LOG_LEVEL_VALUES[level])
        .sort((a, b) => b - a)) === null || _a === void 0 ? void 0 : _a[0];
    const targetLevelValue = LOG_LEVEL_VALUES[targetLevel];
    return targetLevelValue >= highestLogLevelValue;
}
exports.isLogLevelEnabled = isLogLevelEnabled;
