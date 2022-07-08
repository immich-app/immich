var formatDistanceLocale = {
  lessThanXSeconds: {
    one: translateSeconds,
    other: translate
  },
  xSeconds: {
    one: translateSeconds,
    other: translate
  },
  halfAMinute: 'pusė minutės',
  lessThanXMinutes: {
    one: translateSingular,
    other: translate
  },
  xMinutes: {
    one: translateSingular,
    other: translate
  },
  aboutXHours: {
    one: translateSingular,
    other: translate
  },
  xHours: {
    one: translateSingular,
    other: translate
  },
  xDays: {
    one: translateSingular,
    other: translate
  },
  aboutWeeks: {
    one: translateSingular,
    other: translate
  },
  xWeeks: {
    one: translateSingular,
    other: translate
  },
  aboutXMonths: {
    one: translateSingular,
    other: translate
  },
  xMonths: {
    one: translateSingular,
    other: translate
  },
  aboutXYears: {
    one: translateSingular,
    other: translate
  },
  xYears: {
    one: translateSingular,
    other: translate
  },
  overXYears: {
    one: translateSingular,
    other: translate
  },
  almostXYears: {
    one: translateSingular,
    other: translate
  }
};
var translations = {
  xseconds_other: 'sekundė_sekundžių_sekundes',
  xminutes_one: 'minutė_minutės_minutę',
  xminutes_other: 'minutės_minučių_minutes',
  xhours_one: 'valanda_valandos_valandą',
  xhours_other: 'valandos_valandų_valandas',
  xdays_one: 'diena_dienos_dieną',
  xdays_other: 'dienos_dienų_dienas',
  xweeks_one: 'savaitė_savaitės_savaitę',
  xweeks_other: 'savaitės_savaičių_savaites',
  xmonths_one: 'mėnuo_mėnesio_mėnesį',
  xmonths_other: 'mėnesiai_mėnesių_mėnesius',
  xyears_one: 'metai_metų_metus',
  xyears_other: 'metai_metų_metus',
  about: 'apie',
  over: 'daugiau nei',
  almost: 'beveik',
  lessthan: 'mažiau nei'
};

function translateSeconds(number, addSuffix, key, isFuture) {
  if (!addSuffix) {
    return 'kelios sekundės';
  } else {
    return isFuture ? 'kelių sekundžių' : 'kelias sekundes';
  }
}

function translateSingular(number, addSuffix, key, isFuture) {
  return !addSuffix ? forms(key)[0] : isFuture ? forms(key)[1] : forms(key)[2];
}

function special(number) {
  return number % 10 === 0 || number > 10 && number < 20;
}

function forms(key) {
  return translations[key].split('_');
}

function translate(number, addSuffix, key, isFuture) {
  var result = number + ' ';

  if (number === 1) {
    return result + translateSingular(number, addSuffix, key[0], isFuture);
  } else if (!addSuffix) {
    return result + (special(number) ? forms(key)[1] : forms(key)[0]);
  } else {
    if (isFuture) {
      return result + forms(key)[1];
    } else {
      return result + (special(number) ? forms(key)[1] : forms(key)[2]);
    }
  }
}

export default function formatDistance(token, count, options) {
  options = options || {};
  var adverb = token.match(/about|over|almost|lessthan/i);
  var unit = token.replace(adverb, '');
  var result;

  if (typeof formatDistanceLocale[token] === 'string') {
    result = formatDistanceLocale[token];
  } else if (count === 1) {
    result = formatDistanceLocale[token].one(count, options.addSuffix, unit.toLowerCase() + '_one');
  } else {
    result = formatDistanceLocale[token].other(count, options.addSuffix, unit.toLowerCase() + '_other');
  }

  if (adverb) {
    result = translations[adverb[0].toLowerCase()] + ' ' + result;
  }

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'po ' + result;
    } else {
      return 'prieš ' + result;
    }
  }

  return result;
}