"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _index = _interopRequireDefault(require("../../../_lib/buildLocalizeFn/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eraValues = {
  narrow: ['πΧ', 'μΧ'],
  abbreviated: ['π.Χ.', 'μ.Χ.'],
  wide: ['προ Χριστού', 'μετά Χριστόν']
};
var quarterValues = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['Τ1', 'Τ2', 'Τ3', 'Τ4'],
  wide: ['1ο τρίμηνο', '2ο τρίμηνο', '3ο τρίμηνο', '4ο τρίμηνο']
};
var monthValues = {
  narrow: ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'],
  abbreviated: ['Ιαν', 'Φεβ', 'Μάρ', 'Απρ', 'Μάι', 'Ιούν', 'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ'],
  wide: ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος']
};
var formattingMonthValues = {
  narrow: ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'],
  abbreviated: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'],
  wide: ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου']
};
var dayValues = {
  narrow: ['Κ', 'Δ', 'T', 'Τ', 'Π', 'Π', 'Σ'],
  short: ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πέ', 'Πα', 'Σά'],
  abbreviated: ['Κυρ', 'Δευ', 'Τρί', 'Τετ', 'Πέμ', 'Παρ', 'Σάβ'],
  wide: ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο']
};
var dayPeriodValues = {
  narrow: {
    am: 'πμ',
    pm: 'μμ',
    midnight: 'μεσάνυχτα',
    noon: 'μεσημέρι',
    morning: 'πρωί',
    afternoon: 'απόγευμα',
    evening: 'βράδυ',
    night: 'νύχτα'
  },
  abbreviated: {
    am: 'π.μ.',
    pm: 'μ.μ.',
    midnight: 'μεσάνυχτα',
    noon: 'μεσημέρι',
    morning: 'πρωί',
    afternoon: 'απόγευμα',
    evening: 'βράδυ',
    night: 'νύχτα'
  },
  wide: {
    am: 'π.μ.',
    pm: 'μ.μ.',
    midnight: 'μεσάνυχτα',
    noon: 'μεσημέρι',
    morning: 'πρωί',
    afternoon: 'απόγευμα',
    evening: 'βράδυ',
    night: 'νύχτα'
  }
};

function ordinalNumber(dirtyNumber, dirtyOptions) {
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var suffix;

  if (unit === 'year' || unit === 'month') {
    suffix = 'ος';
  } else if (unit === 'week' || unit === 'dayOfYear' || unit === 'day' || unit === 'hour' || unit === 'date') {
    suffix = 'η';
  } else {
    suffix = 'ο';
  }

  return dirtyNumber + suffix;
}

var localize = {
  ordinalNumber: ordinalNumber,
  era: (0, _index.default)({
    values: eraValues,
    defaultWidth: 'wide'
  }),
  quarter: (0, _index.default)({
    values: quarterValues,
    defaultWidth: 'wide',
    argumentCallback: function (quarter) {
      return Number(quarter) - 1;
    }
  }),
  month: (0, _index.default)({
    values: monthValues,
    defaultWidth: 'wide',
    formattingValues: formattingMonthValues,
    defaultFormattingWidth: 'wide'
  }),
  day: (0, _index.default)({
    values: dayValues,
    defaultWidth: 'wide'
  }),
  dayPeriod: (0, _index.default)({
    values: dayPeriodValues,
    defaultWidth: 'wide'
  })
};
var _default = localize;
exports.default = _default;
module.exports = exports.default;