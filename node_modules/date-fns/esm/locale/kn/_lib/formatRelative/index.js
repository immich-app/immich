var formatRelativeLocale = {
  lastWeek: "'ಕಳೆದ' eeee p 'ಕ್ಕೆ'",
  yesterday: "'ನಿನ್ನೆ' p 'ಕ್ಕೆ'",
  today: "'ಇಂದು' p 'ಕ್ಕೆ'",
  tomorrow: "'ನಾಳೆ' p 'ಕ್ಕೆ'",
  nextWeek: "eeee p 'ಕ್ಕೆ'",
  other: 'P'
};
export default function formatRelative(token, _date, _baseDate, _options) {
  return formatRelativeLocale[token];
}