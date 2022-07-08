"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _index = _interopRequireDefault(require("../../../_lib/buildLocalizeFn/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Ref: https://www.unicode.org/cldr/charts/32/summary/ta.html
var eraValues = {
  narrow: ['கி.மு.', 'கி.பி.'],
  abbreviated: ['கி.மு.', 'கி.பி.'],
  // CLDR #1624, #1626
  wide: ['கிறிஸ்துவுக்கு முன்', 'அன்னோ டோமினி'] // CLDR #1620, #1622

};
var quarterValues = {
  // CLDR #1644 - #1647
  narrow: ['1', '2', '3', '4'],
  // CLDR #1636 - #1639
  abbreviated: ['காலா.1', 'காலா.2', 'காலா.3', 'காலா.4'],
  // CLDR #1628 - #1631
  wide: ['ஒன்றாம் காலாண்டு', 'இரண்டாம் காலாண்டு', 'மூன்றாம் காலாண்டு', 'நான்காம் காலாண்டு']
};
var monthValues = {
  // CLDR #700 - #711
  narrow: ['ஜ', 'பி', 'மா', 'ஏ', 'மே', 'ஜூ', 'ஜூ', 'ஆ', 'செ', 'அ', 'ந', 'டி'],
  // CLDR #1676 - #1687
  abbreviated: ['ஜன.', 'பிப்.', 'மார்.', 'ஏப்.', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக.', 'செப்.', 'அக்.', 'நவ.', 'டிச.'],
  // CLDR #1652 - #1663
  wide: ['ஜனவரி', // January
  'பிப்ரவரி', // February
  'மார்ச்', // March
  'ஏப்ரல்', // April
  'மே', // May
  'ஜூன்', // June
  'ஜூலை', // July
  'ஆகஸ்ட்', // August
  'செப்டம்பர்', // September
  'அக்டோபர்', // October
  'நவம்பர்', // November
  'டிசம்பர்' // December
  ]
};
var dayValues = {
  // CLDR #1766 - #1772
  narrow: ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'],
  // CLDR #1752 - #1758
  short: ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'],
  // CLDR #1738 - #1744
  abbreviated: ['ஞாயி.', 'திங்.', 'செவ்.', 'புத.', 'வியா.', 'வெள்.', 'சனி'],
  // CLDR #1724 - #1730
  wide: ['ஞாயிறு', // Sunday
  'திங்கள்', // Monday
  'செவ்வாய்', // Tuesday
  'புதன்', // Wednesday
  'வியாழன்', // Thursday
  'வெள்ளி', // Friday
  'சனி' // Saturday
  ]
}; // CLDR #1780 - #1845

var dayPeriodValues = {
  narrow: {
    am: 'மு.ப',
    pm: 'பி.ப',
    midnight: 'நள்.',
    noon: 'நண்.',
    morning: 'கா.',
    afternoon: 'மதி.',
    evening: 'மா.',
    night: 'இர.'
  },
  abbreviated: {
    am: 'முற்பகல்',
    pm: 'பிற்பகல்',
    midnight: 'நள்ளிரவு',
    noon: 'நண்பகல்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  },
  wide: {
    am: 'முற்பகல்',
    pm: 'பிற்பகல்',
    midnight: 'நள்ளிரவு',
    noon: 'நண்பகல்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  }
}; // CLDR #1780 - #1845

var formattingDayPeriodValues = {
  narrow: {
    am: 'மு.ப',
    pm: 'பி.ப',
    midnight: 'நள்.',
    noon: 'நண்.',
    morning: 'கா.',
    afternoon: 'மதி.',
    evening: 'மா.',
    night: 'இர.'
  },
  abbreviated: {
    am: 'முற்பகல்',
    pm: 'பிற்பகல்',
    midnight: 'நள்ளிரவு',
    noon: 'நண்பகல்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  },
  wide: {
    am: 'முற்பகல்',
    pm: 'பிற்பகல்',
    midnight: 'நள்ளிரவு',
    noon: 'நண்பகல்',
    morning: 'காலை',
    afternoon: 'மதியம்',
    evening: 'மாலை',
    night: 'இரவு'
  }
};

function ordinalNumber(dirtyNumber, _dirtyOptions) {
  var number = Number(dirtyNumber); // If ordinal numbers depend on context, for example,
  // if they are different for different grammatical genders,
  // use `options.unit`:
  //
  //   var options = dirtyOptions || {}
  //   var unit = String(options.unit)
  //
  // where `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
  // 'day', 'hour', 'minute', 'second'
  // var rem100 = number % 100
  // if (rem100 > 20 || rem100 < 10) {
  //   switch (rem100 % 10) {
  //     case 1:
  //       return number + 'st'
  //     case 2:
  //       return number + 'nd'
  //     case 3:
  //       return number + 'rd'
  //   }
  // }
  // return number + 'th'

  return number;
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
    defaultWidth: 'wide',
    formattingValues: formattingDayPeriodValues,
    defaultFormattingWidth: 'wide'
  })
};
var _default = localize;
exports.default = _default;
module.exports = exports.default;