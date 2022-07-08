"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: 'по-малко от секунда',
    other: 'по-малко от {{count}} секунди'
  },
  xSeconds: {
    one: '1 секунда',
    other: '{{count}} секунди'
  },
  halfAMinute: 'половин минута',
  lessThanXMinutes: {
    one: 'по-малко от минута',
    other: 'по-малко от {{count}} минути'
  },
  xMinutes: {
    one: '1 минута',
    other: '{{count}} минути'
  },
  aboutXHours: {
    one: 'около час',
    other: 'около {{count}} часа'
  },
  xHours: {
    one: '1 час',
    other: '{{count}} часа'
  },
  xDays: {
    one: '1 ден',
    other: '{{count}} дни'
  },
  aboutXWeeks: {
    one: 'около седмица',
    other: 'около {{count}} седмици'
  },
  xWeeks: {
    one: '1 седмица',
    other: '{{count}} седмици'
  },
  aboutXMonths: {
    one: 'около месец',
    other: 'около {{count}} месеца'
  },
  xMonths: {
    one: '1 месец',
    other: '{{count}} месеца'
  },
  aboutXYears: {
    one: 'около година',
    other: 'около {{count}} години'
  },
  xYears: {
    one: '1 година',
    other: '{{count}} години'
  },
  overXYears: {
    one: 'над година',
    other: 'над {{count}} години'
  },
  almostXYears: {
    one: 'почти година',
    other: 'почти {{count}} години'
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
      return 'след ' + result;
    } else {
      return 'преди ' + result;
    }
  }

  return result;
};

var _default = formatDistance;
exports.default = _default;
module.exports = exports.default;