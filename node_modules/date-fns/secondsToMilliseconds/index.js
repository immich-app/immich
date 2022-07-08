"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = secondsToMilliseconds;

var _index = _interopRequireDefault(require("../_lib/requiredArgs/index.js"));

var _index2 = require("../constants/index.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @name secondsToMilliseconds
 * @category Conversion Helpers
 * @summary Convert seconds to milliseconds.
 *
 * @description
 * Convert a number of seconds to a full number of milliseconds.
 *
 * @param {number} seconds - number of seconds to be converted
 *
 * @returns {number} the number of seconds converted in milliseconds
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 seconds into milliseconds
 * const result = secondsToMilliseconds(2)
 * //=> 2000
 */
function secondsToMilliseconds(seconds) {
  (0, _index.default)(1, arguments);
  return seconds * _index2.millisecondsInSecond;
}

module.exports = exports.default;