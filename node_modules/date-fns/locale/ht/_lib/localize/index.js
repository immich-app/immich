"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _index = _interopRequireDefault(require("../../../_lib/buildLocalizeFn/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eraValues = {
  narrow: ['av. J.-K', 'ap. J.-K'],
  abbreviated: ['av. J.-K', 'ap. J.-K'],
  wide: ['anvan Jezi Kris', 'apre Jezi Kris']
};
var quarterValues = {
  narrow: ['T1', 'T2', 'T3', 'T4'],
  abbreviated: ['1ye trim.', '2yèm trim.', '3yèm trim.', '4yèm trim.'],
  wide: ['1ye trimès', '2yèm trimès', '3yèm trimès', '4yèm trimès']
};
var monthValues = {
  narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'O', 'S', 'O', 'N', 'D'],
  abbreviated: ['janv.', 'fevr.', 'mas', 'avr.', 'me', 'jen', 'jiyè', 'out', 'sept.', 'okt.', 'nov.', 'des.'],
  wide: ['janvye', 'fevrye', 'mas', 'avril', 'me', 'jen', 'jiyè', 'out', 'septanm', 'oktòb', 'novanm', 'desanm']
};
var dayValues = {
  narrow: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  short: ['di', 'le', 'ma', 'mè', 'je', 'va', 'sa'],
  abbreviated: ['dim.', 'len.', 'mad.', 'mèk.', 'jed.', 'van.', 'sam.'],
  wide: ['dimanch', 'lendi', 'madi', 'mèkredi', 'jedi', 'vandredi', 'samdi']
};
var dayPeriodValues = {
  narrow: {
    am: 'AM',
    pm: 'PM',
    midnight: 'minwit',
    noon: 'midi',
    morning: 'mat.',
    afternoon: 'ap.m.',
    evening: 'swa',
    night: 'mat.'
  },
  abbreviated: {
    am: 'AM',
    pm: 'PM',
    midnight: 'minwit',
    noon: 'midi',
    morning: 'maten',
    afternoon: 'aprèmidi',
    evening: 'swa',
    night: 'maten'
  },
  wide: {
    am: 'AM',
    pm: 'PM',
    midnight: 'minwit',
    noon: 'midi',
    morning: 'nan maten',
    afternoon: 'nan aprèmidi',
    evening: 'nan aswè',
    night: 'nan maten'
  }
};

function ordinalNumber(dirtyNumber, dirtyOptions) {
  var number = Number(dirtyNumber);
  var options = dirtyOptions || {};
  var unit = String(options.unit);
  var suffix;

  if (number === 0) {
    return number;
  }

  if (unit === 'year' || unit === 'hour' || unit === 'week') {
    if (number === 1) {
      suffix = 'ye';
    } else {
      suffix = 'yèm';
    }
  } else {
    if (number === 1) {
      suffix = 'ye';
    } else {
      suffix = 'yèm';
    }
  }

  return number + suffix;
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
    defaultWidth: 'wide'
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