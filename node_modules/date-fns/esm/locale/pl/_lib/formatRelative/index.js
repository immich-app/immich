import isSameUTCWeek from "../../../../_lib/isSameUTCWeek/index.js";
var adjectivesLastWeek = {
  masculine: 'ostatni',
  feminine: 'ostatnia'
};
var adjectivesThisWeek = {
  masculine: 'ten',
  feminine: 'ta'
};
var adjectivesNextWeek = {
  masculine: 'następny',
  feminine: 'następna'
};
var dayGrammaticalGender = {
  0: 'feminine',
  1: 'masculine',
  2: 'masculine',
  3: 'feminine',
  4: 'masculine',
  5: 'masculine',
  6: 'feminine'
};

function getAdjectives(token, date, baseDate, options) {
  if (isSameUTCWeek(date, baseDate, options)) {
    return adjectivesThisWeek;
  } else if (token === 'lastWeek') {
    return adjectivesLastWeek;
  } else if (token === 'nextWeek') {
    return adjectivesNextWeek;
  } else {
    throw new Error("Cannot determine adjectives for token ".concat(token));
  }
}

function getAdjective(token, date, baseDate, options) {
  var day = date.getUTCDay();
  var adjectives = getAdjectives(token, date, baseDate, options);
  var grammaticalGender = dayGrammaticalGender[day];
  return adjectives[grammaticalGender];
}

function dayAndTimeWithAdjective(token, date, baseDate, options) {
  var adjective = getAdjective(token, date, baseDate, options);
  return "'".concat(adjective, "' eeee 'o' p");
}

var formatRelativeLocale = {
  lastWeek: dayAndTimeWithAdjective,
  yesterday: "'wczoraj o' p",
  today: "'dzisiaj o' p",
  tomorrow: "'jutro o' p",
  nextWeek: dayAndTimeWithAdjective,
  other: 'P'
};
export default function formatRelative(token, date, baseDate, options) {
  var format = formatRelativeLocale[token];

  if (typeof format === 'function') {
    return format(token, date, baseDate, options);
  }

  return format;
}