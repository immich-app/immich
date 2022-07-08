var formatRelativeLocale = {
  lastWeek: "'vorige' eeee 'om' p",
  yesterday: "'gisteren om' p",
  today: "'vandaag om' p",
  tomorrow: "'morgen om' p",
  nextWeek: "eeee 'om' p",
  other: 'P'
};
export default function formatRelative(token, _date, _baseDate, _options) {
  return formatRelativeLocale[token];
}