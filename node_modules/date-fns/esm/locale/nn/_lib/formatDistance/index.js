var formatDistanceLocale = {
  lessThanXSeconds: {
    singular: 'mindre enn eitt sekund',
    plural: 'mindre enn {{count}} sekund'
  },
  xSeconds: {
    singular: 'eitt sekund',
    plural: '{{count}} sekund'
  },
  halfAMinute: 'eit halvt minutt',
  lessThanXMinutes: {
    singular: 'mindre enn eitt minutt',
    plural: 'mindre enn {{count}} minutt'
  },
  xMinutes: {
    singular: 'eitt minutt',
    plural: '{{count}} minutt'
  },
  aboutXHours: {
    singular: 'omtrent ein time',
    plural: 'omtrent {{count}} timar'
  },
  xHours: {
    singular: 'ein time',
    plural: '{{count}} timar'
  },
  xDays: {
    singular: 'ein dag',
    plural: '{{count}} dagar'
  },
  aboutXWeeks: {
    singular: 'omtrent ei veke',
    plural: 'omtrent {{count}} veker'
  },
  xWeeks: {
    singular: 'ei veke',
    plural: '{{count}} veker'
  },
  aboutXMonths: {
    singular: 'omtrent ein månad',
    plural: 'omtrent {{count}} månader'
  },
  xMonths: {
    singular: 'ein månad',
    plural: '{{count}} månader'
  },
  aboutXYears: {
    singular: 'omtrent eitt år',
    plural: 'omtrent {{count}} år'
  },
  xYears: {
    singular: 'eitt år',
    plural: '{{count}} år'
  },
  overXYears: {
    singular: 'over eitt år',
    plural: 'over {{count}} år'
  },
  almostXYears: {
    singular: 'nesten eitt år',
    plural: 'nesten {{count}} år'
  }
};
var wordMapping = ['null', 'ein', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti', 'elleve', 'tolv'];
export default function formatDistance(token, count, options) {
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
      return result + ' sidan';
    }
  }

  return result;
}