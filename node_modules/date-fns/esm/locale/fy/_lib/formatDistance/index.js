var formatDistanceLocale = {
  lessThanXSeconds: {
    one: 'minder as 1 sekonde',
    other: 'minder as {{count}} sekonden'
  },
  xSeconds: {
    one: '1 sekonde',
    other: '{{count}} sekonden'
  },
  halfAMinute: 'oardel minút',
  lessThanXMinutes: {
    one: 'minder as 1 minút',
    other: 'minder as {{count}} minuten'
  },
  xMinutes: {
    one: '1 minút',
    other: '{{count}} minuten'
  },
  aboutXHours: {
    one: 'sawat 1 oere',
    other: 'sawat {{count}} oere'
  },
  xHours: {
    one: '1 oere',
    other: '{{count}} oere'
  },
  xDays: {
    one: '1 dei',
    other: '{{count}} dagen'
  },
  aboutXWeeks: {
    one: 'sawat 1 wike',
    other: 'sawat {{count}} wiken'
  },
  xWeeks: {
    one: '1 wike',
    other: '{{count}} wiken'
  },
  aboutXMonths: {
    one: 'sawat 1 moanne',
    other: 'sawat {{count}} moannen'
  },
  xMonths: {
    one: '1 moanne',
    other: '{{count}} moannen'
  },
  aboutXYears: {
    one: 'sawat 1 jier',
    other: 'sawat {{count}} jier'
  },
  xYears: {
    one: '1 jier',
    other: '{{count}} jier'
  },
  overXYears: {
    one: 'mear as 1 jier',
    other: 'mear as {{count}}s jier'
  },
  almostXYears: {
    one: 'hast 1 jier',
    other: 'hast {{count}} jier'
  }
};
export default function formatDistance(token, count, options) {
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
    if (options.comparison > 0) {
      return 'oer ' + result;
    } else {
      return result + ' lyn';
    }
  }

  return result;
}