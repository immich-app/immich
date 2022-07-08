var formatRelativeLocale = {
  lastWeek: "'të' eeee 'e shkuar në' p",
  yesterday: "'dje në' p",
  today: "'sot në' p",
  tomorrow: "'nesër në' p",
  nextWeek: "eeee 'at' p",
  other: 'P'
};
export default function formatRelative(token, _date, _baseDate, _options) {
  return formatRelativeLocale[token];
}