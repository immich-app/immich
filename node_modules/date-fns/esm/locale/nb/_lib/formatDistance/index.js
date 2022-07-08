var formatDistanceLocale = {
  lessThanXSeconds: {
    singular: 'mindre enn ett sekund',
    plural: 'mindre enn {{count}} sekunder'
  },
  xSeconds: {
    singular: 'ett sekund',
    plural: '{{count}} sekunder'
  },
  halfAMinute: 'et halvt minutt',
  lessThanXMinutes: {
    singular: 'mindre enn ett minutt',
    plural: 'mindre enn {{count}} minutter'
  },
  xMinutes: {
    singular: 'ett minutt',
    plural: '{{count}} minutter'
  },
  aboutXHours: {
    singular: 'omtrent en time',
    plural: 'omtrent {{count}} timer'
  },
  xHours: {
    singular: 'en time',
    plural: '{{count}} timer'
  },
  xDays: {
    singular: 'en dag',
    plural: '{{count}} dager'
  },
  aboutXWeeks: {
    singular: 'omtrent en uke',
    plural: 'omtrent {{count}} uker'
  },
  xWeeks: {
    singular: 'en uke',
    plural: '{{count}} uker'
  },
  aboutXMonths: {
    singular: 'omtrent en måned',
    plural: 'omtrent {{count}} måneder'
  },
  xMonths: {
    singular: 'en måned',
    plural: '{{count}} måneder'
  },
  aboutXYears: {
    singular: 'omtrent ett år',
    plural: 'omtrent {{count}} år'
  },
  xYears: {
    singular: 'ett år',
    plural: '{{count}} år'
  },
  overXYears: {
    singular: 'over ett år',
    plural: 'over {{count}} år'
  },
  almostXYears: {
    singular: 'nesten ett år',
    plural: 'nesten {{count}} år'
  }
};
export default function formatDistance(token, count, options) {
  options = options || {};
  var translation = formatDistanceLocale[token];
  var result;

  if (typeof translation === 'string') {
    result = translation;
  } else if (count === 0 || count > 1) {
    result = translation.plural.replace('{{count}}', count);
  } else {
    result = translation.singular;
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'om ' + result;
    } else {
      return result + ' siden';
    }
  }

  return result;
}