"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = quartersToMonths;

var _index = _interopRequireDefault(require("../_lib/requiredArgs/index.js"));

var _index2 = require("../constants/index.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @name quartersToMonths
 * @category Conversion Helpers
 * @summary Convert number of quarters to months.
 *
 * @description
 * Convert a number of quarters to a full number of months.
 *
 * @param {number} quarters - number of quarters to be converted
 *
 * @returns {number} the number of quarters converted in months
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 quarters to months
 * const result = quartersToMonths(2)
 * //=> 6
 */
function quartersToMonths(quarters) {
  (0, _index.default)(1, arguments);
  return Math.floor(quarters * _index2.monthsInQuarter);
}

module.exports = exports.default;