"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = formatRelative;

var _index = _interopRequireDefault(require("../../../../_lib/isSameUTCWeek/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var weekdays = ['svētdienā', 'pirmdienā', 'otrdienā', 'trešdienā', 'ceturtdienā', 'piektdienā', 'sestdienā'];
var formatRelativeLocale = {
  lastWeek: function (date, baseDate, options) {
    if ((0, _index.default)(date, baseDate, options)) {
      return "eeee 'plkst.' p";
    }

    var weekday = weekdays[date.getUTCDay()];
    return "'Pagājušā " + weekday + " plkst.' p";
  },
  yesterday: "'Vakar plkst.' p",
  today: "'Šodien plkst.' p",
  tomorrow: "'Rīt plkst.' p",
  nextWeek: function (date, baseDate, options) {
    if ((0, _index.default)(date, baseDate, options)) {
      return "eeee 'plkst.' p";
    }

    var weekday = weekdays[date.getUTCDay()];
    return "'Nākamajā " + weekday + " plkst.' p";
  },
  other: 'P'
};

function formatRelative(token, date, baseDate, options) {
  var format = formatRelativeLocale[token];

  if (typeof format === 'function') {
    return format(date, baseDate, options);
  }

  return format;
}

module.exports = exports.default;