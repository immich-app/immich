"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: "minder as 'n sekonde",
    other: 'minder as {{count}} sekondes'
  },
  xSeconds: {
    one: '1 sekonde',
    other: '{{count}} sekondes'
  },
  halfAMinute: "'n halwe minuut",
  lessThanXMinutes: {
    one: "minder as 'n minuut",
    other: 'minder as {{count}} minute'
  },
  xMinutes: {
    one: "'n minuut",
    other: '{{count}} minute'
  },
  aboutXHours: {
    one: 'ongeveer 1 uur',
    other: 'ongeveer {{count}} ure'
  },
  xHours: {
    one: '1 uur',
    other: '{{count}} ure'
  },
  xDays: {
    one: '1 dag',
    other: '{{count}} dae'
  },
  aboutXWeeks: {
    one: 'ongeveer 1 week',
    other: 'ongeveer {{count}} weke'
  },
  xWeeks: {
    one: '1 week',
    other: '{{count}} weke'
  },
  aboutXMonths: {
    one: 'ongeveer 1 maand',
    other: 'ongeveer {{count}} maande'
  },
  xMonths: {
    one: '1 maand',
    other: '{{count}} maande'
  },
  aboutXYears: {
    one: 'ongeveer 1 jaar',
    other: 'ongeveer {{count}} jaar'
  },
  xYears: {
    one: '1 jaar',
    other: '{{count}} jaar'
  },
  overXYears: {
    one: 'meer as 1 jaar',
    other: 'meer as {{count}} jaar'
  },
  almostXYears: {
    one: 'byna 1 jaar',
    other: 'byna {{count}} jaar'
  }
};

var formatDistance = function (token, count) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var usageGroup = formatDistanceLocale[token];
  var result;

  if (typeof usageGroup === 'string') {
    result = usageGroup;
  } else if (count === 1) {
    result = usageGroup.one;
  } else {
    result = usageGroup.other.replace('{{count}}', String(count));
  }

  if (options.addSuffix) {
    if (options.comparison && options.comparison > 0) {
      return 'oor ' + result;
    } else {
      return result + ' gelede';
    }
  }

  return result;
};

var _default = formatDistance;
exports.default = _default;
module.exports = exports.default;