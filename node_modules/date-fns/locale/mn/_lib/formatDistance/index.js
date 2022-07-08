"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = formatDistance;
var formatDistanceLocale = {
  lessThanXSeconds: {
    one: 'секунд хүрэхгүй',
    other: '{{count}} секунд хүрэхгүй'
  },
  xSeconds: {
    one: '1 секунд',
    other: '{{count}} секунд'
  },
  halfAMinute: 'хагас минут',
  lessThanXMinutes: {
    one: 'минут хүрэхгүй',
    other: '{{count}} минут хүрэхгүй'
  },
  xMinutes: {
    one: '1 минут',
    other: '{{count}} минут'
  },
  aboutXHours: {
    one: 'ойролцоогоор 1 цаг',
    other: 'ойролцоогоор {{count}} цаг'
  },
  xHours: {
    one: '1 цаг',
    other: '{{count}} цаг'
  },
  xDays: {
    one: '1 өдөр',
    other: '{{count}} өдөр'
  },
  aboutXWeeks: {
    one: 'ойролцоогоор 1 долоо хоног',
    other: 'ойролцоогоор {{count}} долоо хоног'
  },
  xWeeks: {
    one: '1 долоо хоног',
    other: '{{count}} долоо хоног'
  },
  aboutXMonths: {
    one: 'ойролцоогоор 1 сар',
    other: 'ойролцоогоор {{count}} сар'
  },
  xMonths: {
    one: '1 сар',
    other: '{{count}} сар'
  },
  aboutXYears: {
    one: 'ойролцоогоор 1 жил',
    other: 'ойролцоогоор {{count}} жил'
  },
  xYears: {
    one: '1 жил',
    other: '{{count}} жил'
  },
  overXYears: {
    one: '1 жил гаран',
    other: '{{count}} жил гаран'
  },
  almostXYears: {
    one: 'бараг 1 жил',
    other: 'бараг {{count}} жил'
  }
};

function formatDistance(token, count, options) {
  options = options || {};
  var result;

  if (typeof formatDistanceLocale[token] === 'string') {
    result = formatDistanceLocale[token];
  } else if (count === 1) {
    result = formatDistanceLocale[token].one;
  } else {
    result = formatDistanceLocale[token].other.replace('{{count}}', count);
  }

  if (options.addSuffix) {
    /**
     * Append genitive case
     */
    var words = result.split(' ');
    var lastword = words.pop();
    result = words.join(' ');

    switch (lastword) {
      case 'секунд':
        result += ' секундийн';
        break;

      case 'минут':
        result += ' минутын';
        break;

      case 'цаг':
        result += ' цагийн';
        break;

      case 'өдөр':
        result += ' өдрийн';
        break;

      case 'сар':
        result += ' сарын';
        break;

      case 'жил':
        result += ' жилийн';
        break;

      case 'хоног':
        result += ' хоногийн';
        break;

      case 'гаран':
        result += ' гараны';
        break;

      case 'хүрэхгүй':
        result += ' хүрэхгүй хугацааны';
        break;

      default:
        result += lastword + '-н';
    }

    if (options.comparison > 0) {
      return result + ' дараа';
    } else {
      return result + ' өмнө';
    }
  }

  return result;
}

module.exports = exports.default;