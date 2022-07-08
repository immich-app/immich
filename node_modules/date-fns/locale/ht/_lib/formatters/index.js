"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var formatters = {}; // Special case for day of month ordinals in long date format context:
// 1er mars, 2 mars, 3 mars, …
// See https://github.com/date-fns/date-fns/issues/437

var monthsTokens = ['MMM', 'MMMM'];
monthsTokens.forEach(function (monthToken) {
  formatters['Do ' + monthToken] = function (date, options) {
    var commonFormatters = options.formatters;
    var dayOfMonthToken = date.getUTCDate() === 1 ? 'Do' : 'D';
    var dayOfMonthFormatter = commonFormatters[dayOfMonthToken];
    var monthFormatter = commonFormatters[monthToken];
    return dayOfMonthFormatter(date, options) + ' ' + monthFormatter(date, options);
  };
});
var _default = formatters;
exports.default = _default;
module.exports = exports.default;