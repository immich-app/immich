import isSameUTCWeek from "../../../../_lib/isSameUTCWeek/index.js";

function checkWeek(_date, _baseDate, _options, baseFormat) {
  if (isSameUTCWeek(_date, _baseDate, _options)) {
    return baseFormat; // in same week
  } else if (_date.getTime() > _baseDate.getTime()) {
    return "'下个'" + baseFormat; // in next week
  }

  return "'上个'" + baseFormat; // in last week
}

var formatRelativeLocale = {
  lastWeek: checkWeek,
  // days before yesterday, maybe in this week or last week
  yesterday: "'昨天' p",
  today: "'今天' p",
  tomorrow: "'明天' p",
  nextWeek: checkWeek,
  // days after tomorrow, maybe in this week or next week
  other: 'PP p'
};
export default function formatRelative(token, _date, _baseDate, _options) {
  var format = formatRelativeLocale[token];

  if (typeof format === 'function') {
    return format(_date, _baseDate, _options, 'eeee p');
  }

  return format;
}