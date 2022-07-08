"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = quartersToYears;

var _index = _interopRequireDefault(require("../_lib/requiredArgs/index.js"));

var _index2 = require("../constants/index.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @name quartersToYears
 * @category Conversion Helpers
 * @summary Convert number of quarters to years.
 *
 * @description
 * Convert a number of quarters to a full number of years.
 *
 * @param {number} quarters - number of quarters to be converted
 *
 * @returns {number} the number of quarters converted in years
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 8 quarters to years
 * const result = quartersToYears(8)
 * //=> 2
 *
 * @example
 * // It uses floor rounding:
 * const result = quartersToYears(11)
 * //=> 2
 */
function quartersToYears(quarters) {
  (0, _index.default)(1, arguments);
  var years = quarters / _index2.quartersInYear;
  return Math.floor(years);
}

module.exports = exports.default;