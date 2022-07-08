"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = previousSaturday;

var _index = _interopRequireDefault(require("../_lib/requiredArgs/index.js"));

var _index2 = _interopRequireDefault(require("../previousDay/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @name previousSaturday
 * @category Weekday Helpers
 * @summary When is the previous Saturday?
 *
 * @description
 * When is the previous Saturday?
 *
 * @param {Date | number} date - the date to start counting from
 * @returns {Date} the previous Saturday
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // When is the previous Saturday before Jun, 20, 2021?
 * const result = previousSaturday(new Date(2021, 5, 20))
 * //=> Sat June 19 2021 00:00:00
 */
function previousSaturday(date) {
  (0, _index.default)(1, arguments);
  return (0, _index2.default)(date, 6);
}

module.exports = exports.default;