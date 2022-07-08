var formatRelativeLocale = {
  lastWeek: "eeee 'گذشته در' p",
  yesterday: "'دیروز در' p",
  today: "'امروز در' p",
  tomorrow: "'فردا در' p",
  nextWeek: "eeee 'در' p",
  other: 'P'
};
export default function formatRelative(token, _date, _baseDate, _options) {
  return formatRelativeLocale[token];
}