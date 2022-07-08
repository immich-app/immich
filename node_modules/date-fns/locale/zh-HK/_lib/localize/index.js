"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _index = _interopRequireDefault(require("../../../_lib/buildLocalizeFn/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var eraValues = {
  narrow: ['前', '公元'],
  abbreviated: ['前', '公元'],
  wide: ['公元前', '公元']
};
var quarterValues = {
  narrow: ['1', '2', '3', '4'],
  abbreviated: ['第一季', '第二季', '第三季', '第四季'],
  wide: ['第一季度', '第二季度', '第三季度', '第四季度']
};
var monthValues = {
  narrow: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
  abbreviated: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  wide: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
};
var dayValues = {
  narrow: ['日', '一', '二', '三', '四', '五', '六'],
  short: ['日', '一', '二', '三', '四', '五', '六'],
  abbreviated: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'],
  wide: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
};
var dayPeriodValues = {
  narrow: {
    am: '上',
    pm: '下',
    midnight: '午夜',
    noon: '晌',
    morning: '早',
    afternoon: '午',
    evening: '晚',
    night: '夜'
  },
  abbreviated: {
    am: '上午',
    pm: '下午',
    midnight: '午夜',
    noon: '中午',
    morning: '上午',
    afternoon: '下午',
    evening: '晚上',
    night: '夜晚'
  },
  wide: {
    am: '上午',
    pm: '下午',
    midnight: '午夜',
    noon: '中午',
    morning: '上午',
    afternoon: '下午',
    evening: '晚上',
    night: '夜晚'
  }
};
var formattingDayPeriodValues = {
  narrow: {
    am: '上',
    pm: '下',
    midnight: '午夜',
    noon: '晌',
    morning: '早',
    afternoon: '午',
    evening: '晚',
    night: '夜'
  },
  abbreviated: {
    am: '上午',
    pm: '下午',
    midnight: '午夜',
    noon: '中午',
    morning: '上午',
    afternoon: '下午',
    evening: '晚上',
    night: '夜晚'
  },
  wide: {
    am: '上午',
    pm: '下午',
    midnight: '午夜',
    noon: '中午',
    morning: '上午',
    afternoon: '下午',
    evening: '晚上',
    night: '夜晚'
  }
};

function ordinalNumber(dirtyNumber, dirtyOptions) {
  var number = Number(dirtyNumber); // If ordinal numbers depend on context, for example,
  // if they are different for different grammatical genders,
  // use `options.unit`:
  //
  //   var options = dirtyOptions || {}
  //   var unit = String(options.unit)
  //
  // where `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
  // 'day', 'hour', 'minute', 'second'

  var options = dirtyOptions || {};
  var unit = String(options.unit);

  switch (unit) {
    case 'date':
      return number.toString() + '日';

    case 'hour':
      return number.toString() + '時';

    case 'minute':
      return number.toString() + '分';

    case 'second':
      return number.toString() + '秒';

    default:
      return '第 ' + number.toString();
  }
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