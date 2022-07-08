var formatRelativeLocale = {
  lastWeek: "'ўтган' eeee p 'да'",
  yesterday: "'кеча' p 'да'",
  today: "'бугун' p 'да'",
  tomorrow: "'эртага' p 'да'",
  nextWeek: "eeee p 'да'",
  other: 'P'
};
export default function formatRelative(token, _date, _baseDate, _options) {
  return formatRelativeLocale[token];
}