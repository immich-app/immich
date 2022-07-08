"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = formatDistance;
var formatDistanceLocale = {
  lessThanXSeconds: {
    singular: 'mindre än en sekund',
    plural: 'mindre än {{count}} sekunder'
  },
  xSeconds: {
    singular: 'en sekund',
    plural: '{{count}} sekunder'
  },
  halfAMinute: 'en halv minut',
  lessThanXMinutes: {
    singular: 'mindre än en minut',
    plural: 'mindre än {{count}} minuter'
  },
  xMinutes: {
    singular: 'en minut',
    plural: '{{count}} minuter'
  },
  aboutXHours: {
    singular: 'ungefär en timme',
    plural: 'ungefär {{count}} timmar'
  },
  xHours: {
    singular: 'en timme',
    plural: '{{count}} timmar'
  },
  xDays: {
    singular: 'en dag',
    plural: '{{count}} dagar'
  },
  aboutXWeeks: {
    singular: 'ungefär en vecka',
    plural: 'ungefär {{count}} vecka'
  },
  xWeeks: {
    singular: 'en vecka',
    plural: '{{count}} vecka'
  },
  aboutXMonths: {
    singular: 'ungefär en månad',
    plural: 'ungefär {{count}} månader'
  },
  xMonths: {
    singular: 'en månad',
    plural: '{{count}} månader'
  },
  aboutXYears: {
    singular: 'ungefär ett år',
    plural: 'ungefär {{count}} år'
  },
  xYears: {
    singular: 'ett år',
    plural: '{{count}} år'
  },
  overXYears: {
    singular: 'över ett år',
    plural: 'över {{count}} år'
  },
  almostXYears: {
    singular: 'nästan ett år',
    plural: 'nästan {{count}} år'
  }
};
var wordMapping = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv'];

function formatDistance(token, count, options) {
  options = options || {
    onlyNumeric: false
  };
  var translation = formatDistanceLocale[token];
  var result;

  if (typeof translation === 'string') {
    result = translation;
  } else if (count === 0 || count > 1) {
    if (options.onlyNumeric) {
      result = translation.plural.replace('{{count}}', count);
    } else {
      result = translation.plural.replace('{{count}}', count < 13 ? wordMapping[count] : count);
    }
  } else {
    result = translation.singular;
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'om ' + result;
    } else {
      return result + ' sedan';
    }
  }

  return result;
}

module.exports = exports.default;