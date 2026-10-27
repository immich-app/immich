import { createRequire as __prettierCreateRequire } from "module";
import { fileURLToPath as __prettierFileUrlToPath } from "url";
import { dirname as __prettierDirname } from "path";
const require = __prettierCreateRequire(import.meta.url);
const __filename = __prettierFileUrlToPath(import.meta.url);
const __dirname = __prettierDirname(__filename);

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key2, value) => __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// node_modules/fast-glob/out/utils/array.js
var require_array = __commonJS({
  "node_modules/fast-glob/out/utils/array.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.splitWhen = exports.flatten = void 0;
    function flatten(items) {
      return items.reduce((collection, item) => [].concat(collection, item), []);
    }
    exports.flatten = flatten;
    function splitWhen(items, predicate) {
      const result = [[]];
      let groupIndex = 0;
      for (const item of items) {
        if (predicate(item)) {
          groupIndex++;
          result[groupIndex] = [];
        } else {
          result[groupIndex].push(item);
        }
      }
      return result;
    }
    exports.splitWhen = splitWhen;
  }
});

// node_modules/fast-glob/out/utils/errno.js
var require_errno = __commonJS({
  "node_modules/fast-glob/out/utils/errno.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isEnoentCodeError = void 0;
    function isEnoentCodeError(error) {
      return error.code === "ENOENT";
    }
    exports.isEnoentCodeError = isEnoentCodeError;
  }
});

// node_modules/fast-glob/out/utils/fs.js
var require_fs = __commonJS({
  "node_modules/fast-glob/out/utils/fs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDirentFromStats = void 0;
    var DirentFromStats = class {
      constructor(name, stats) {
        this.name = name;
        this.isBlockDevice = stats.isBlockDevice.bind(stats);
        this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
        this.isDirectory = stats.isDirectory.bind(stats);
        this.isFIFO = stats.isFIFO.bind(stats);
        this.isFile = stats.isFile.bind(stats);
        this.isSocket = stats.isSocket.bind(stats);
        this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
      }
    };
    function createDirentFromStats(name, stats) {
      return new DirentFromStats(name, stats);
    }
    exports.createDirentFromStats = createDirentFromStats;
  }
});

// node_modules/fast-glob/out/utils/path.js
var require_path = __commonJS({
  "node_modules/fast-glob/out/utils/path.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertPosixPathToPattern = exports.convertWindowsPathToPattern = exports.convertPathToPattern = exports.escapePosixPath = exports.escapeWindowsPath = exports.escape = exports.removeLeadingDotSegment = exports.makeAbsolute = exports.unixify = void 0;
    var os = __require("os");
    var path17 = __require("path");
    var IS_WINDOWS_PLATFORM = os.platform() === "win32";
    var LEADING_DOT_SEGMENT_CHARACTERS_COUNT = 2;
    var POSIX_UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\()|\\(?![!()*+?@[\]{|}]))/g;
    var WINDOWS_UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()[\]{}]|^!|[!+@](?=\())/g;
    var DOS_DEVICE_PATH_RE = /^\\\\([.?])/;
    var WINDOWS_BACKSLASHES_RE = /\\(?![!()+@[\]{}])/g;
    function unixify(filepath) {
      return filepath.replace(/\\/g, "/");
    }
    exports.unixify = unixify;
    function makeAbsolute(cwd, filepath) {
      return path17.resolve(cwd, filepath);
    }
    exports.makeAbsolute = makeAbsolute;
    function removeLeadingDotSegment(entry) {
      if (entry.charAt(0) === ".") {
        const secondCharactery = entry.charAt(1);
        if (secondCharactery === "/" || secondCharactery === "\\") {
          return entry.slice(LEADING_DOT_SEGMENT_CHARACTERS_COUNT);
        }
      }
      return entry;
    }
    exports.removeLeadingDotSegment = removeLeadingDotSegment;
    exports.escape = IS_WINDOWS_PLATFORM ? escapeWindowsPath : escapePosixPath;
    function escapeWindowsPath(pattern) {
      return pattern.replace(WINDOWS_UNESCAPED_GLOB_SYMBOLS_RE, "\\$2");
    }
    exports.escapeWindowsPath = escapeWindowsPath;
    function escapePosixPath(pattern) {
      return pattern.replace(POSIX_UNESCAPED_GLOB_SYMBOLS_RE, "\\$2");
    }
    exports.escapePosixPath = escapePosixPath;
    exports.convertPathToPattern = IS_WINDOWS_PLATFORM ? convertWindowsPathToPattern : convertPosixPathToPattern;
    function convertWindowsPathToPattern(filepath) {
      return escapeWindowsPath(filepath).replace(DOS_DEVICE_PATH_RE, "//$1").replace(WINDOWS_BACKSLASHES_RE, "/");
    }
    exports.convertWindowsPathToPattern = convertWindowsPathToPattern;
    function convertPosixPathToPattern(filepath) {
      return escapePosixPath(filepath);
    }
    exports.convertPosixPathToPattern = convertPosixPathToPattern;
  }
});

// node_modules/is-extglob/index.js
var require_is_extglob = __commonJS({
  "node_modules/is-extglob/index.js"(exports, module) {
    module.exports = function isExtglob(str) {
      if (typeof str !== "string" || str === "") {
        return false;
      }
      var match2;
      while (match2 = /(\\).|([@?!+*]\(.*\))/g.exec(str)) {
        if (match2[2]) return true;
        str = str.slice(match2.index + match2[0].length);
      }
      return false;
    };
  }
});

// node_modules/is-glob/index.js
var require_is_glob = __commonJS({
  "node_modules/is-glob/index.js"(exports, module) {
    var isExtglob = require_is_extglob();
    var chars = { "{": "}", "(": ")", "[": "]" };
    var strictCheck = function(str) {
      if (str[0] === "!") {
        return true;
      }
      var index = 0;
      var pipeIndex = -2;
      var closeSquareIndex = -2;
      var closeCurlyIndex = -2;
      var closeParenIndex = -2;
      var backSlashIndex = -2;
      while (index < str.length) {
        if (str[index] === "*") {
          return true;
        }
        if (str[index + 1] === "?" && /[\].+)]/.test(str[index])) {
          return true;
        }
        if (closeSquareIndex !== -1 && str[index] === "[" && str[index + 1] !== "]") {
          if (closeSquareIndex < index) {
            closeSquareIndex = str.indexOf("]", index);
          }
          if (closeSquareIndex > index) {
            if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
              return true;
            }
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
              return true;
            }
          }
        }
        if (closeCurlyIndex !== -1 && str[index] === "{" && str[index + 1] !== "}") {
          closeCurlyIndex = str.indexOf("}", index);
          if (closeCurlyIndex > index) {
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeCurlyIndex) {
              return true;
            }
          }
        }
        if (closeParenIndex !== -1 && str[index] === "(" && str[index + 1] === "?" && /[:!=]/.test(str[index + 2]) && str[index + 3] !== ")") {
          closeParenIndex = str.indexOf(")", index);
          if (closeParenIndex > index) {
            backSlashIndex = str.indexOf("\\", index);
            if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
              return true;
            }
          }
        }
        if (pipeIndex !== -1 && str[index] === "(" && str[index + 1] !== "|") {
          if (pipeIndex < index) {
            pipeIndex = str.indexOf("|", index);
          }
          if (pipeIndex !== -1 && str[pipeIndex + 1] !== ")") {
            closeParenIndex = str.indexOf(")", pipeIndex);
            if (closeParenIndex > pipeIndex) {
              backSlashIndex = str.indexOf("\\", pipeIndex);
              if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
                return true;
              }
            }
          }
        }
        if (str[index] === "\\") {
          var open = str[index + 1];
          index += 2;
          var close = chars[open];
          if (close) {
            var n = str.indexOf(close, index);
            if (n !== -1) {
              index = n + 1;
            }
          }
          if (str[index] === "!") {
            return true;
          }
        } else {
          index++;
        }
      }
      return false;
    };
    var relaxedCheck = function(str) {
      if (str[0] === "!") {
        return true;
      }
      var index = 0;
      while (index < str.length) {
        if (/[*?{}()[\]]/.test(str[index])) {
          return true;
        }
        if (str[index] === "\\") {
          var open = str[index + 1];
          index += 2;
          var close = chars[open];
          if (close) {
            var n = str.indexOf(close, index);
            if (n !== -1) {
              index = n + 1;
            }
          }
          if (str[index] === "!") {
            return true;
          }
        } else {
          index++;
        }
      }
      return false;
    };
    module.exports = function isGlob(str, options7) {
      if (typeof str !== "string" || str === "") {
        return false;
      }
      if (isExtglob(str)) {
        return true;
      }
      var check2 = strictCheck;
      if (options7 && options7.strict === false) {
        check2 = relaxedCheck;
      }
      return check2(str);
    };
  }
});

// node_modules/fast-glob/node_modules/glob-parent/index.js
var require_glob_parent = __commonJS({
  "node_modules/fast-glob/node_modules/glob-parent/index.js"(exports, module) {
    "use strict";
    var isGlob = require_is_glob();
    var pathPosixDirname = __require("path").posix.dirname;
    var isWin32 = __require("os").platform() === "win32";
    var slash2 = "/";
    var backslash = /\\/g;
    var enclosure = /[\{\[].*[\}\]]$/;
    var globby = /(^|[^\\])([\{\[]|\([^\)]+$)/;
    var escaped = /\\([\!\*\?\|\[\]\(\)\{\}])/g;
    module.exports = function globParent(str, opts2) {
      var options7 = Object.assign({ flipBackslashes: true }, opts2);
      if (options7.flipBackslashes && isWin32 && str.indexOf(slash2) < 0) {
        str = str.replace(backslash, slash2);
      }
      if (enclosure.test(str)) {
        str += slash2;
      }
      str += "a";
      do {
        str = pathPosixDirname(str);
      } while (isGlob(str) || globby.test(str));
      return str.replace(escaped, "$1");
    };
  }
});

// node_modules/braces/lib/utils.js
var require_utils = __commonJS({
  "node_modules/braces/lib/utils.js"(exports) {
    "use strict";
    exports.isInteger = (num) => {
      if (typeof num === "number") {
        return Number.isInteger(num);
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isInteger(Number(num));
      }
      return false;
    };
    exports.find = (node, type) => node.nodes.find((node2) => node2.type === type);
    exports.exceedsLimit = (min, max, step = 1, limit) => {
      if (limit === false) return false;
      if (!exports.isInteger(min) || !exports.isInteger(max)) return false;
      return (Number(max) - Number(min)) / Number(step) >= limit;
    };
    exports.escapeNode = (block, n = 0, type) => {
      const node = block.nodes[n];
      if (!node) return;
      if (type && node.type === type || node.type === "open" || node.type === "close") {
        if (node.escaped !== true) {
          node.value = "\\" + node.value;
          node.escaped = true;
        }
      }
    };
    exports.encloseBrace = (node) => {
      if (node.type !== "brace") return false;
      if (node.commas >> 0 + node.ranges >> 0 === 0) {
        node.invalid = true;
        return true;
      }
      return false;
    };
    exports.isInvalidBrace = (block) => {
      if (block.type !== "brace") return false;
      if (block.invalid === true || block.dollar) return true;
      if (block.commas >> 0 + block.ranges >> 0 === 0) {
        block.invalid = true;
        return true;
      }
      if (block.open !== true || block.close !== true) {
        block.invalid = true;
        return true;
      }
      return false;
    };
    exports.isOpenOrClose = (node) => {
      if (node.type === "open" || node.type === "close") {
        return true;
      }
      return node.open === true || node.close === true;
    };
    exports.reduce = (nodes) => nodes.reduce((acc, node) => {
      if (node.type === "text") acc.push(node.value);
      if (node.type === "range") node.type = "text";
      return acc;
    }, []);
    exports.flatten = (...args) => {
      const result = [];
      const flat = (arr) => {
        for (let i = 0; i < arr.length; i++) {
          const ele = arr[i];
          if (Array.isArray(ele)) {
            flat(ele);
            continue;
          }
          if (ele !== void 0) {
            result.push(ele);
          }
        }
        return result;
      };
      flat(args);
      return result;
    };
  }
});

// node_modules/braces/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/braces/lib/stringify.js"(exports, module) {
    "use strict";
    var utils = require_utils();
    module.exports = (ast, options7 = {}) => {
      const stringify2 = (node, parent = {}) => {
        const invalidBlock = options7.escapeInvalid && utils.isInvalidBrace(parent);
        const invalidNode = node.invalid === true && options7.escapeInvalid === true;
        let output = "";
        if (node.value) {
          if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
            return "\\" + node.value;
          }
          return node.value;
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes) {
          for (const child of node.nodes) {
            output += stringify2(child);
          }
        }
        return output;
      };
      return stringify2(ast);
    };
  }
});

// node_modules/is-number/index.js
var require_is_number = __commonJS({
  "node_modules/is-number/index.js"(exports, module) {
    "use strict";
    module.exports = function(num) {
      if (typeof num === "number") {
        return num - num === 0;
      }
      if (typeof num === "string" && num.trim() !== "") {
        return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
      }
      return false;
    };
  }
});

// node_modules/to-regex-range/index.js
var require_to_regex_range = __commonJS({
  "node_modules/to-regex-range/index.js"(exports, module) {
    "use strict";
    var isNumber = require_is_number();
    var toRegexRange = (min, max, options7) => {
      if (isNumber(min) === false) {
        throw new TypeError("toRegexRange: expected the first argument to be a number");
      }
      if (max === void 0 || min === max) {
        return String(min);
      }
      if (isNumber(max) === false) {
        throw new TypeError("toRegexRange: expected the second argument to be a number.");
      }
      let opts2 = { relaxZeros: true, ...options7 };
      if (typeof opts2.strictZeros === "boolean") {
        opts2.relaxZeros = opts2.strictZeros === false;
      }
      let relax = String(opts2.relaxZeros);
      let shorthand = String(opts2.shorthand);
      let capture = String(opts2.capture);
      let wrap = String(opts2.wrap);
      let cacheKey = min + ":" + max + "=" + relax + shorthand + capture + wrap;
      if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
        return toRegexRange.cache[cacheKey].result;
      }
      let a = Math.min(min, max);
      let b = Math.max(min, max);
      if (Math.abs(a - b) === 1) {
        let result = min + "|" + max;
        if (opts2.capture) {
          return `(${result})`;
        }
        if (opts2.wrap === false) {
          return result;
        }
        return `(?:${result})`;
      }
      let isPadded2 = hasPadding(min) || hasPadding(max);
      let state = { min, max, a, b };
      let positives = [];
      let negatives = [];
      if (isPadded2) {
        state.isPadded = isPadded2;
        state.maxLen = String(state.max).length;
      }
      if (a < 0) {
        let newMin = b < 0 ? Math.abs(b) : 1;
        negatives = splitToPatterns(newMin, Math.abs(a), state, opts2);
        a = state.a = 0;
      }
      if (b >= 0) {
        positives = splitToPatterns(a, b, state, opts2);
      }
      state.negatives = negatives;
      state.positives = positives;
      state.result = collatePatterns(negatives, positives, opts2);
      if (opts2.capture === true) {
        state.result = `(${state.result})`;
      } else if (opts2.wrap !== false && positives.length + negatives.length > 1) {
        state.result = `(?:${state.result})`;
      }
      toRegexRange.cache[cacheKey] = state;
      return state.result;
    };
    function collatePatterns(neg, pos2, options7) {
      let onlyNegative = filterPatterns(neg, pos2, "-", false, options7) || [];
      let onlyPositive = filterPatterns(pos2, neg, "", false, options7) || [];
      let intersected = filterPatterns(neg, pos2, "-?", true, options7) || [];
      let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
      return subpatterns.join("|");
    }
    function splitToRanges(min, max) {
      let nines = 1;
      let zeros = 1;
      let stop = countNines(min, nines);
      let stops = /* @__PURE__ */ new Set([max]);
      while (min <= stop && stop <= max) {
        stops.add(stop);
        nines += 1;
        stop = countNines(min, nines);
      }
      stop = countZeros(max + 1, zeros) - 1;
      while (min < stop && stop <= max) {
        stops.add(stop);
        zeros += 1;
        stop = countZeros(max + 1, zeros) - 1;
      }
      stops = [...stops];
      stops.sort(compare);
      return stops;
    }
    function rangeToPattern(start, stop, options7) {
      if (start === stop) {
        return { pattern: start, count: [], digits: 0 };
      }
      let zipped = zip(start, stop);
      let digits = zipped.length;
      let pattern = "";
      let count = 0;
      for (let i = 0; i < digits; i++) {
        let [startDigit, stopDigit] = zipped[i];
        if (startDigit === stopDigit) {
          pattern += startDigit;
        } else if (startDigit !== "0" || stopDigit !== "9") {
          pattern += toCharacterClass(startDigit, stopDigit, options7);
        } else {
          count++;
        }
      }
      if (count) {
        pattern += options7.shorthand === true ? "\\d" : "[0-9]";
      }
      return { pattern, count: [count], digits };
    }
    function splitToPatterns(min, max, tok, options7) {
      let ranges = splitToRanges(min, max);
      let tokens = [];
      let start = min;
      let prev;
      for (let i = 0; i < ranges.length; i++) {
        let max2 = ranges[i];
        let obj = rangeToPattern(String(start), String(max2), options7);
        let zeros = "";
        if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
          if (prev.count.length > 1) {
            prev.count.pop();
          }
          prev.count.push(obj.count[0]);
          prev.string = prev.pattern + toQuantifier(prev.count);
          start = max2 + 1;
          continue;
        }
        if (tok.isPadded) {
          zeros = padZeros(max2, tok, options7);
        }
        obj.string = zeros + obj.pattern + toQuantifier(obj.count);
        tokens.push(obj);
        start = max2 + 1;
        prev = obj;
      }
      return tokens;
    }
    function filterPatterns(arr, comparison, prefix, intersection, options7) {
      let result = [];
      for (let ele of arr) {
        let { string } = ele;
        if (!intersection && !contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
        if (intersection && contains(comparison, "string", string)) {
          result.push(prefix + string);
        }
      }
      return result;
    }
    function zip(a, b) {
      let arr = [];
      for (let i = 0; i < a.length; i++) arr.push([a[i], b[i]]);
      return arr;
    }
    function compare(a, b) {
      return a > b ? 1 : b > a ? -1 : 0;
    }
    function contains(arr, key2, val) {
      return arr.some((ele) => ele[key2] === val);
    }
    function countNines(min, len) {
      return Number(String(min).slice(0, -len) + "9".repeat(len));
    }
    function countZeros(integer, zeros) {
      return integer - integer % Math.pow(10, zeros);
    }
    function toQuantifier(digits) {
      let [start = 0, stop = ""] = digits;
      if (stop || start > 1) {
        return `{${start + (stop ? "," + stop : "")}}`;
      }
      return "";
    }
    function toCharacterClass(a, b, options7) {
      return `[${a}${b - a === 1 ? "" : "-"}${b}]`;
    }
    function hasPadding(str) {
      return /^-?(0+)\d/.test(str);
    }
    function padZeros(value, tok, options7) {
      if (!tok.isPadded) {
        return value;
      }
      let diff = Math.abs(tok.maxLen - String(value).length);
      let relax = options7.relaxZeros !== false;
      switch (diff) {
        case 0:
          return "";
        case 1:
          return relax ? "0?" : "0";
        case 2:
          return relax ? "0{0,2}" : "00";
        default: {
          return relax ? `0{0,${diff}}` : `0{${diff}}`;
        }
      }
    }
    toRegexRange.cache = {};
    toRegexRange.clearCache = () => toRegexRange.cache = {};
    module.exports = toRegexRange;
  }
});

// node_modules/fill-range/index.js
var require_fill_range = __commonJS({
  "node_modules/fill-range/index.js"(exports, module) {
    "use strict";
    var util3 = __require("util");
    var toRegexRange = require_to_regex_range();
    var isObject2 = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    var transform = (toNumber) => {
      return (value) => toNumber === true ? Number(value) : String(value);
    };
    var isValidValue = (value) => {
      return typeof value === "number" || typeof value === "string" && value !== "";
    };
    var isNumber = (num) => Number.isInteger(+num);
    var zeros = (input) => {
      let value = `${input}`;
      let index = -1;
      if (value[0] === "-") value = value.slice(1);
      if (value === "0") return false;
      while (value[++index] === "0") ;
      return index > 0;
    };
    var stringify2 = (start, end, options7) => {
      if (typeof start === "string" || typeof end === "string") {
        return true;
      }
      return options7.stringify === true;
    };
    var pad = (input, maxLength, toNumber) => {
      if (maxLength > 0) {
        let dash = input[0] === "-" ? "-" : "";
        if (dash) input = input.slice(1);
        input = dash + input.padStart(dash ? maxLength - 1 : maxLength, "0");
      }
      if (toNumber === false) {
        return String(input);
      }
      return input;
    };
    var toMaxLen = (input, maxLength) => {
      let negative = input[0] === "-" ? "-" : "";
      if (negative) {
        input = input.slice(1);
        maxLength--;
      }
      while (input.length < maxLength) input = "0" + input;
      return negative ? "-" + input : input;
    };
    var toSequence = (parts, options7, maxLen) => {
      parts.negatives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      parts.positives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
      let prefix = options7.capture ? "" : "?:";
      let positives = "";
      let negatives = "";
      let result;
      if (parts.positives.length) {
        positives = parts.positives.map((v) => toMaxLen(String(v), maxLen)).join("|");
      }
      if (parts.negatives.length) {
        negatives = `-(${prefix}${parts.negatives.map((v) => toMaxLen(String(v), maxLen)).join("|")})`;
      }
      if (positives && negatives) {
        result = `${positives}|${negatives}`;
      } else {
        result = positives || negatives;
      }
      if (options7.wrap) {
        return `(${prefix}${result})`;
      }
      return result;
    };
    var toRange = (a, b, isNumbers, options7) => {
      if (isNumbers) {
        return toRegexRange(a, b, { wrap: false, ...options7 });
      }
      let start = String.fromCharCode(a);
      if (a === b) return start;
      let stop = String.fromCharCode(b);
      return `[${start}-${stop}]`;
    };
    var toRegex = (start, end, options7) => {
      if (Array.isArray(start)) {
        let wrap = options7.wrap === true;
        let prefix = options7.capture ? "" : "?:";
        return wrap ? `(${prefix}${start.join("|")})` : start.join("|");
      }
      return toRegexRange(start, end, options7);
    };
    var rangeError = (...args) => {
      return new RangeError("Invalid range arguments: " + util3.inspect(...args));
    };
    var invalidRange = (start, end, options7) => {
      if (options7.strictRanges === true) throw rangeError([start, end]);
      return [];
    };
    var invalidStep = (step, options7) => {
      if (options7.strictRanges === true) {
        throw new TypeError(`Expected step "${step}" to be a number`);
      }
      return [];
    };
    var fillNumbers = (start, end, step = 1, options7 = {}) => {
      let a = Number(start);
      let b = Number(end);
      if (!Number.isInteger(a) || !Number.isInteger(b)) {
        if (options7.strictRanges === true) throw rangeError([start, end]);
        return [];
      }
      if (a === 0) a = 0;
      if (b === 0) b = 0;
      let descending = a > b;
      let startString = String(start);
      let endString = String(end);
      let stepString = String(step);
      step = Math.max(Math.abs(step), 1);
      let padded = zeros(startString) || zeros(endString) || zeros(stepString);
      let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
      let toNumber = padded === false && stringify2(start, end, options7) === false;
      let format3 = options7.transform || transform(toNumber);
      if (options7.toRegex && step === 1) {
        return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options7);
      }
      let parts = { negatives: [], positives: [] };
      let push2 = (num) => parts[num < 0 ? "negatives" : "positives"].push(Math.abs(num));
      let range2 = [];
      let index = 0;
      while (descending ? a >= b : a <= b) {
        if (options7.toRegex === true && step > 1) {
          push2(a);
        } else {
          range2.push(pad(format3(a, index), maxLen, toNumber));
        }
        a = descending ? a - step : a + step;
        index++;
      }
      if (options7.toRegex === true) {
        return step > 1 ? toSequence(parts, options7, maxLen) : toRegex(range2, null, { wrap: false, ...options7 });
      }
      return range2;
    };
    var fillLetters = (start, end, step = 1, options7 = {}) => {
      if (!isNumber(start) && start.length > 1 || !isNumber(end) && end.length > 1) {
        return invalidRange(start, end, options7);
      }
      let format3 = options7.transform || ((val) => String.fromCharCode(val));
      let a = `${start}`.charCodeAt(0);
      let b = `${end}`.charCodeAt(0);
      let descending = a > b;
      let min = Math.min(a, b);
      let max = Math.max(a, b);
      if (options7.toRegex && step === 1) {
        return toRange(min, max, false, options7);
      }
      let range2 = [];
      let index = 0;
      while (descending ? a >= b : a <= b) {
        range2.push(format3(a, index));
        a = descending ? a - step : a + step;
        index++;
      }
      if (options7.toRegex === true) {
        return toRegex(range2, null, { wrap: false, options: options7 });
      }
      return range2;
    };
    var fill = (start, end, step, options7 = {}) => {
      if (end == null && isValidValue(start)) {
        return [start];
      }
      if (!isValidValue(start) || !isValidValue(end)) {
        return invalidRange(start, end, options7);
      }
      if (typeof step === "function") {
        return fill(start, end, 1, { transform: step });
      }
      if (isObject2(step)) {
        return fill(start, end, 0, step);
      }
      let opts2 = { ...options7 };
      if (opts2.capture === true) opts2.wrap = true;
      step = step || opts2.step || 1;
      if (!isNumber(step)) {
        if (step != null && !isObject2(step)) return invalidStep(step, opts2);
        return fill(start, end, 1, step);
      }
      if (isNumber(start) && isNumber(end)) {
        return fillNumbers(start, end, step, opts2);
      }
      return fillLetters(start, end, Math.max(Math.abs(step), 1), opts2);
    };
    module.exports = fill;
  }
});

// node_modules/braces/lib/compile.js
var require_compile = __commonJS({
  "node_modules/braces/lib/compile.js"(exports, module) {
    "use strict";
    var fill = require_fill_range();
    var utils = require_utils();
    var compile = (ast, options7 = {}) => {
      const walk = (node, parent = {}) => {
        const invalidBlock = utils.isInvalidBrace(parent);
        const invalidNode = node.invalid === true && options7.escapeInvalid === true;
        const invalid = invalidBlock === true || invalidNode === true;
        const prefix = options7.escapeInvalid === true ? "\\" : "";
        let output = "";
        if (node.isOpen === true) {
          return prefix + node.value;
        }
        if (node.isClose === true) {
          console.log("node.isClose", prefix, node.value);
          return prefix + node.value;
        }
        if (node.type === "open") {
          return invalid ? prefix + node.value : "(";
        }
        if (node.type === "close") {
          return invalid ? prefix + node.value : ")";
        }
        if (node.type === "comma") {
          return node.prev.type === "comma" ? "" : invalid ? node.value : "|";
        }
        if (node.value) {
          return node.value;
        }
        if (node.nodes && node.ranges > 0) {
          const args = utils.reduce(node.nodes);
          const range2 = fill(...args, { ...options7, wrap: false, toRegex: true, strictZeros: true });
          if (range2.length !== 0) {
            return args.length > 1 && range2.length > 1 ? `(${range2})` : range2;
          }
        }
        if (node.nodes) {
          for (const child of node.nodes) {
            output += walk(child, node);
          }
        }
        return output;
      };
      return walk(ast);
    };
    module.exports = compile;
  }
});

// node_modules/braces/lib/expand.js
var require_expand = __commonJS({
  "node_modules/braces/lib/expand.js"(exports, module) {
    "use strict";
    var fill = require_fill_range();
    var stringify2 = require_stringify();
    var utils = require_utils();
    var append = (queue = "", stash = "", enclose = false) => {
      const result = [];
      queue = [].concat(queue);
      stash = [].concat(stash);
      if (!stash.length) return queue;
      if (!queue.length) {
        return enclose ? utils.flatten(stash).map((ele) => `{${ele}}`) : stash;
      }
      for (const item of queue) {
        if (Array.isArray(item)) {
          for (const value of item) {
            result.push(append(value, stash, enclose));
          }
        } else {
          for (let ele of stash) {
            if (enclose === true && typeof ele === "string") ele = `{${ele}}`;
            result.push(Array.isArray(ele) ? append(item, ele, enclose) : item + ele);
          }
        }
      }
      return utils.flatten(result);
    };
    var expand2 = (ast, options7 = {}) => {
      const rangeLimit = options7.rangeLimit === void 0 ? 1e3 : options7.rangeLimit;
      const walk = (node, parent = {}) => {
        node.queue = [];
        let p = parent;
        let q = parent.queue;
        while (p.type !== "brace" && p.type !== "root" && p.parent) {
          p = p.parent;
          q = p.queue;
        }
        if (node.invalid || node.dollar) {
          q.push(append(q.pop(), stringify2(node, options7)));
          return;
        }
        if (node.type === "brace" && node.invalid !== true && node.nodes.length === 2) {
          q.push(append(q.pop(), ["{}"]));
          return;
        }
        if (node.nodes && node.ranges > 0) {
          const args = utils.reduce(node.nodes);
          if (utils.exceedsLimit(...args, options7.step, rangeLimit)) {
            throw new RangeError("expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.");
          }
          let range2 = fill(...args, options7);
          if (range2.length === 0) {
            range2 = stringify2(node, options7);
          }
          q.push(append(q.pop(), range2));
          node.nodes = [];
          return;
        }
        const enclose = utils.encloseBrace(node);
        let queue = node.queue;
        let block = node;
        while (block.type !== "brace" && block.type !== "root" && block.parent) {
          block = block.parent;
          queue = block.queue;
        }
        for (let i = 0; i < node.nodes.length; i++) {
          const child = node.nodes[i];
          if (child.type === "comma" && node.type === "brace") {
            if (i === 1) queue.push("");
            queue.push("");
            continue;
          }
          if (child.type === "close") {
            q.push(append(q.pop(), queue, enclose));
            continue;
          }
          if (child.value && child.type !== "open") {
            queue.push(append(queue.pop(), child.value));
            continue;
          }
          if (child.nodes) {
            walk(child, node);
          }
        }
        return queue;
      };
      return utils.flatten(walk(ast));
    };
    module.exports = expand2;
  }
});

// node_modules/braces/lib/constants.js
var require_constants = __commonJS({
  "node_modules/braces/lib/constants.js"(exports, module) {
    "use strict";
    module.exports = {
      MAX_LENGTH: 1e4,
      // Digits
      CHAR_0: "0",
      /* 0 */
      CHAR_9: "9",
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: "A",
      /* A */
      CHAR_LOWERCASE_A: "a",
      /* a */
      CHAR_UPPERCASE_Z: "Z",
      /* Z */
      CHAR_LOWERCASE_Z: "z",
      /* z */
      CHAR_LEFT_PARENTHESES: "(",
      /* ( */
      CHAR_RIGHT_PARENTHESES: ")",
      /* ) */
      CHAR_ASTERISK: "*",
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: "&",
      /* & */
      CHAR_AT: "@",
      /* @ */
      CHAR_BACKSLASH: "\\",
      /* \ */
      CHAR_BACKTICK: "`",
      /* ` */
      CHAR_CARRIAGE_RETURN: "\r",
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: "^",
      /* ^ */
      CHAR_COLON: ":",
      /* : */
      CHAR_COMMA: ",",
      /* , */
      CHAR_DOLLAR: "$",
      /* . */
      CHAR_DOT: ".",
      /* . */
      CHAR_DOUBLE_QUOTE: '"',
      /* " */
      CHAR_EQUAL: "=",
      /* = */
      CHAR_EXCLAMATION_MARK: "!",
      /* ! */
      CHAR_FORM_FEED: "\f",
      /* \f */
      CHAR_FORWARD_SLASH: "/",
      /* / */
      CHAR_HASH: "#",
      /* # */
      CHAR_HYPHEN_MINUS: "-",
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: "<",
      /* < */
      CHAR_LEFT_CURLY_BRACE: "{",
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: "[",
      /* [ */
      CHAR_LINE_FEED: "\n",
      /* \n */
      CHAR_NO_BREAK_SPACE: "\xA0",
      /* \u00A0 */
      CHAR_PERCENT: "%",
      /* % */
      CHAR_PLUS: "+",
      /* + */
      CHAR_QUESTION_MARK: "?",
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: ">",
      /* > */
      CHAR_RIGHT_CURLY_BRACE: "}",
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: "]",
      /* ] */
      CHAR_SEMICOLON: ";",
      /* ; */
      CHAR_SINGLE_QUOTE: "'",
      /* ' */
      CHAR_SPACE: " ",
      /*   */
      CHAR_TAB: "	",
      /* \t */
      CHAR_UNDERSCORE: "_",
      /* _ */
      CHAR_VERTICAL_LINE: "|",
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: "\uFEFF"
      /* \uFEFF */
    };
  }
});

// node_modules/braces/lib/parse.js
var require_parse = __commonJS({
  "node_modules/braces/lib/parse.js"(exports, module) {
    "use strict";
    var stringify2 = require_stringify();
    var {
      MAX_LENGTH,
      CHAR_BACKSLASH,
      /* \ */
      CHAR_BACKTICK,
      /* ` */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_RIGHT_SQUARE_BRACKET,
      /* ] */
      CHAR_DOUBLE_QUOTE,
      /* " */
      CHAR_SINGLE_QUOTE,
      /* ' */
      CHAR_NO_BREAK_SPACE,
      CHAR_ZERO_WIDTH_NOBREAK_SPACE
    } = require_constants();
    var parse10 = (input, options7 = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      const opts2 = options7 || {};
      const max = typeof opts2.maxLength === "number" ? Math.min(MAX_LENGTH, opts2.maxLength) : MAX_LENGTH;
      if (input.length > max) {
        throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
      }
      const ast = { type: "root", input, nodes: [] };
      const stack2 = [ast];
      let block = ast;
      let prev = ast;
      let brackets = 0;
      const length = input.length;
      let index = 0;
      let depth = 0;
      let value;
      const advance = () => input[index++];
      const push2 = (node) => {
        if (node.type === "text" && prev.type === "dot") {
          prev.type = "text";
        }
        if (prev && prev.type === "text" && node.type === "text") {
          prev.value += node.value;
          return;
        }
        block.nodes.push(node);
        node.parent = block;
        node.prev = prev;
        prev = node;
        return node;
      };
      push2({ type: "bos" });
      while (index < length) {
        block = stack2[stack2.length - 1];
        value = advance();
        if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
          continue;
        }
        if (value === CHAR_BACKSLASH) {
          push2({ type: "text", value: (options7.keepEscaping ? value : "") + advance() });
          continue;
        }
        if (value === CHAR_RIGHT_SQUARE_BRACKET) {
          push2({ type: "text", value: "\\" + value });
          continue;
        }
        if (value === CHAR_LEFT_SQUARE_BRACKET) {
          brackets++;
          let next;
          while (index < length && (next = advance())) {
            value += next;
            if (next === CHAR_LEFT_SQUARE_BRACKET) {
              brackets++;
              continue;
            }
            if (next === CHAR_BACKSLASH) {
              value += advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              brackets--;
              if (brackets === 0) {
                break;
              }
            }
          }
          push2({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_PARENTHESES) {
          block = push2({ type: "paren", nodes: [] });
          stack2.push(block);
          push2({ type: "text", value });
          continue;
        }
        if (value === CHAR_RIGHT_PARENTHESES) {
          if (block.type !== "paren") {
            push2({ type: "text", value });
            continue;
          }
          block = stack2.pop();
          push2({ type: "text", value });
          block = stack2[stack2.length - 1];
          continue;
        }
        if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
          const open = value;
          let next;
          if (options7.keepQuotes !== true) {
            value = "";
          }
          while (index < length && (next = advance())) {
            if (next === CHAR_BACKSLASH) {
              value += next + advance();
              continue;
            }
            if (next === open) {
              if (options7.keepQuotes === true) value += next;
              break;
            }
            value += next;
          }
          push2({ type: "text", value });
          continue;
        }
        if (value === CHAR_LEFT_CURLY_BRACE) {
          depth++;
          const dollar = prev.value && prev.value.slice(-1) === "$" || block.dollar === true;
          const brace = {
            type: "brace",
            open: true,
            close: false,
            dollar,
            depth,
            commas: 0,
            ranges: 0,
            nodes: []
          };
          block = push2(brace);
          stack2.push(block);
          push2({ type: "open", value });
          continue;
        }
        if (value === CHAR_RIGHT_CURLY_BRACE) {
          if (block.type !== "brace") {
            push2({ type: "text", value });
            continue;
          }
          const type = "close";
          block = stack2.pop();
          block.close = true;
          push2({ type, value });
          depth--;
          block = stack2[stack2.length - 1];
          continue;
        }
        if (value === CHAR_COMMA && depth > 0) {
          if (block.ranges > 0) {
            block.ranges = 0;
            const open = block.nodes.shift();
            block.nodes = [open, { type: "text", value: stringify2(block) }];
          }
          push2({ type: "comma", value });
          block.commas++;
          continue;
        }
        if (value === CHAR_DOT && depth > 0 && block.commas === 0) {
          const siblings = block.nodes;
          if (depth === 0 || siblings.length === 0) {
            push2({ type: "text", value });
            continue;
          }
          if (prev.type === "dot") {
            block.range = [];
            prev.value += value;
            prev.type = "range";
            if (block.nodes.length !== 3 && block.nodes.length !== 5) {
              block.invalid = true;
              block.ranges = 0;
              prev.type = "text";
              continue;
            }
            block.ranges++;
            block.args = [];
            continue;
          }
          if (prev.type === "range") {
            siblings.pop();
            const before = siblings[siblings.length - 1];
            before.value += prev.value + value;
            prev = before;
            block.ranges--;
            continue;
          }
          push2({ type: "dot", value });
          continue;
        }
        push2({ type: "text", value });
      }
      do {
        block = stack2.pop();
        if (block.type !== "root") {
          block.nodes.forEach((node) => {
            if (!node.nodes) {
              if (node.type === "open") node.isOpen = true;
              if (node.type === "close") node.isClose = true;
              if (!node.nodes) node.type = "text";
              node.invalid = true;
            }
          });
          const parent = stack2[stack2.length - 1];
          const index2 = parent.nodes.indexOf(block);
          parent.nodes.splice(index2, 1, ...block.nodes);
        }
      } while (stack2.length > 0);
      push2({ type: "eos" });
      return ast;
    };
    module.exports = parse10;
  }
});

// node_modules/braces/index.js
var require_braces = __commonJS({
  "node_modules/braces/index.js"(exports, module) {
    "use strict";
    var stringify2 = require_stringify();
    var compile = require_compile();
    var expand2 = require_expand();
    var parse10 = require_parse();
    var braces = (input, options7 = {}) => {
      let output = [];
      if (Array.isArray(input)) {
        for (const pattern of input) {
          const result = braces.create(pattern, options7);
          if (Array.isArray(result)) {
            output.push(...result);
          } else {
            output.push(result);
          }
        }
      } else {
        output = [].concat(braces.create(input, options7));
      }
      if (options7 && options7.expand === true && options7.nodupes === true) {
        output = [...new Set(output)];
      }
      return output;
    };
    braces.parse = (input, options7 = {}) => parse10(input, options7);
    braces.stringify = (input, options7 = {}) => {
      if (typeof input === "string") {
        return stringify2(braces.parse(input, options7), options7);
      }
      return stringify2(input, options7);
    };
    braces.compile = (input, options7 = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options7);
      }
      return compile(input, options7);
    };
    braces.expand = (input, options7 = {}) => {
      if (typeof input === "string") {
        input = braces.parse(input, options7);
      }
      let result = expand2(input, options7);
      if (options7.noempty === true) {
        result = result.filter(Boolean);
      }
      if (options7.nodupes === true) {
        result = [...new Set(result)];
      }
      return result;
    };
    braces.create = (input, options7 = {}) => {
      if (input === "" || input.length < 3) {
        return [input];
      }
      return options7.expand !== true ? braces.compile(input, options7) : braces.expand(input, options7);
    };
    module.exports = braces;
  }
});

// node_modules/micromatch/node_modules/picomatch/lib/constants.js
var require_constants2 = __commonJS({
  "node_modules/micromatch/node_modules/picomatch/lib/constants.js"(exports, module) {
    "use strict";
    var path17 = __require("path");
    var WIN_SLASH = "\\\\/";
    var WIN_NO_SLASH = `[^${WIN_SLASH}]`;
    var DEFAULT_MAX_EXTGLOB_RECURSION = 0;
    var DOT_LITERAL = "\\.";
    var PLUS_LITERAL = "\\+";
    var QMARK_LITERAL = "\\?";
    var SLASH_LITERAL = "\\/";
    var ONE_CHAR = "(?=.)";
    var QMARK = "[^/]";
    var END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
    var START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
    var DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
    var NO_DOT = `(?!${DOT_LITERAL})`;
    var NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
    var NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
    var NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
    var QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
    var STAR = `${QMARK}*?`;
    var POSIX_CHARS = {
      DOT_LITERAL,
      PLUS_LITERAL,
      QMARK_LITERAL,
      SLASH_LITERAL,
      ONE_CHAR,
      QMARK,
      END_ANCHOR,
      DOTS_SLASH,
      NO_DOT,
      NO_DOTS,
      NO_DOT_SLASH,
      NO_DOTS_SLASH,
      QMARK_NO_DOT,
      STAR,
      START_ANCHOR
    };
    var WINDOWS_CHARS = {
      ...POSIX_CHARS,
      SLASH_LITERAL: `[${WIN_SLASH}]`,
      QMARK: WIN_NO_SLASH,
      STAR: `${WIN_NO_SLASH}*?`,
      DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
      NO_DOT: `(?!${DOT_LITERAL})`,
      NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
      NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
      QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
      START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
      END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
    };
    var POSIX_REGEX_SOURCE = {
      __proto__: null,
      alnum: "a-zA-Z0-9",
      alpha: "a-zA-Z",
      ascii: "\\x00-\\x7F",
      blank: " \\t",
      cntrl: "\\x00-\\x1F\\x7F",
      digit: "0-9",
      graph: "\\x21-\\x7E",
      lower: "a-z",
      print: "\\x20-\\x7E ",
      punct: "\\-!\"#$%&'()\\*+,./:;<=>?@[\\]^_`{|}~",
      space: " \\t\\r\\n\\v\\f",
      upper: "A-Z",
      word: "A-Za-z0-9_",
      xdigit: "A-Fa-f0-9"
    };
    module.exports = {
      DEFAULT_MAX_EXTGLOB_RECURSION,
      MAX_LENGTH: 1024 * 64,
      POSIX_REGEX_SOURCE,
      // regular expressions
      REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
      REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
      REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
      REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
      REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
      REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,
      // Replace globs with equivalent patterns to reduce parsing time.
      REPLACEMENTS: {
        __proto__: null,
        "***": "*",
        "**/**": "**",
        "**/**/**": "**"
      },
      // Digits
      CHAR_0: 48,
      /* 0 */
      CHAR_9: 57,
      /* 9 */
      // Alphabet chars.
      CHAR_UPPERCASE_A: 65,
      /* A */
      CHAR_LOWERCASE_A: 97,
      /* a */
      CHAR_UPPERCASE_Z: 90,
      /* Z */
      CHAR_LOWERCASE_Z: 122,
      /* z */
      CHAR_LEFT_PARENTHESES: 40,
      /* ( */
      CHAR_RIGHT_PARENTHESES: 41,
      /* ) */
      CHAR_ASTERISK: 42,
      /* * */
      // Non-alphabetic chars.
      CHAR_AMPERSAND: 38,
      /* & */
      CHAR_AT: 64,
      /* @ */
      CHAR_BACKWARD_SLASH: 92,
      /* \ */
      CHAR_CARRIAGE_RETURN: 13,
      /* \r */
      CHAR_CIRCUMFLEX_ACCENT: 94,
      /* ^ */
      CHAR_COLON: 58,
      /* : */
      CHAR_COMMA: 44,
      /* , */
      CHAR_DOT: 46,
      /* . */
      CHAR_DOUBLE_QUOTE: 34,
      /* " */
      CHAR_EQUAL: 61,
      /* = */
      CHAR_EXCLAMATION_MARK: 33,
      /* ! */
      CHAR_FORM_FEED: 12,
      /* \f */
      CHAR_FORWARD_SLASH: 47,
      /* / */
      CHAR_GRAVE_ACCENT: 96,
      /* ` */
      CHAR_HASH: 35,
      /* # */
      CHAR_HYPHEN_MINUS: 45,
      /* - */
      CHAR_LEFT_ANGLE_BRACKET: 60,
      /* < */
      CHAR_LEFT_CURLY_BRACE: 123,
      /* { */
      CHAR_LEFT_SQUARE_BRACKET: 91,
      /* [ */
      CHAR_LINE_FEED: 10,
      /* \n */
      CHAR_NO_BREAK_SPACE: 160,
      /* \u00A0 */
      CHAR_PERCENT: 37,
      /* % */
      CHAR_PLUS: 43,
      /* + */
      CHAR_QUESTION_MARK: 63,
      /* ? */
      CHAR_RIGHT_ANGLE_BRACKET: 62,
      /* > */
      CHAR_RIGHT_CURLY_BRACE: 125,
      /* } */
      CHAR_RIGHT_SQUARE_BRACKET: 93,
      /* ] */
      CHAR_SEMICOLON: 59,
      /* ; */
      CHAR_SINGLE_QUOTE: 39,
      /* ' */
      CHAR_SPACE: 32,
      /*   */
      CHAR_TAB: 9,
      /* \t */
      CHAR_UNDERSCORE: 95,
      /* _ */
      CHAR_VERTICAL_LINE: 124,
      /* | */
      CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279,
      /* \uFEFF */
      SEP: path17.sep,
      /**
       * Create EXTGLOB_CHARS
       */
      extglobChars(chars) {
        return {
          "!": { type: "negate", open: "(?:(?!(?:", close: `))${chars.STAR})` },
          "?": { type: "qmark", open: "(?:", close: ")?" },
          "+": { type: "plus", open: "(?:", close: ")+" },
          "*": { type: "star", open: "(?:", close: ")*" },
          "@": { type: "at", open: "(?:", close: ")" }
        };
      },
      /**
       * Create GLOB_CHARS
       */
      globChars(win32) {
        return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
      }
    };
  }
});

// node_modules/micromatch/node_modules/picomatch/lib/utils.js
var require_utils2 = __commonJS({
  "node_modules/micromatch/node_modules/picomatch/lib/utils.js"(exports) {
    "use strict";
    var path17 = __require("path");
    var win32 = process.platform === "win32";
    var {
      REGEX_BACKSLASH,
      REGEX_REMOVE_BACKSLASH,
      REGEX_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_GLOBAL
    } = require_constants2();
    exports.isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    exports.hasRegexChars = (str) => REGEX_SPECIAL_CHARS.test(str);
    exports.isRegexChar = (str) => str.length === 1 && exports.hasRegexChars(str);
    exports.escapeRegex = (str) => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, "\\$1");
    exports.toPosixSlashes = (str) => str.replace(REGEX_BACKSLASH, "/");
    exports.removeBackslashes = (str) => {
      return str.replace(REGEX_REMOVE_BACKSLASH, (match2) => {
        return match2 === "\\" ? "" : match2;
      });
    };
    exports.supportsLookbehinds = () => {
      const segs = process.version.slice(1).split(".").map(Number);
      if (segs.length === 3 && segs[0] >= 9 || segs[0] === 8 && segs[1] >= 10) {
        return true;
      }
      return false;
    };
    exports.isWindows = (options7) => {
      if (options7 && typeof options7.windows === "boolean") {
        return options7.windows;
      }
      return win32 === true || path17.sep === "\\";
    };
    exports.escapeLast = (input, char, lastIdx) => {
      const idx = input.lastIndexOf(char, lastIdx);
      if (idx === -1) return input;
      if (input[idx - 1] === "\\") return exports.escapeLast(input, char, idx - 1);
      return `${input.slice(0, idx)}\\${input.slice(idx)}`;
    };
    exports.removePrefix = (input, state = {}) => {
      let output = input;
      if (output.startsWith("./")) {
        output = output.slice(2);
        state.prefix = "./";
      }
      return output;
    };
    exports.wrapOutput = (input, state = {}, options7 = {}) => {
      const prepend = options7.contains ? "" : "^";
      const append = options7.contains ? "" : "$";
      let output = `${prepend}(?:${input})${append}`;
      if (state.negated === true) {
        output = `(?:^(?!${output}).*$)`;
      }
      return output;
    };
  }
});

// node_modules/micromatch/node_modules/picomatch/lib/scan.js
var require_scan = __commonJS({
  "node_modules/micromatch/node_modules/picomatch/lib/scan.js"(exports, module) {
    "use strict";
    var utils = require_utils2();
    var {
      CHAR_ASTERISK,
      /* * */
      CHAR_AT,
      /* @ */
      CHAR_BACKWARD_SLASH,
      /* \ */
      CHAR_COMMA,
      /* , */
      CHAR_DOT,
      /* . */
      CHAR_EXCLAMATION_MARK,
      /* ! */
      CHAR_FORWARD_SLASH,
      /* / */
      CHAR_LEFT_CURLY_BRACE,
      /* { */
      CHAR_LEFT_PARENTHESES,
      /* ( */
      CHAR_LEFT_SQUARE_BRACKET,
      /* [ */
      CHAR_PLUS,
      /* + */
      CHAR_QUESTION_MARK,
      /* ? */
      CHAR_RIGHT_CURLY_BRACE,
      /* } */
      CHAR_RIGHT_PARENTHESES,
      /* ) */
      CHAR_RIGHT_SQUARE_BRACKET
      /* ] */
    } = require_constants2();
    var isPathSeparator = (code) => {
      return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
    };
    var depth = (token2) => {
      if (token2.isPrefix !== true) {
        token2.depth = token2.isGlobstar ? Infinity : 1;
      }
    };
    var scan = (input, options7) => {
      const opts2 = options7 || {};
      const length = input.length - 1;
      const scanToEnd = opts2.parts === true || opts2.scanToEnd === true;
      const slashes = [];
      const tokens = [];
      const parts = [];
      let str = input;
      let index = -1;
      let start = 0;
      let lastIndex = 0;
      let isBrace = false;
      let isBracket = false;
      let isGlob = false;
      let isExtglob = false;
      let isGlobstar = false;
      let braceEscaped = false;
      let backslashes = false;
      let negated = false;
      let negatedExtglob = false;
      let finished = false;
      let braces = 0;
      let prev;
      let code;
      let token2 = { value: "", depth: 0, isGlob: false };
      const eos = () => index >= length;
      const peek2 = () => str.charCodeAt(index + 1);
      const advance = () => {
        prev = code;
        return str.charCodeAt(++index);
      };
      while (index < length) {
        code = advance();
        let next;
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token2.backslashes = true;
          code = advance();
          if (code === CHAR_LEFT_CURLY_BRACE) {
            braceEscaped = true;
          }
          continue;
        }
        if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token2.backslashes = true;
              advance();
              continue;
            }
            if (code === CHAR_LEFT_CURLY_BRACE) {
              braces++;
              continue;
            }
            if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
              isBrace = token2.isBrace = true;
              isGlob = token2.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (braceEscaped !== true && code === CHAR_COMMA) {
              isBrace = token2.isBrace = true;
              isGlob = token2.isGlob = true;
              finished = true;
              if (scanToEnd === true) {
                continue;
              }
              break;
            }
            if (code === CHAR_RIGHT_CURLY_BRACE) {
              braces--;
              if (braces === 0) {
                braceEscaped = false;
                isBrace = token2.isBrace = true;
                finished = true;
                break;
              }
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_FORWARD_SLASH) {
          slashes.push(index);
          tokens.push(token2);
          token2 = { value: "", depth: 0, isGlob: false };
          if (finished === true) continue;
          if (prev === CHAR_DOT && index === start + 1) {
            start += 2;
            continue;
          }
          lastIndex = index + 1;
          continue;
        }
        if (opts2.noext !== true) {
          const isExtglobChar = code === CHAR_PLUS || code === CHAR_AT || code === CHAR_ASTERISK || code === CHAR_QUESTION_MARK || code === CHAR_EXCLAMATION_MARK;
          if (isExtglobChar === true && peek2() === CHAR_LEFT_PARENTHESES) {
            isGlob = token2.isGlob = true;
            isExtglob = token2.isExtglob = true;
            finished = true;
            if (code === CHAR_EXCLAMATION_MARK && index === start) {
              negatedExtglob = true;
            }
            if (scanToEnd === true) {
              while (eos() !== true && (code = advance())) {
                if (code === CHAR_BACKWARD_SLASH) {
                  backslashes = token2.backslashes = true;
                  code = advance();
                  continue;
                }
                if (code === CHAR_RIGHT_PARENTHESES) {
                  isGlob = token2.isGlob = true;
                  finished = true;
                  break;
                }
              }
              continue;
            }
            break;
          }
        }
        if (code === CHAR_ASTERISK) {
          if (prev === CHAR_ASTERISK) isGlobstar = token2.isGlobstar = true;
          isGlob = token2.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_QUESTION_MARK) {
          isGlob = token2.isGlob = true;
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (code === CHAR_LEFT_SQUARE_BRACKET) {
          while (eos() !== true && (next = advance())) {
            if (next === CHAR_BACKWARD_SLASH) {
              backslashes = token2.backslashes = true;
              advance();
              continue;
            }
            if (next === CHAR_RIGHT_SQUARE_BRACKET) {
              isBracket = token2.isBracket = true;
              isGlob = token2.isGlob = true;
              finished = true;
              break;
            }
          }
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
        if (opts2.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
          negated = token2.negated = true;
          start++;
          continue;
        }
        if (opts2.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
          isGlob = token2.isGlob = true;
          if (scanToEnd === true) {
            while (eos() !== true && (code = advance())) {
              if (code === CHAR_LEFT_PARENTHESES) {
                backslashes = token2.backslashes = true;
                code = advance();
                continue;
              }
              if (code === CHAR_RIGHT_PARENTHESES) {
                finished = true;
                break;
              }
            }
            continue;
          }
          break;
        }
        if (isGlob === true) {
          finished = true;
          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
      if (opts2.noext === true) {
        isExtglob = false;
        isGlob = false;
      }
      let base = str;
      let prefix = "";
      let glob = "";
      if (start > 0) {
        prefix = str.slice(0, start);
        str = str.slice(start);
        lastIndex -= start;
      }
      if (base && isGlob === true && lastIndex > 0) {
        base = str.slice(0, lastIndex);
        glob = str.slice(lastIndex);
      } else if (isGlob === true) {
        base = "";
        glob = str;
      } else {
        base = str;
      }
      if (base && base !== "" && base !== "/" && base !== str) {
        if (isPathSeparator(base.charCodeAt(base.length - 1))) {
          base = base.slice(0, -1);
        }
      }
      if (opts2.unescape === true) {
        if (glob) glob = utils.removeBackslashes(glob);
        if (base && backslashes === true) {
          base = utils.removeBackslashes(base);
        }
      }
      const state = {
        prefix,
        input,
        start,
        base,
        glob,
        isBrace,
        isBracket,
        isGlob,
        isExtglob,
        isGlobstar,
        negated,
        negatedExtglob
      };
      if (opts2.tokens === true) {
        state.maxDepth = 0;
        if (!isPathSeparator(code)) {
          tokens.push(token2);
        }
        state.tokens = tokens;
      }
      if (opts2.parts === true || opts2.tokens === true) {
        let prevIndex;
        for (let idx = 0; idx < slashes.length; idx++) {
          const n = prevIndex ? prevIndex + 1 : start;
          const i = slashes[idx];
          const value = input.slice(n, i);
          if (opts2.tokens) {
            if (idx === 0 && start !== 0) {
              tokens[idx].isPrefix = true;
              tokens[idx].value = prefix;
            } else {
              tokens[idx].value = value;
            }
            depth(tokens[idx]);
            state.maxDepth += tokens[idx].depth;
          }
          if (idx !== 0 || value !== "") {
            parts.push(value);
          }
          prevIndex = i;
        }
        if (prevIndex && prevIndex + 1 < input.length) {
          const value = input.slice(prevIndex + 1);
          parts.push(value);
          if (opts2.tokens) {
            tokens[tokens.length - 1].value = value;
            depth(tokens[tokens.length - 1]);
            state.maxDepth += tokens[tokens.length - 1].depth;
          }
        }
        state.slashes = slashes;
        state.parts = parts;
      }
      return state;
    };
    module.exports = scan;
  }
});

// node_modules/micromatch/node_modules/picomatch/lib/parse.js
var require_parse2 = __commonJS({
  "node_modules/micromatch/node_modules/picomatch/lib/parse.js"(exports, module) {
    "use strict";
    var constants = require_constants2();
    var utils = require_utils2();
    var {
      MAX_LENGTH,
      POSIX_REGEX_SOURCE,
      REGEX_NON_SPECIAL_CHARS,
      REGEX_SPECIAL_CHARS_BACKREF,
      REPLACEMENTS
    } = constants;
    var expandRange = (args, options7) => {
      if (typeof options7.expandRange === "function") {
        return options7.expandRange(...args, options7);
      }
      args.sort();
      const value = `[${args.join("-")}]`;
      try {
        new RegExp(value);
      } catch (ex) {
        return args.map((v) => utils.escapeRegex(v)).join("..");
      }
      return value;
    };
    var syntaxError2 = (type, char) => {
      return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
    };
    var splitTopLevel = (input) => {
      const parts = [];
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let value = "";
      let escaped = false;
      for (const ch of input) {
        if (escaped === true) {
          value += ch;
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          value += ch;
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          value += ch;
          continue;
        }
        if (quote === 0) {
          if (ch === "[") {
            bracket++;
          } else if (ch === "]" && bracket > 0) {
            bracket--;
          } else if (bracket === 0) {
            if (ch === "(") {
              paren++;
            } else if (ch === ")" && paren > 0) {
              paren--;
            } else if (ch === "|" && paren === 0) {
              parts.push(value);
              value = "";
              continue;
            }
          }
        }
        value += ch;
      }
      parts.push(value);
      return parts;
    };
    var isPlainBranch = (branch) => {
      let escaped = false;
      for (const ch of branch) {
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (/[?*+@!()[\]{}]/.test(ch)) {
          return false;
        }
      }
      return true;
    };
    var normalizeSimpleBranch = (branch) => {
      let value = branch.trim();
      let changed = true;
      while (changed === true) {
        changed = false;
        if (/^@\([^\\()[\]{}|]+\)$/.test(value)) {
          value = value.slice(2, -1);
          changed = true;
        }
      }
      if (!isPlainBranch(value)) {
        return;
      }
      return value.replace(/\\(.)/g, "$1");
    };
    var hasRepeatedCharPrefixOverlap = (branches) => {
      const values = branches.map(normalizeSimpleBranch).filter(Boolean);
      for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
          const a = values[i];
          const b = values[j];
          const char = a[0];
          if (!char || a !== char.repeat(a.length) || b !== char.repeat(b.length)) {
            continue;
          }
          if (a === b || a.startsWith(b) || b.startsWith(a)) {
            return true;
          }
        }
      }
      return false;
    };
    var parseRepeatedExtglob = (pattern, requireEnd = true) => {
      if (pattern[0] !== "+" && pattern[0] !== "*" || pattern[1] !== "(") {
        return;
      }
      let bracket = 0;
      let paren = 0;
      let quote = 0;
      let escaped = false;
      for (let i = 1; i < pattern.length; i++) {
        const ch = pattern[i];
        if (escaped === true) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') {
          quote = quote === 1 ? 0 : 1;
          continue;
        }
        if (quote === 1) {
          continue;
        }
        if (ch === "[") {
          bracket++;
          continue;
        }
        if (ch === "]" && bracket > 0) {
          bracket--;
          continue;
        }
        if (bracket > 0) {
          continue;
        }
        if (ch === "(") {
          paren++;
          continue;
        }
        if (ch === ")") {
          paren--;
          if (paren === 0) {
            if (requireEnd === true && i !== pattern.length - 1) {
              return;
            }
            return {
              type: pattern[0],
              body: pattern.slice(2, i),
              end: i
            };
          }
        }
      }
    };
    var getStarExtglobSequenceOutput = (pattern) => {
      let index = 0;
      const chars = [];
      while (index < pattern.length) {
        const match2 = parseRepeatedExtglob(pattern.slice(index), false);
        if (!match2 || match2.type !== "*") {
          return;
        }
        const branches = splitTopLevel(match2.body).map((branch2) => branch2.trim());
        if (branches.length !== 1) {
          return;
        }
        const branch = normalizeSimpleBranch(branches[0]);
        if (!branch || branch.length !== 1) {
          return;
        }
        chars.push(branch);
        index += match2.end + 1;
      }
      if (chars.length < 1) {
        return;
      }
      const source2 = chars.length === 1 ? utils.escapeRegex(chars[0]) : `[${chars.map((ch) => utils.escapeRegex(ch)).join("")}]`;
      return `${source2}*`;
    };
    var repeatedExtglobRecursion = (pattern) => {
      let depth = 0;
      let value = pattern.trim();
      let match2 = parseRepeatedExtglob(value);
      while (match2) {
        depth++;
        value = match2.body.trim();
        match2 = parseRepeatedExtglob(value);
      }
      return depth;
    };
    var analyzeRepeatedExtglob = (body, options7) => {
      if (options7.maxExtglobRecursion === false) {
        return { risky: false };
      }
      const max = typeof options7.maxExtglobRecursion === "number" ? options7.maxExtglobRecursion : constants.DEFAULT_MAX_EXTGLOB_RECURSION;
      const branches = splitTopLevel(body).map((branch) => branch.trim());
      if (branches.length > 1) {
        if (branches.some((branch) => branch === "") || branches.some((branch) => /^[*?]+$/.test(branch)) || hasRepeatedCharPrefixOverlap(branches)) {
          return { risky: true };
        }
      }
      for (const branch of branches) {
        const safeOutput = getStarExtglobSequenceOutput(branch);
        if (safeOutput) {
          return { risky: true, safeOutput };
        }
        if (repeatedExtglobRecursion(branch) > max) {
          return { risky: true };
        }
      }
      return { risky: false };
    };
    var parse10 = (input, options7) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected a string");
      }
      input = REPLACEMENTS[input] || input;
      const opts2 = { ...options7 };
      const max = typeof opts2.maxLength === "number" ? Math.min(MAX_LENGTH, opts2.maxLength) : MAX_LENGTH;
      let len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      const bos = { type: "bos", value: "", output: opts2.prepend || "" };
      const tokens = [bos];
      const capture = opts2.capture ? "" : "?:";
      const win32 = utils.isWindows(options7);
      const PLATFORM_CHARS = constants.globChars(win32);
      const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);
      const {
        DOT_LITERAL,
        PLUS_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOT_SLASH,
        NO_DOTS_SLASH,
        QMARK,
        QMARK_NO_DOT,
        STAR,
        START_ANCHOR
      } = PLATFORM_CHARS;
      const globstar = (opts3) => {
        return `(${capture}(?:(?!${START_ANCHOR}${opts3.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const nodot = opts2.dot ? "" : NO_DOT;
      const qmarkNoDot = opts2.dot ? QMARK : QMARK_NO_DOT;
      let star3 = opts2.bash === true ? globstar(opts2) : STAR;
      if (opts2.capture) {
        star3 = `(${star3})`;
      }
      if (typeof opts2.noext === "boolean") {
        opts2.noextglob = opts2.noext;
      }
      const state = {
        input,
        index: -1,
        start: 0,
        dot: opts2.dot === true,
        consumed: "",
        output: "",
        prefix: "",
        backtrack: false,
        negated: false,
        brackets: 0,
        braces: 0,
        parens: 0,
        quotes: 0,
        globstar: false,
        tokens
      };
      input = utils.removePrefix(input, state);
      len = input.length;
      const extglobs = [];
      const braces = [];
      const stack2 = [];
      let prev = bos;
      let value;
      const eos = () => state.index === len - 1;
      const peek2 = state.peek = (n = 1) => input[state.index + n];
      const advance = state.advance = () => input[++state.index] || "";
      const remaining = () => input.slice(state.index + 1);
      const consume = (value2 = "", num = 0) => {
        state.consumed += value2;
        state.index += num;
      };
      const append = (token2) => {
        state.output += token2.output != null ? token2.output : token2.value;
        consume(token2.value);
      };
      const negate = () => {
        let count = 1;
        while (peek2() === "!" && (peek2(2) !== "(" || peek2(3) === "?")) {
          advance();
          state.start++;
          count++;
        }
        if (count % 2 === 0) {
          return false;
        }
        state.negated = true;
        state.start++;
        return true;
      };
      const increment = (type) => {
        state[type]++;
        stack2.push(type);
      };
      const decrement = (type) => {
        state[type]--;
        stack2.pop();
      };
      const push2 = (tok) => {
        if (prev.type === "globstar") {
          const isBrace = state.braces > 0 && (tok.type === "comma" || tok.type === "brace");
          const isExtglob = tok.extglob === true || extglobs.length && (tok.type === "pipe" || tok.type === "paren");
          if (tok.type !== "slash" && tok.type !== "paren" && !isBrace && !isExtglob) {
            state.output = state.output.slice(0, -prev.output.length);
            prev.type = "star";
            prev.value = "*";
            prev.output = star3;
            state.output += prev.output;
          }
        }
        if (extglobs.length && tok.type !== "paren") {
          extglobs[extglobs.length - 1].inner += tok.value;
        }
        if (tok.value || tok.output) append(tok);
        if (prev && prev.type === "text" && tok.type === "text") {
          prev.value += tok.value;
          prev.output = (prev.output || "") + tok.value;
          return;
        }
        tok.prev = prev;
        tokens.push(tok);
        prev = tok;
      };
      const extglobOpen = (type, value2) => {
        const token2 = { ...EXTGLOB_CHARS[value2], conditions: 1, inner: "" };
        token2.prev = prev;
        token2.parens = state.parens;
        token2.output = state.output;
        token2.startIndex = state.index;
        token2.tokensIndex = tokens.length;
        const output = (opts2.capture ? "(" : "") + token2.open;
        increment("parens");
        push2({ type, value: value2, output: state.output ? "" : ONE_CHAR });
        push2({ type: "paren", extglob: true, value: advance(), output });
        extglobs.push(token2);
      };
      const extglobClose = (token2) => {
        const literal2 = input.slice(token2.startIndex, state.index + 1);
        const body = input.slice(token2.startIndex + 2, state.index);
        const analysis = analyzeRepeatedExtglob(body, opts2);
        if ((token2.type === "plus" || token2.type === "star") && analysis.risky) {
          const safeOutput = analysis.safeOutput ? (token2.output ? "" : ONE_CHAR) + (opts2.capture ? `(${analysis.safeOutput})` : analysis.safeOutput) : void 0;
          const open = tokens[token2.tokensIndex];
          open.type = "text";
          open.value = literal2;
          open.output = safeOutput || utils.escapeRegex(literal2);
          for (let i = token2.tokensIndex + 1; i < tokens.length; i++) {
            tokens[i].value = "";
            tokens[i].output = "";
            delete tokens[i].suffix;
          }
          state.output = token2.output + open.output;
          state.backtrack = true;
          push2({ type: "paren", extglob: true, value, output: "" });
          decrement("parens");
          return;
        }
        let output = token2.close + (opts2.capture ? ")" : "");
        let rest;
        if (token2.type === "negate") {
          let extglobStar = star3;
          if (token2.inner && token2.inner.length > 1 && token2.inner.includes("/")) {
            extglobStar = globstar(opts2);
          }
          if (extglobStar !== star3 || eos() || /^\)+$/.test(remaining())) {
            output = token2.close = `)$))${extglobStar}`;
          }
          if (token2.inner.includes("*") && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
            const expression = parse10(rest, { ...options7, fastpaths: false }).output;
            output = token2.close = `)${expression})${extglobStar})`;
          }
          if (token2.prev.type === "bos") {
            state.negatedExtglob = true;
          }
        }
        push2({ type: "paren", extglob: true, value, output });
        decrement("parens");
      };
      if (opts2.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
        let backslashes = false;
        let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
          if (first === "\\") {
            backslashes = true;
            return m;
          }
          if (first === "?") {
            if (esc) {
              return esc + first + (rest ? QMARK.repeat(rest.length) : "");
            }
            if (index === 0) {
              return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : "");
            }
            return QMARK.repeat(chars.length);
          }
          if (first === ".") {
            return DOT_LITERAL.repeat(chars.length);
          }
          if (first === "*") {
            if (esc) {
              return esc + first + (rest ? star3 : "");
            }
            return star3;
          }
          return esc ? m : `\\${m}`;
        });
        if (backslashes === true) {
          if (opts2.unescape === true) {
            output = output.replace(/\\/g, "");
          } else {
            output = output.replace(/\\+/g, (m) => {
              return m.length % 2 === 0 ? "\\\\" : m ? "\\" : "";
            });
          }
        }
        if (output === input && opts2.contains === true) {
          state.output = input;
          return state;
        }
        state.output = utils.wrapOutput(output, state, options7);
        return state;
      }
      while (!eos()) {
        value = advance();
        if (value === "\0") {
          continue;
        }
        if (value === "\\") {
          const next = peek2();
          if (next === "/" && opts2.bash !== true) {
            continue;
          }
          if (next === "." || next === ";") {
            continue;
          }
          if (!next) {
            value += "\\";
            push2({ type: "text", value });
            continue;
          }
          const match2 = /^\\+/.exec(remaining());
          let slashes = 0;
          if (match2 && match2[0].length > 2) {
            slashes = match2[0].length;
            state.index += slashes;
            if (slashes % 2 !== 0) {
              value += "\\";
            }
          }
          if (opts2.unescape === true) {
            value = advance();
          } else {
            value += advance();
          }
          if (state.brackets === 0) {
            push2({ type: "text", value });
            continue;
          }
        }
        if (state.brackets > 0 && (value !== "]" || prev.value === "[" || prev.value === "[^")) {
          if (opts2.posix !== false && value === ":") {
            const inner = prev.value.slice(1);
            if (inner.includes("[")) {
              prev.posix = true;
              if (inner.includes(":")) {
                const idx = prev.value.lastIndexOf("[");
                const pre = prev.value.slice(0, idx);
                const rest2 = prev.value.slice(idx + 2);
                const posix = POSIX_REGEX_SOURCE[rest2];
                if (posix) {
                  prev.value = pre + posix;
                  state.backtrack = true;
                  advance();
                  if (!bos.output && tokens.indexOf(prev) === 1) {
                    bos.output = ONE_CHAR;
                  }
                  continue;
                }
              }
            }
          }
          if (value === "[" && peek2() !== ":" || value === "-" && peek2() === "]") {
            value = `\\${value}`;
          }
          if (value === "]" && (prev.value === "[" || prev.value === "[^")) {
            value = `\\${value}`;
          }
          if (opts2.posix === true && value === "!" && prev.value === "[") {
            value = "^";
          }
          prev.value += value;
          append({ value });
          continue;
        }
        if (state.quotes === 1 && value !== '"') {
          value = utils.escapeRegex(value);
          prev.value += value;
          append({ value });
          continue;
        }
        if (value === '"') {
          state.quotes = state.quotes === 1 ? 0 : 1;
          if (opts2.keepQuotes === true) {
            push2({ type: "text", value });
          }
          continue;
        }
        if (value === "(") {
          increment("parens");
          push2({ type: "paren", value });
          continue;
        }
        if (value === ")") {
          if (state.parens === 0 && opts2.strictBrackets === true) {
            throw new SyntaxError(syntaxError2("opening", "("));
          }
          const extglob = extglobs[extglobs.length - 1];
          if (extglob && state.parens === extglob.parens + 1) {
            extglobClose(extglobs.pop());
            continue;
          }
          push2({ type: "paren", value, output: state.parens ? ")" : "\\)" });
          decrement("parens");
          continue;
        }
        if (value === "[") {
          if (opts2.nobracket === true || !remaining().includes("]")) {
            if (opts2.nobracket !== true && opts2.strictBrackets === true) {
              throw new SyntaxError(syntaxError2("closing", "]"));
            }
            value = `\\${value}`;
          } else {
            increment("brackets");
          }
          push2({ type: "bracket", value });
          continue;
        }
        if (value === "]") {
          if (opts2.nobracket === true || prev && prev.type === "bracket" && prev.value.length === 1) {
            push2({ type: "text", value, output: `\\${value}` });
            continue;
          }
          if (state.brackets === 0) {
            if (opts2.strictBrackets === true) {
              throw new SyntaxError(syntaxError2("opening", "["));
            }
            push2({ type: "text", value, output: `\\${value}` });
            continue;
          }
          decrement("brackets");
          const prevValue = prev.value.slice(1);
          if (prev.posix !== true && prevValue[0] === "^" && !prevValue.includes("/")) {
            value = `/${value}`;
          }
          prev.value += value;
          append({ value });
          if (opts2.literalBrackets === false || utils.hasRegexChars(prevValue)) {
            continue;
          }
          const escaped = utils.escapeRegex(prev.value);
          state.output = state.output.slice(0, -prev.value.length);
          if (opts2.literalBrackets === true) {
            state.output += escaped;
            prev.value = escaped;
            continue;
          }
          prev.value = `(${capture}${escaped}|${prev.value})`;
          state.output += prev.value;
          continue;
        }
        if (value === "{" && opts2.nobrace !== true) {
          increment("braces");
          const open = {
            type: "brace",
            value,
            output: "(",
            outputIndex: state.output.length,
            tokensIndex: state.tokens.length
          };
          braces.push(open);
          push2(open);
          continue;
        }
        if (value === "}") {
          const brace = braces[braces.length - 1];
          if (opts2.nobrace === true || !brace) {
            push2({ type: "text", value, output: value });
            continue;
          }
          let output = ")";
          if (brace.dots === true) {
            const arr = tokens.slice();
            const range2 = [];
            for (let i = arr.length - 1; i >= 0; i--) {
              tokens.pop();
              if (arr[i].type === "brace") {
                break;
              }
              if (arr[i].type !== "dots") {
                range2.unshift(arr[i].value);
              }
            }
            output = expandRange(range2, opts2);
            state.backtrack = true;
          }
          if (brace.comma !== true && brace.dots !== true) {
            const out = state.output.slice(0, brace.outputIndex);
            const toks = state.tokens.slice(brace.tokensIndex);
            brace.value = brace.output = "\\{";
            value = output = "\\}";
            state.output = out;
            for (const t of toks) {
              state.output += t.output || t.value;
            }
          }
          push2({ type: "brace", value, output });
          decrement("braces");
          braces.pop();
          continue;
        }
        if (value === "|") {
          if (extglobs.length > 0) {
            extglobs[extglobs.length - 1].conditions++;
          }
          push2({ type: "text", value });
          continue;
        }
        if (value === ",") {
          let output = value;
          const brace = braces[braces.length - 1];
          if (brace && stack2[stack2.length - 1] === "braces") {
            brace.comma = true;
            output = "|";
          }
          push2({ type: "comma", value, output });
          continue;
        }
        if (value === "/") {
          if (prev.type === "dot" && state.index === state.start + 1) {
            state.start = state.index + 1;
            state.consumed = "";
            state.output = "";
            tokens.pop();
            prev = bos;
            continue;
          }
          push2({ type: "slash", value, output: SLASH_LITERAL });
          continue;
        }
        if (value === ".") {
          if (state.braces > 0 && prev.type === "dot") {
            if (prev.value === ".") prev.output = DOT_LITERAL;
            const brace = braces[braces.length - 1];
            prev.type = "dots";
            prev.output += value;
            prev.value += value;
            brace.dots = true;
            continue;
          }
          if (state.braces + state.parens === 0 && prev.type !== "bos" && prev.type !== "slash") {
            push2({ type: "text", value, output: DOT_LITERAL });
            continue;
          }
          push2({ type: "dot", value, output: DOT_LITERAL });
          continue;
        }
        if (value === "?") {
          const isGroup = prev && prev.value === "(";
          if (!isGroup && opts2.noextglob !== true && peek2() === "(" && peek2(2) !== "?") {
            extglobOpen("qmark", value);
            continue;
          }
          if (prev && prev.type === "paren") {
            const next = peek2();
            let output = value;
            if (next === "<" && !utils.supportsLookbehinds()) {
              throw new Error("Node.js v10 or higher is required for regex lookbehinds");
            }
            if (prev.value === "(" && !/[!=<:]/.test(next) || next === "<" && !/<([!=]|\w+>)/.test(remaining())) {
              output = `\\${value}`;
            }
            push2({ type: "text", value, output });
            continue;
          }
          if (opts2.dot !== true && (prev.type === "slash" || prev.type === "bos")) {
            push2({ type: "qmark", value, output: QMARK_NO_DOT });
            continue;
          }
          push2({ type: "qmark", value, output: QMARK });
          continue;
        }
        if (value === "!") {
          if (opts2.noextglob !== true && peek2() === "(") {
            if (peek2(2) !== "?" || !/[!=<:]/.test(peek2(3))) {
              extglobOpen("negate", value);
              continue;
            }
          }
          if (opts2.nonegate !== true && state.index === 0) {
            negate();
            continue;
          }
        }
        if (value === "+") {
          if (opts2.noextglob !== true && peek2() === "(" && peek2(2) !== "?") {
            extglobOpen("plus", value);
            continue;
          }
          if (prev && prev.value === "(" || opts2.regex === false) {
            push2({ type: "plus", value, output: PLUS_LITERAL });
            continue;
          }
          if (prev && (prev.type === "bracket" || prev.type === "paren" || prev.type === "brace") || state.parens > 0) {
            push2({ type: "plus", value });
            continue;
          }
          push2({ type: "plus", value: PLUS_LITERAL });
          continue;
        }
        if (value === "@") {
          if (opts2.noextglob !== true && peek2() === "(" && peek2(2) !== "?") {
            push2({ type: "at", extglob: true, value, output: "" });
            continue;
          }
          push2({ type: "text", value });
          continue;
        }
        if (value !== "*") {
          if (value === "$" || value === "^") {
            value = `\\${value}`;
          }
          const match2 = REGEX_NON_SPECIAL_CHARS.exec(remaining());
          if (match2) {
            value += match2[0];
            state.index += match2[0].length;
          }
          push2({ type: "text", value });
          continue;
        }
        if (prev && (prev.type === "globstar" || prev.star === true)) {
          prev.type = "star";
          prev.star = true;
          prev.value += value;
          prev.output = star3;
          state.backtrack = true;
          state.globstar = true;
          consume(value);
          continue;
        }
        let rest = remaining();
        if (opts2.noextglob !== true && /^\([^?]/.test(rest)) {
          extglobOpen("star", value);
          continue;
        }
        if (prev.type === "star") {
          if (opts2.noglobstar === true) {
            consume(value);
            continue;
          }
          const prior = prev.prev;
          const before = prior.prev;
          const isStart = prior.type === "slash" || prior.type === "bos";
          const afterStar = before && (before.type === "star" || before.type === "globstar");
          if (opts2.bash === true && (!isStart || rest[0] && rest[0] !== "/")) {
            push2({ type: "star", value, output: "" });
            continue;
          }
          const isBrace = state.braces > 0 && (prior.type === "comma" || prior.type === "brace");
          const isExtglob = extglobs.length && (prior.type === "pipe" || prior.type === "paren");
          if (!isStart && prior.type !== "paren" && !isBrace && !isExtglob) {
            push2({ type: "star", value, output: "" });
            continue;
          }
          while (rest.slice(0, 3) === "/**") {
            const after = input[state.index + 4];
            if (after && after !== "/") {
              break;
            }
            rest = rest.slice(3);
            consume("/**", 3);
          }
          if (prior.type === "bos" && eos()) {
            prev.type = "globstar";
            prev.value += value;
            prev.output = globstar(opts2);
            state.output = prev.output;
            state.globstar = true;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && !afterStar && eos()) {
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = globstar(opts2) + (opts2.strictSlashes ? ")" : "|$)");
            prev.value += value;
            state.globstar = true;
            state.output += prior.output + prev.output;
            consume(value);
            continue;
          }
          if (prior.type === "slash" && prior.prev.type !== "bos" && rest[0] === "/") {
            const end = rest[1] !== void 0 ? "|$" : "";
            state.output = state.output.slice(0, -(prior.output + prev.output).length);
            prior.output = `(?:${prior.output}`;
            prev.type = "globstar";
            prev.output = `${globstar(opts2)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
            prev.value += value;
            state.output += prior.output + prev.output;
            state.globstar = true;
            consume(value + advance());
            push2({ type: "slash", value: "/", output: "" });
            continue;
          }
          if (prior.type === "bos" && rest[0] === "/") {
            prev.type = "globstar";
            prev.value += value;
            prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts2)}${SLASH_LITERAL})`;
            state.output = prev.output;
            state.globstar = true;
            consume(value + advance());
            push2({ type: "slash", value: "/", output: "" });
            continue;
          }
          state.output = state.output.slice(0, -prev.output.length);
          prev.type = "globstar";
          prev.output = globstar(opts2);
          prev.value += value;
          state.output += prev.output;
          state.globstar = true;
          consume(value);
          continue;
        }
        const token2 = { type: "star", value, output: star3 };
        if (opts2.bash === true) {
          token2.output = ".*?";
          if (prev.type === "bos" || prev.type === "slash") {
            token2.output = nodot + token2.output;
          }
          push2(token2);
          continue;
        }
        if (prev && (prev.type === "bracket" || prev.type === "paren") && opts2.regex === true) {
          token2.output = value;
          push2(token2);
          continue;
        }
        if (state.index === state.start || prev.type === "slash" || prev.type === "dot") {
          if (prev.type === "dot") {
            state.output += NO_DOT_SLASH;
            prev.output += NO_DOT_SLASH;
          } else if (opts2.dot === true) {
            state.output += NO_DOTS_SLASH;
            prev.output += NO_DOTS_SLASH;
          } else {
            state.output += nodot;
            prev.output += nodot;
          }
          if (peek2() !== "*") {
            state.output += ONE_CHAR;
            prev.output += ONE_CHAR;
          }
        }
        push2(token2);
      }
      while (state.brackets > 0) {
        if (opts2.strictBrackets === true) throw new SyntaxError(syntaxError2("closing", "]"));
        state.output = utils.escapeLast(state.output, "[");
        decrement("brackets");
      }
      while (state.parens > 0) {
        if (opts2.strictBrackets === true) throw new SyntaxError(syntaxError2("closing", ")"));
        state.output = utils.escapeLast(state.output, "(");
        decrement("parens");
      }
      while (state.braces > 0) {
        if (opts2.strictBrackets === true) throw new SyntaxError(syntaxError2("closing", "}"));
        state.output = utils.escapeLast(state.output, "{");
        decrement("braces");
      }
      if (opts2.strictSlashes !== true && (prev.type === "star" || prev.type === "bracket")) {
        push2({ type: "maybe_slash", value: "", output: `${SLASH_LITERAL}?` });
      }
      if (state.backtrack === true) {
        state.output = "";
        for (const token2 of state.tokens) {
          state.output += token2.output != null ? token2.output : token2.value;
          if (token2.suffix) {
            state.output += token2.suffix;
          }
        }
      }
      return state;
    };
    parse10.fastpaths = (input, options7) => {
      const opts2 = { ...options7 };
      const max = typeof opts2.maxLength === "number" ? Math.min(MAX_LENGTH, opts2.maxLength) : MAX_LENGTH;
      const len = input.length;
      if (len > max) {
        throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
      }
      input = REPLACEMENTS[input] || input;
      const win32 = utils.isWindows(options7);
      const {
        DOT_LITERAL,
        SLASH_LITERAL,
        ONE_CHAR,
        DOTS_SLASH,
        NO_DOT,
        NO_DOTS,
        NO_DOTS_SLASH,
        STAR,
        START_ANCHOR
      } = constants.globChars(win32);
      const nodot = opts2.dot ? NO_DOTS : NO_DOT;
      const slashDot = opts2.dot ? NO_DOTS_SLASH : NO_DOT;
      const capture = opts2.capture ? "" : "?:";
      const state = { negated: false, prefix: "" };
      let star3 = opts2.bash === true ? ".*?" : STAR;
      if (opts2.capture) {
        star3 = `(${star3})`;
      }
      const globstar = (opts3) => {
        if (opts3.noglobstar === true) return star3;
        return `(${capture}(?:(?!${START_ANCHOR}${opts3.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
      };
      const create = (str) => {
        switch (str) {
          case "*":
            return `${nodot}${ONE_CHAR}${star3}`;
          case ".*":
            return `${DOT_LITERAL}${ONE_CHAR}${star3}`;
          case "*.*":
            return `${nodot}${star3}${DOT_LITERAL}${ONE_CHAR}${star3}`;
          case "*/*":
            return `${nodot}${star3}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star3}`;
          case "**":
            return nodot + globstar(opts2);
          case "**/*":
            return `(?:${nodot}${globstar(opts2)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star3}`;
          case "**/*.*":
            return `(?:${nodot}${globstar(opts2)}${SLASH_LITERAL})?${slashDot}${star3}${DOT_LITERAL}${ONE_CHAR}${star3}`;
          case "**/.*":
            return `(?:${nodot}${globstar(opts2)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star3}`;
          default: {
            const match2 = /^(.*?)\.(\w+)$/.exec(str);
            if (!match2) return;
            const source3 = create(match2[1]);
            if (!source3) return;
            return source3 + DOT_LITERAL + match2[2];
          }
        }
      };
      const output = utils.removePrefix(input, state);
      let source2 = create(output);
      if (source2 && opts2.strictSlashes !== true) {
        source2 += `${SLASH_LITERAL}?`;
      }
      return source2;
    };
    module.exports = parse10;
  }
});

// node_modules/micromatch/node_modules/picomatch/lib/picomatch.js
var require_picomatch = __commonJS({
  "node_modules/micromatch/node_modules/picomatch/lib/picomatch.js"(exports, module) {
    "use strict";
    var path17 = __require("path");
    var scan = require_scan();
    var parse10 = require_parse2();
    var utils = require_utils2();
    var constants = require_constants2();
    var isObject2 = (val) => val && typeof val === "object" && !Array.isArray(val);
    var picomatch = (glob, options7, returnState = false) => {
      if (Array.isArray(glob)) {
        const fns = glob.map((input) => picomatch(input, options7, returnState));
        const arrayMatcher = (str) => {
          for (const isMatch of fns) {
            const state2 = isMatch(str);
            if (state2) return state2;
          }
          return false;
        };
        return arrayMatcher;
      }
      const isState = isObject2(glob) && glob.tokens && glob.input;
      if (glob === "" || typeof glob !== "string" && !isState) {
        throw new TypeError("Expected pattern to be a non-empty string");
      }
      const opts2 = options7 || {};
      const posix = utils.isWindows(options7);
      const regex = isState ? picomatch.compileRe(glob, options7) : picomatch.makeRe(glob, options7, false, true);
      const state = regex.state;
      delete regex.state;
      let isIgnored2 = () => false;
      if (opts2.ignore) {
        const ignoreOpts = { ...options7, ignore: null, onMatch: null, onResult: null };
        isIgnored2 = picomatch(opts2.ignore, ignoreOpts, returnState);
      }
      const matcher = (input, returnObject = false) => {
        const { isMatch, match: match2, output } = picomatch.test(input, regex, options7, { glob, posix });
        const result = { glob, state, regex, posix, input, output, match: match2, isMatch };
        if (typeof opts2.onResult === "function") {
          opts2.onResult(result);
        }
        if (isMatch === false) {
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (isIgnored2(input)) {
          if (typeof opts2.onIgnore === "function") {
            opts2.onIgnore(result);
          }
          result.isMatch = false;
          return returnObject ? result : false;
        }
        if (typeof opts2.onMatch === "function") {
          opts2.onMatch(result);
        }
        return returnObject ? result : true;
      };
      if (returnState) {
        matcher.state = state;
      }
      return matcher;
    };
    picomatch.test = (input, regex, options7, { glob, posix } = {}) => {
      if (typeof input !== "string") {
        throw new TypeError("Expected input to be a string");
      }
      if (input === "") {
        return { isMatch: false, output: "" };
      }
      const opts2 = options7 || {};
      const format3 = opts2.format || (posix ? utils.toPosixSlashes : null);
      let match2 = input === glob;
      let output = match2 && format3 ? format3(input) : input;
      if (match2 === false) {
        output = format3 ? format3(input) : input;
        match2 = output === glob;
      }
      if (match2 === false || opts2.capture === true) {
        if (opts2.matchBase === true || opts2.basename === true) {
          match2 = picomatch.matchBase(input, regex, options7, posix);
        } else {
          match2 = regex.exec(output);
        }
      }
      return { isMatch: Boolean(match2), match: match2, output };
    };
    picomatch.matchBase = (input, glob, options7, posix = utils.isWindows(options7)) => {
      const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options7);
      return regex.test(path17.basename(input));
    };
    picomatch.isMatch = (str, patterns, options7) => picomatch(patterns, options7)(str);
    picomatch.parse = (pattern, options7) => {
      if (Array.isArray(pattern)) return pattern.map((p) => picomatch.parse(p, options7));
      return parse10(pattern, { ...options7, fastpaths: false });
    };
    picomatch.scan = (input, options7) => scan(input, options7);
    picomatch.compileRe = (state, options7, returnOutput = false, returnState = false) => {
      if (returnOutput === true) {
        return state.output;
      }
      const opts2 = options7 || {};
      const prepend = opts2.contains ? "" : "^";
      const append = opts2.contains ? "" : "$";
      let source2 = `${prepend}(?:${state.output})${append}`;
      if (state && state.negated === true) {
        source2 = `^(?!${source2}).*$`;
      }
      const regex = picomatch.toRegex(source2, options7);
      if (returnState === true) {
        regex.state = state;
      }
      return regex;
    };
    picomatch.makeRe = (input, options7 = {}, returnOutput = false, returnState = false) => {
      if (!input || typeof input !== "string") {
        throw new TypeError("Expected a non-empty string");
      }
      let parsed = { negated: false, fastpaths: true };
      if (options7.fastpaths !== false && (input[0] === "." || input[0] === "*")) {
        parsed.output = parse10.fastpaths(input, options7);
      }
      if (!parsed.output) {
        parsed = parse10(input, options7);
      }
      return picomatch.compileRe(parsed, options7, returnOutput, returnState);
    };
    picomatch.toRegex = (source2, options7) => {
      try {
        const opts2 = options7 || {};
        return new RegExp(source2, opts2.flags || (opts2.nocase ? "i" : ""));
      } catch (err) {
        if (options7 && options7.debug === true) throw err;
        return /$^/;
      }
    };
    picomatch.constants = constants;
    module.exports = picomatch;
  }
});

// node_modules/micromatch/node_modules/picomatch/index.js
var require_picomatch2 = __commonJS({
  "node_modules/micromatch/node_modules/picomatch/index.js"(exports, module) {
    "use strict";
    module.exports = require_picomatch();
  }
});

// node_modules/micromatch/index.js
var require_micromatch = __commonJS({
  "node_modules/micromatch/index.js"(exports, module) {
    "use strict";
    var util3 = __require("util");
    var braces = require_braces();
    var picomatch = require_picomatch2();
    var utils = require_utils2();
    var isEmptyString = (v) => v === "" || v === "./";
    var hasBraces = (v) => {
      const index = v.indexOf("{");
      return index > -1 && v.indexOf("}", index) > -1;
    };
    var micromatch2 = (list, patterns, options7) => {
      patterns = [].concat(patterns);
      list = [].concat(list);
      let omit2 = /* @__PURE__ */ new Set();
      let keep = /* @__PURE__ */ new Set();
      let items = /* @__PURE__ */ new Set();
      let negatives = 0;
      let onResult = (state) => {
        items.add(state.output);
        if (options7 && options7.onResult) {
          options7.onResult(state);
        }
      };
      for (let i = 0; i < patterns.length; i++) {
        let isMatch = picomatch(String(patterns[i]), { ...options7, onResult }, true);
        let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
        if (negated) negatives++;
        for (let item of list) {
          let matched = isMatch(item, true);
          let match2 = negated ? !matched.isMatch : matched.isMatch;
          if (!match2) continue;
          if (negated) {
            omit2.add(matched.output);
          } else {
            omit2.delete(matched.output);
            keep.add(matched.output);
          }
        }
      }
      let result = negatives === patterns.length ? [...items] : [...keep];
      let matches = result.filter((item) => !omit2.has(item));
      if (options7 && matches.length === 0) {
        if (options7.failglob === true) {
          throw new Error(`No matches found for "${patterns.join(", ")}"`);
        }
        if (options7.nonull === true || options7.nullglob === true) {
          return options7.unescape ? patterns.map((p) => p.replace(/\\/g, "")) : patterns;
        }
      }
      return matches;
    };
    micromatch2.match = micromatch2;
    micromatch2.matcher = (pattern, options7) => picomatch(pattern, options7);
    micromatch2.isMatch = (str, patterns, options7) => picomatch(patterns, options7)(str);
    micromatch2.any = micromatch2.isMatch;
    micromatch2.not = (list, patterns, options7 = {}) => {
      patterns = [].concat(patterns).map(String);
      let result = /* @__PURE__ */ new Set();
      let items = [];
      let onResult = (state) => {
        if (options7.onResult) options7.onResult(state);
        items.push(state.output);
      };
      let matches = new Set(micromatch2(list, patterns, { ...options7, onResult }));
      for (let item of items) {
        if (!matches.has(item)) {
          result.add(item);
        }
      }
      return [...result];
    };
    micromatch2.contains = (str, pattern, options7) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util3.inspect(str)}"`);
      }
      if (Array.isArray(pattern)) {
        return pattern.some((p) => micromatch2.contains(str, p, options7));
      }
      if (typeof pattern === "string") {
        if (isEmptyString(str) || isEmptyString(pattern)) {
          return false;
        }
        if (str.includes(pattern) || str.startsWith("./") && str.slice(2).includes(pattern)) {
          return true;
        }
      }
      return micromatch2.isMatch(str, pattern, { ...options7, contains: true });
    };
    micromatch2.matchKeys = (obj, patterns, options7) => {
      if (!utils.isObject(obj)) {
        throw new TypeError("Expected the first argument to be an object");
      }
      let keys = micromatch2(Object.keys(obj), patterns, options7);
      let res = {};
      for (let key2 of keys) res[key2] = obj[key2];
      return res;
    };
    micromatch2.some = (list, patterns, options7) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options7);
        if (items.some((item) => isMatch(item))) {
          return true;
        }
      }
      return false;
    };
    micromatch2.every = (list, patterns, options7) => {
      let items = [].concat(list);
      for (let pattern of [].concat(patterns)) {
        let isMatch = picomatch(String(pattern), options7);
        if (!items.every((item) => isMatch(item))) {
          return false;
        }
      }
      return true;
    };
    micromatch2.all = (str, patterns, options7) => {
      if (typeof str !== "string") {
        throw new TypeError(`Expected a string: "${util3.inspect(str)}"`);
      }
      return [].concat(patterns).every((p) => picomatch(p, options7)(str));
    };
    micromatch2.capture = (glob, input, options7) => {
      let posix = utils.isWindows(options7);
      let regex = picomatch.makeRe(String(glob), { ...options7, capture: true });
      let match2 = regex.exec(posix ? utils.toPosixSlashes(input) : input);
      if (match2) {
        return match2.slice(1).map((v) => v === void 0 ? "" : v);
      }
    };
    micromatch2.makeRe = (...args) => picomatch.makeRe(...args);
    micromatch2.scan = (...args) => picomatch.scan(...args);
    micromatch2.parse = (patterns, options7) => {
      let res = [];
      for (let pattern of [].concat(patterns || [])) {
        for (let str of braces(String(pattern), options7)) {
          res.push(picomatch.parse(str, options7));
        }
      }
      return res;
    };
    micromatch2.braces = (pattern, options7) => {
      if (typeof pattern !== "string") throw new TypeError("Expected a string");
      if (options7 && options7.nobrace === true || !hasBraces(pattern)) {
        return [pattern];
      }
      return braces(pattern, options7);
    };
    micromatch2.braceExpand = (pattern, options7) => {
      if (typeof pattern !== "string") throw new TypeError("Expected a string");
      return micromatch2.braces(pattern, { ...options7, expand: true });
    };
    micromatch2.hasBraces = hasBraces;
    module.exports = micromatch2;
  }
});

// node_modules/fast-glob/out/utils/pattern.js
var require_pattern = __commonJS({
  "node_modules/fast-glob/out/utils/pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAbsolute = exports.partitionAbsoluteAndRelative = exports.removeDuplicateSlashes = exports.matchAny = exports.convertPatternsToRe = exports.makeRe = exports.getPatternParts = exports.expandBraceExpansion = exports.expandPatternsWithBraceExpansion = exports.isAffectDepthOfReadingPattern = exports.endsWithSlashGlobStar = exports.hasGlobStar = exports.getBaseDirectory = exports.isPatternRelatedToParentDirectory = exports.getPatternsOutsideCurrentDirectory = exports.getPatternsInsideCurrentDirectory = exports.getPositivePatterns = exports.getNegativePatterns = exports.isPositivePattern = exports.isNegativePattern = exports.convertToNegativePattern = exports.convertToPositivePattern = exports.isDynamicPattern = exports.isStaticPattern = void 0;
    var path17 = __require("path");
    var globParent = require_glob_parent();
    var micromatch2 = require_micromatch();
    var GLOBSTAR2 = "**";
    var ESCAPE_SYMBOL = "\\";
    var COMMON_GLOB_SYMBOLS_RE = /[*?]|^!/;
    var REGEX_CHARACTER_CLASS_SYMBOLS_RE = /\[[^[]*]/;
    var REGEX_GROUP_SYMBOLS_RE = /(?:^|[^!*+?@])\([^(]*\|[^|]*\)/;
    var GLOB_EXTENSION_SYMBOLS_RE = /[!*+?@]\([^(]*\)/;
    var BRACE_EXPANSION_SEPARATORS_RE = /,|\.\./;
    var DOUBLE_SLASH_RE = /(?!^)\/{2,}/g;
    function isStaticPattern(pattern, options7 = {}) {
      return !isDynamicPattern(pattern, options7);
    }
    exports.isStaticPattern = isStaticPattern;
    function isDynamicPattern(pattern, options7 = {}) {
      if (pattern === "") {
        return false;
      }
      if (options7.caseSensitiveMatch === false || pattern.includes(ESCAPE_SYMBOL)) {
        return true;
      }
      if (COMMON_GLOB_SYMBOLS_RE.test(pattern) || REGEX_CHARACTER_CLASS_SYMBOLS_RE.test(pattern) || REGEX_GROUP_SYMBOLS_RE.test(pattern)) {
        return true;
      }
      if (options7.extglob !== false && GLOB_EXTENSION_SYMBOLS_RE.test(pattern)) {
        return true;
      }
      if (options7.braceExpansion !== false && hasBraceExpansion(pattern)) {
        return true;
      }
      return false;
    }
    exports.isDynamicPattern = isDynamicPattern;
    function hasBraceExpansion(pattern) {
      const openingBraceIndex = pattern.indexOf("{");
      if (openingBraceIndex === -1) {
        return false;
      }
      const closingBraceIndex = pattern.indexOf("}", openingBraceIndex + 1);
      if (closingBraceIndex === -1) {
        return false;
      }
      const braceContent = pattern.slice(openingBraceIndex, closingBraceIndex);
      return BRACE_EXPANSION_SEPARATORS_RE.test(braceContent);
    }
    function convertToPositivePattern(pattern) {
      return isNegativePattern(pattern) ? pattern.slice(1) : pattern;
    }
    exports.convertToPositivePattern = convertToPositivePattern;
    function convertToNegativePattern(pattern) {
      return "!" + pattern;
    }
    exports.convertToNegativePattern = convertToNegativePattern;
    function isNegativePattern(pattern) {
      return pattern.startsWith("!") && pattern[1] !== "(";
    }
    exports.isNegativePattern = isNegativePattern;
    function isPositivePattern(pattern) {
      return !isNegativePattern(pattern);
    }
    exports.isPositivePattern = isPositivePattern;
    function getNegativePatterns(patterns) {
      return patterns.filter(isNegativePattern);
    }
    exports.getNegativePatterns = getNegativePatterns;
    function getPositivePatterns(patterns) {
      return patterns.filter(isPositivePattern);
    }
    exports.getPositivePatterns = getPositivePatterns;
    function getPatternsInsideCurrentDirectory(patterns) {
      return patterns.filter((pattern) => !isPatternRelatedToParentDirectory(pattern));
    }
    exports.getPatternsInsideCurrentDirectory = getPatternsInsideCurrentDirectory;
    function getPatternsOutsideCurrentDirectory(patterns) {
      return patterns.filter(isPatternRelatedToParentDirectory);
    }
    exports.getPatternsOutsideCurrentDirectory = getPatternsOutsideCurrentDirectory;
    function isPatternRelatedToParentDirectory(pattern) {
      return pattern.startsWith("..") || pattern.startsWith("./..");
    }
    exports.isPatternRelatedToParentDirectory = isPatternRelatedToParentDirectory;
    function getBaseDirectory(pattern) {
      return globParent(pattern, { flipBackslashes: false });
    }
    exports.getBaseDirectory = getBaseDirectory;
    function hasGlobStar(pattern) {
      return pattern.includes(GLOBSTAR2);
    }
    exports.hasGlobStar = hasGlobStar;
    function endsWithSlashGlobStar(pattern) {
      return pattern.endsWith("/" + GLOBSTAR2);
    }
    exports.endsWithSlashGlobStar = endsWithSlashGlobStar;
    function isAffectDepthOfReadingPattern(pattern) {
      const basename = path17.basename(pattern);
      return endsWithSlashGlobStar(pattern) || isStaticPattern(basename);
    }
    exports.isAffectDepthOfReadingPattern = isAffectDepthOfReadingPattern;
    function expandPatternsWithBraceExpansion(patterns) {
      return patterns.reduce((collection, pattern) => {
        return collection.concat(expandBraceExpansion(pattern));
      }, []);
    }
    exports.expandPatternsWithBraceExpansion = expandPatternsWithBraceExpansion;
    function expandBraceExpansion(pattern) {
      const patterns = micromatch2.braces(pattern, { expand: true, nodupes: true, keepEscaping: true });
      patterns.sort((a, b) => a.length - b.length);
      return patterns.filter((pattern2) => pattern2 !== "");
    }
    exports.expandBraceExpansion = expandBraceExpansion;
    function getPatternParts(pattern, options7) {
      let { parts } = micromatch2.scan(pattern, Object.assign(Object.assign({}, options7), { parts: true }));
      if (parts.length === 0) {
        parts = [pattern];
      }
      if (parts[0].startsWith("/")) {
        parts[0] = parts[0].slice(1);
        parts.unshift("");
      }
      return parts;
    }
    exports.getPatternParts = getPatternParts;
    function makeRe2(pattern, options7) {
      return micromatch2.makeRe(pattern, options7);
    }
    exports.makeRe = makeRe2;
    function convertPatternsToRe(patterns, options7) {
      return patterns.map((pattern) => makeRe2(pattern, options7));
    }
    exports.convertPatternsToRe = convertPatternsToRe;
    function matchAny(entry, patternsRe) {
      return patternsRe.some((patternRe) => patternRe.test(entry));
    }
    exports.matchAny = matchAny;
    function removeDuplicateSlashes(pattern) {
      return pattern.replace(DOUBLE_SLASH_RE, "/");
    }
    exports.removeDuplicateSlashes = removeDuplicateSlashes;
    function partitionAbsoluteAndRelative(patterns) {
      const absolute = [];
      const relative2 = [];
      for (const pattern of patterns) {
        if (isAbsolute(pattern)) {
          absolute.push(pattern);
        } else {
          relative2.push(pattern);
        }
      }
      return [absolute, relative2];
    }
    exports.partitionAbsoluteAndRelative = partitionAbsoluteAndRelative;
    function isAbsolute(pattern) {
      return path17.isAbsolute(pattern);
    }
    exports.isAbsolute = isAbsolute;
  }
});

// node_modules/merge2/index.js
var require_merge2 = __commonJS({
  "node_modules/merge2/index.js"(exports, module) {
    "use strict";
    var Stream = __require("stream");
    var PassThrough = Stream.PassThrough;
    var slice = Array.prototype.slice;
    module.exports = merge2;
    function merge2() {
      const streamsQueue = [];
      const args = slice.call(arguments);
      let merging = false;
      let options7 = args[args.length - 1];
      if (options7 && !Array.isArray(options7) && options7.pipe == null) {
        args.pop();
      } else {
        options7 = {};
      }
      const doEnd = options7.end !== false;
      const doPipeError = options7.pipeError === true;
      if (options7.objectMode == null) {
        options7.objectMode = true;
      }
      if (options7.highWaterMark == null) {
        options7.highWaterMark = 64 * 1024;
      }
      const mergedStream = PassThrough(options7);
      function addStream() {
        for (let i = 0, len = arguments.length; i < len; i++) {
          streamsQueue.push(pauseStreams(arguments[i], options7));
        }
        mergeStream();
        return this;
      }
      function mergeStream() {
        if (merging) {
          return;
        }
        merging = true;
        let streams = streamsQueue.shift();
        if (!streams) {
          process.nextTick(endStream);
          return;
        }
        if (!Array.isArray(streams)) {
          streams = [streams];
        }
        let pipesCount = streams.length + 1;
        function next() {
          if (--pipesCount > 0) {
            return;
          }
          merging = false;
          mergeStream();
        }
        function pipe(stream) {
          function onend() {
            stream.removeListener("merge2UnpipeEnd", onend);
            stream.removeListener("end", onend);
            if (doPipeError) {
              stream.removeListener("error", onerror);
            }
            next();
          }
          function onerror(err) {
            mergedStream.emit("error", err);
          }
          if (stream._readableState.endEmitted) {
            return next();
          }
          stream.on("merge2UnpipeEnd", onend);
          stream.on("end", onend);
          if (doPipeError) {
            stream.on("error", onerror);
          }
          stream.pipe(mergedStream, { end: false });
          stream.resume();
        }
        for (let i = 0; i < streams.length; i++) {
          pipe(streams[i]);
        }
        next();
      }
      function endStream() {
        merging = false;
        mergedStream.emit("queueDrain");
        if (doEnd) {
          mergedStream.end();
        }
      }
      mergedStream.setMaxListeners(0);
      mergedStream.add = addStream;
      mergedStream.on("unpipe", function(stream) {
        stream.emit("merge2UnpipeEnd");
      });
      if (args.length) {
        addStream.apply(null, args);
      }
      return mergedStream;
    }
    function pauseStreams(streams, options7) {
      if (!Array.isArray(streams)) {
        if (!streams._readableState && streams.pipe) {
          streams = streams.pipe(PassThrough(options7));
        }
        if (!streams._readableState || !streams.pause || !streams.pipe) {
          throw new Error("Only readable stream can be merged.");
        }
        streams.pause();
      } else {
        for (let i = 0, len = streams.length; i < len; i++) {
          streams[i] = pauseStreams(streams[i], options7);
        }
      }
      return streams;
    }
  }
});

// node_modules/fast-glob/out/utils/stream.js
var require_stream = __commonJS({
  "node_modules/fast-glob/out/utils/stream.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    var merge2 = require_merge2();
    function merge(streams) {
      const mergedStream = merge2(streams);
      streams.forEach((stream) => {
        stream.once("error", (error) => mergedStream.emit("error", error));
      });
      mergedStream.once("close", () => propagateCloseEventToSources(streams));
      mergedStream.once("end", () => propagateCloseEventToSources(streams));
      return mergedStream;
    }
    exports.merge = merge;
    function propagateCloseEventToSources(streams) {
      streams.forEach((stream) => stream.emit("close"));
    }
  }
});

// node_modules/fast-glob/out/utils/string.js
var require_string = __commonJS({
  "node_modules/fast-glob/out/utils/string.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isEmpty = exports.isString = void 0;
    function isString(input) {
      return typeof input === "string";
    }
    exports.isString = isString;
    function isEmpty(input) {
      return input === "";
    }
    exports.isEmpty = isEmpty;
  }
});

// node_modules/fast-glob/out/utils/index.js
var require_utils3 = __commonJS({
  "node_modules/fast-glob/out/utils/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.string = exports.stream = exports.pattern = exports.path = exports.fs = exports.errno = exports.array = void 0;
    var array2 = require_array();
    exports.array = array2;
    var errno = require_errno();
    exports.errno = errno;
    var fs6 = require_fs();
    exports.fs = fs6;
    var path17 = require_path();
    exports.path = path17;
    var pattern = require_pattern();
    exports.pattern = pattern;
    var stream = require_stream();
    exports.stream = stream;
    var string = require_string();
    exports.string = string;
  }
});

// node_modules/fast-glob/out/managers/tasks.js
var require_tasks = __commonJS({
  "node_modules/fast-glob/out/managers/tasks.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.convertPatternGroupToTask = exports.convertPatternGroupsToTasks = exports.groupPatternsByBaseDirectory = exports.getNegativePatternsAsPositive = exports.getPositivePatterns = exports.convertPatternsToTasks = exports.generate = void 0;
    var utils = require_utils3();
    function generate(input, settings) {
      const patterns = processPatterns(input, settings);
      const ignore = processPatterns(settings.ignore, settings);
      const positivePatterns = getPositivePatterns(patterns);
      const negativePatterns = getNegativePatternsAsPositive(patterns, ignore);
      const staticPatterns = positivePatterns.filter((pattern) => utils.pattern.isStaticPattern(pattern, settings));
      const dynamicPatterns = positivePatterns.filter((pattern) => utils.pattern.isDynamicPattern(pattern, settings));
      const staticTasks = convertPatternsToTasks(
        staticPatterns,
        negativePatterns,
        /* dynamic */
        false
      );
      const dynamicTasks = convertPatternsToTasks(
        dynamicPatterns,
        negativePatterns,
        /* dynamic */
        true
      );
      return staticTasks.concat(dynamicTasks);
    }
    exports.generate = generate;
    function processPatterns(input, settings) {
      let patterns = input;
      if (settings.braceExpansion) {
        patterns = utils.pattern.expandPatternsWithBraceExpansion(patterns);
      }
      if (settings.baseNameMatch) {
        patterns = patterns.map((pattern) => pattern.includes("/") ? pattern : `**/${pattern}`);
      }
      return patterns.map((pattern) => utils.pattern.removeDuplicateSlashes(pattern));
    }
    function convertPatternsToTasks(positive, negative, dynamic) {
      const tasks = [];
      const patternsOutsideCurrentDirectory = utils.pattern.getPatternsOutsideCurrentDirectory(positive);
      const patternsInsideCurrentDirectory = utils.pattern.getPatternsInsideCurrentDirectory(positive);
      const outsideCurrentDirectoryGroup = groupPatternsByBaseDirectory(patternsOutsideCurrentDirectory);
      const insideCurrentDirectoryGroup = groupPatternsByBaseDirectory(patternsInsideCurrentDirectory);
      tasks.push(...convertPatternGroupsToTasks(outsideCurrentDirectoryGroup, negative, dynamic));
      if ("." in insideCurrentDirectoryGroup) {
        tasks.push(convertPatternGroupToTask(".", patternsInsideCurrentDirectory, negative, dynamic));
      } else {
        tasks.push(...convertPatternGroupsToTasks(insideCurrentDirectoryGroup, negative, dynamic));
      }
      return tasks;
    }
    exports.convertPatternsToTasks = convertPatternsToTasks;
    function getPositivePatterns(patterns) {
      return utils.pattern.getPositivePatterns(patterns);
    }
    exports.getPositivePatterns = getPositivePatterns;
    function getNegativePatternsAsPositive(patterns, ignore) {
      const negative = utils.pattern.getNegativePatterns(patterns).concat(ignore);
      const positive = negative.map(utils.pattern.convertToPositivePattern);
      return positive;
    }
    exports.getNegativePatternsAsPositive = getNegativePatternsAsPositive;
    function groupPatternsByBaseDirectory(patterns) {
      const group = {};
      return patterns.reduce((collection, pattern) => {
        const base = utils.pattern.getBaseDirectory(pattern);
        if (base in collection) {
          collection[base].push(pattern);
        } else {
          collection[base] = [pattern];
        }
        return collection;
      }, group);
    }
    exports.groupPatternsByBaseDirectory = groupPatternsByBaseDirectory;
    function convertPatternGroupsToTasks(positive, negative, dynamic) {
      return Object.keys(positive).map((base) => {
        return convertPatternGroupToTask(base, positive[base], negative, dynamic);
      });
    }
    exports.convertPatternGroupsToTasks = convertPatternGroupsToTasks;
    function convertPatternGroupToTask(base, positive, negative, dynamic) {
      return {
        dynamic,
        positive,
        negative,
        base,
        patterns: [].concat(positive, negative.map(utils.pattern.convertToNegativePattern))
      };
    }
    exports.convertPatternGroupToTask = convertPatternGroupToTask;
  }
});

// node_modules/@nodelib/fs.stat/out/providers/async.js
var require_async = __commonJS({
  "node_modules/@nodelib/fs.stat/out/providers/async.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.read = void 0;
    function read3(path17, settings, callback) {
      settings.fs.lstat(path17, (lstatError, lstat2) => {
        if (lstatError !== null) {
          callFailureCallback(callback, lstatError);
          return;
        }
        if (!lstat2.isSymbolicLink() || !settings.followSymbolicLink) {
          callSuccessCallback(callback, lstat2);
          return;
        }
        settings.fs.stat(path17, (statError, stat2) => {
          if (statError !== null) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              callFailureCallback(callback, statError);
              return;
            }
            callSuccessCallback(callback, lstat2);
            return;
          }
          if (settings.markSymbolicLink) {
            stat2.isSymbolicLink = () => true;
          }
          callSuccessCallback(callback, stat2);
        });
      });
    }
    exports.read = read3;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, result) {
      callback(null, result);
    }
  }
});

// node_modules/@nodelib/fs.stat/out/providers/sync.js
var require_sync = __commonJS({
  "node_modules/@nodelib/fs.stat/out/providers/sync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.read = void 0;
    function read3(path17, settings) {
      const lstat2 = settings.fs.lstatSync(path17);
      if (!lstat2.isSymbolicLink() || !settings.followSymbolicLink) {
        return lstat2;
      }
      try {
        const stat2 = settings.fs.statSync(path17);
        if (settings.markSymbolicLink) {
          stat2.isSymbolicLink = () => true;
        }
        return stat2;
      } catch (error) {
        if (!settings.throwErrorOnBrokenSymbolicLink) {
          return lstat2;
        }
        throw error;
      }
    }
    exports.read = read3;
  }
});

// node_modules/@nodelib/fs.stat/out/adapters/fs.js
var require_fs2 = __commonJS({
  "node_modules/@nodelib/fs.stat/out/adapters/fs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFileSystemAdapter = exports.FILE_SYSTEM_ADAPTER = void 0;
    var fs6 = __require("fs");
    exports.FILE_SYSTEM_ADAPTER = {
      lstat: fs6.lstat,
      stat: fs6.stat,
      lstatSync: fs6.lstatSync,
      statSync: fs6.statSync
    };
    function createFileSystemAdapter(fsMethods) {
      if (fsMethods === void 0) {
        return exports.FILE_SYSTEM_ADAPTER;
      }
      return Object.assign(Object.assign({}, exports.FILE_SYSTEM_ADAPTER), fsMethods);
    }
    exports.createFileSystemAdapter = createFileSystemAdapter;
  }
});

// node_modules/@nodelib/fs.stat/out/settings.js
var require_settings = __commonJS({
  "node_modules/@nodelib/fs.stat/out/settings.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fs6 = require_fs2();
    var Settings = class {
      constructor(_options2 = {}) {
        this._options = _options2;
        this.followSymbolicLink = this._getValue(this._options.followSymbolicLink, true);
        this.fs = fs6.createFileSystemAdapter(this._options.fs);
        this.markSymbolicLink = this._getValue(this._options.markSymbolicLink, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports.default = Settings;
  }
});

// node_modules/@nodelib/fs.stat/out/index.js
var require_out = __commonJS({
  "node_modules/@nodelib/fs.stat/out/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.statSync = exports.stat = exports.Settings = void 0;
    var async = require_async();
    var sync = require_sync();
    var settings_1 = require_settings();
    exports.Settings = settings_1.default;
    function stat2(path17, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        async.read(path17, getSettings(), optionsOrSettingsOrCallback);
        return;
      }
      async.read(path17, getSettings(optionsOrSettingsOrCallback), callback);
    }
    exports.stat = stat2;
    function statSync2(path17, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      return sync.read(path17, settings);
    }
    exports.statSync = statSync2;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// node_modules/queue-microtask/index.js
var require_queue_microtask = __commonJS({
  "node_modules/queue-microtask/index.js"(exports, module) {
    var promise;
    module.exports = typeof queueMicrotask === "function" ? queueMicrotask.bind(typeof window !== "undefined" ? window : global) : (cb) => (promise || (promise = Promise.resolve())).then(cb).catch((err) => setTimeout(() => {
      throw err;
    }, 0));
  }
});

// node_modules/run-parallel/index.js
var require_run_parallel = __commonJS({
  "node_modules/run-parallel/index.js"(exports, module) {
    module.exports = runParallel;
    var queueMicrotask2 = require_queue_microtask();
    function runParallel(tasks, cb) {
      let results, pending, keys;
      let isSync = true;
      if (Array.isArray(tasks)) {
        results = [];
        pending = tasks.length;
      } else {
        keys = Object.keys(tasks);
        results = {};
        pending = keys.length;
      }
      function done(err) {
        function end() {
          if (cb) cb(err, results);
          cb = null;
        }
        if (isSync) queueMicrotask2(end);
        else end();
      }
      function each(i, err, result) {
        results[i] = result;
        if (--pending === 0 || err) {
          done(err);
        }
      }
      if (!pending) {
        done(null);
      } else if (keys) {
        keys.forEach(function(key2) {
          tasks[key2](function(err, result) {
            each(key2, err, result);
          });
        });
      } else {
        tasks.forEach(function(task, i) {
          task(function(err, result) {
            each(i, err, result);
          });
        });
      }
      isSync = false;
    }
  }
});

// node_modules/@nodelib/fs.scandir/out/constants.js
var require_constants3 = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/constants.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IS_SUPPORT_READDIR_WITH_FILE_TYPES = void 0;
    var NODE_PROCESS_VERSION_PARTS = process.versions.node.split(".");
    if (NODE_PROCESS_VERSION_PARTS[0] === void 0 || NODE_PROCESS_VERSION_PARTS[1] === void 0) {
      throw new Error(`Unexpected behavior. The 'process.versions.node' variable has invalid value: ${process.versions.node}`);
    }
    var MAJOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[0], 10);
    var MINOR_VERSION = Number.parseInt(NODE_PROCESS_VERSION_PARTS[1], 10);
    var SUPPORTED_MAJOR_VERSION = 10;
    var SUPPORTED_MINOR_VERSION = 10;
    var IS_MATCHED_BY_MAJOR = MAJOR_VERSION > SUPPORTED_MAJOR_VERSION;
    var IS_MATCHED_BY_MAJOR_AND_MINOR = MAJOR_VERSION === SUPPORTED_MAJOR_VERSION && MINOR_VERSION >= SUPPORTED_MINOR_VERSION;
    exports.IS_SUPPORT_READDIR_WITH_FILE_TYPES = IS_MATCHED_BY_MAJOR || IS_MATCHED_BY_MAJOR_AND_MINOR;
  }
});

// node_modules/@nodelib/fs.scandir/out/utils/fs.js
var require_fs3 = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/utils/fs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDirentFromStats = void 0;
    var DirentFromStats = class {
      constructor(name, stats) {
        this.name = name;
        this.isBlockDevice = stats.isBlockDevice.bind(stats);
        this.isCharacterDevice = stats.isCharacterDevice.bind(stats);
        this.isDirectory = stats.isDirectory.bind(stats);
        this.isFIFO = stats.isFIFO.bind(stats);
        this.isFile = stats.isFile.bind(stats);
        this.isSocket = stats.isSocket.bind(stats);
        this.isSymbolicLink = stats.isSymbolicLink.bind(stats);
      }
    };
    function createDirentFromStats(name, stats) {
      return new DirentFromStats(name, stats);
    }
    exports.createDirentFromStats = createDirentFromStats;
  }
});

// node_modules/@nodelib/fs.scandir/out/utils/index.js
var require_utils4 = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/utils/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fs = void 0;
    var fs6 = require_fs3();
    exports.fs = fs6;
  }
});

// node_modules/@nodelib/fs.scandir/out/providers/common.js
var require_common = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/providers/common.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.joinPathSegments = void 0;
    function joinPathSegments(a, b, separator) {
      if (a.endsWith(separator)) {
        return a + b;
      }
      return a + separator + b;
    }
    exports.joinPathSegments = joinPathSegments;
  }
});

// node_modules/@nodelib/fs.scandir/out/providers/async.js
var require_async2 = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/providers/async.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readdir = exports.readdirWithFileTypes = exports.read = void 0;
    var fsStat = require_out();
    var rpl = require_run_parallel();
    var constants_1 = require_constants3();
    var utils = require_utils4();
    var common = require_common();
    function read3(directory, settings, callback) {
      if (!settings.stats && constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
        readdirWithFileTypes(directory, settings, callback);
        return;
      }
      readdir(directory, settings, callback);
    }
    exports.read = read3;
    function readdirWithFileTypes(directory, settings, callback) {
      settings.fs.readdir(directory, { withFileTypes: true }, (readdirError, dirents) => {
        if (readdirError !== null) {
          callFailureCallback(callback, readdirError);
          return;
        }
        const entries = dirents.map((dirent) => ({
          dirent,
          name: dirent.name,
          path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
        }));
        if (!settings.followSymbolicLinks) {
          callSuccessCallback(callback, entries);
          return;
        }
        const tasks = entries.map((entry) => makeRplTaskEntry(entry, settings));
        rpl(tasks, (rplError, rplEntries) => {
          if (rplError !== null) {
            callFailureCallback(callback, rplError);
            return;
          }
          callSuccessCallback(callback, rplEntries);
        });
      });
    }
    exports.readdirWithFileTypes = readdirWithFileTypes;
    function makeRplTaskEntry(entry, settings) {
      return (done) => {
        if (!entry.dirent.isSymbolicLink()) {
          done(null, entry);
          return;
        }
        settings.fs.stat(entry.path, (statError, stats) => {
          if (statError !== null) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              done(statError);
              return;
            }
            done(null, entry);
            return;
          }
          entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
          done(null, entry);
        });
      };
    }
    function readdir(directory, settings, callback) {
      settings.fs.readdir(directory, (readdirError, names) => {
        if (readdirError !== null) {
          callFailureCallback(callback, readdirError);
          return;
        }
        const tasks = names.map((name) => {
          const path17 = common.joinPathSegments(directory, name, settings.pathSegmentSeparator);
          return (done) => {
            fsStat.stat(path17, settings.fsStatSettings, (error, stats) => {
              if (error !== null) {
                done(error);
                return;
              }
              const entry = {
                name,
                path: path17,
                dirent: utils.fs.createDirentFromStats(name, stats)
              };
              if (settings.stats) {
                entry.stats = stats;
              }
              done(null, entry);
            });
          };
        });
        rpl(tasks, (rplError, entries) => {
          if (rplError !== null) {
            callFailureCallback(callback, rplError);
            return;
          }
          callSuccessCallback(callback, entries);
        });
      });
    }
    exports.readdir = readdir;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, result) {
      callback(null, result);
    }
  }
});

// node_modules/@nodelib/fs.scandir/out/providers/sync.js
var require_sync2 = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/providers/sync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.readdir = exports.readdirWithFileTypes = exports.read = void 0;
    var fsStat = require_out();
    var constants_1 = require_constants3();
    var utils = require_utils4();
    var common = require_common();
    function read3(directory, settings) {
      if (!settings.stats && constants_1.IS_SUPPORT_READDIR_WITH_FILE_TYPES) {
        return readdirWithFileTypes(directory, settings);
      }
      return readdir(directory, settings);
    }
    exports.read = read3;
    function readdirWithFileTypes(directory, settings) {
      const dirents = settings.fs.readdirSync(directory, { withFileTypes: true });
      return dirents.map((dirent) => {
        const entry = {
          dirent,
          name: dirent.name,
          path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator)
        };
        if (entry.dirent.isSymbolicLink() && settings.followSymbolicLinks) {
          try {
            const stats = settings.fs.statSync(entry.path);
            entry.dirent = utils.fs.createDirentFromStats(entry.name, stats);
          } catch (error) {
            if (settings.throwErrorOnBrokenSymbolicLink) {
              throw error;
            }
          }
        }
        return entry;
      });
    }
    exports.readdirWithFileTypes = readdirWithFileTypes;
    function readdir(directory, settings) {
      const names = settings.fs.readdirSync(directory);
      return names.map((name) => {
        const entryPath = common.joinPathSegments(directory, name, settings.pathSegmentSeparator);
        const stats = fsStat.statSync(entryPath, settings.fsStatSettings);
        const entry = {
          name,
          path: entryPath,
          dirent: utils.fs.createDirentFromStats(name, stats)
        };
        if (settings.stats) {
          entry.stats = stats;
        }
        return entry;
      });
    }
    exports.readdir = readdir;
  }
});

// node_modules/@nodelib/fs.scandir/out/adapters/fs.js
var require_fs4 = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/adapters/fs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFileSystemAdapter = exports.FILE_SYSTEM_ADAPTER = void 0;
    var fs6 = __require("fs");
    exports.FILE_SYSTEM_ADAPTER = {
      lstat: fs6.lstat,
      stat: fs6.stat,
      lstatSync: fs6.lstatSync,
      statSync: fs6.statSync,
      readdir: fs6.readdir,
      readdirSync: fs6.readdirSync
    };
    function createFileSystemAdapter(fsMethods) {
      if (fsMethods === void 0) {
        return exports.FILE_SYSTEM_ADAPTER;
      }
      return Object.assign(Object.assign({}, exports.FILE_SYSTEM_ADAPTER), fsMethods);
    }
    exports.createFileSystemAdapter = createFileSystemAdapter;
  }
});

// node_modules/@nodelib/fs.scandir/out/settings.js
var require_settings2 = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/settings.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var path17 = __require("path");
    var fsStat = require_out();
    var fs6 = require_fs4();
    var Settings = class {
      constructor(_options2 = {}) {
        this._options = _options2;
        this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, false);
        this.fs = fs6.createFileSystemAdapter(this._options.fs);
        this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path17.sep);
        this.stats = this._getValue(this._options.stats, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, true);
        this.fsStatSettings = new fsStat.Settings({
          followSymbolicLink: this.followSymbolicLinks,
          fs: this.fs,
          throwErrorOnBrokenSymbolicLink: this.throwErrorOnBrokenSymbolicLink
        });
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports.default = Settings;
  }
});

// node_modules/@nodelib/fs.scandir/out/index.js
var require_out2 = __commonJS({
  "node_modules/@nodelib/fs.scandir/out/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Settings = exports.scandirSync = exports.scandir = void 0;
    var async = require_async2();
    var sync = require_sync2();
    var settings_1 = require_settings2();
    exports.Settings = settings_1.default;
    function scandir(path17, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        async.read(path17, getSettings(), optionsOrSettingsOrCallback);
        return;
      }
      async.read(path17, getSettings(optionsOrSettingsOrCallback), callback);
    }
    exports.scandir = scandir;
    function scandirSync(path17, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      return sync.read(path17, settings);
    }
    exports.scandirSync = scandirSync;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// node_modules/reusify/reusify.js
var require_reusify = __commonJS({
  "node_modules/reusify/reusify.js"(exports, module) {
    "use strict";
    function reusify(Constructor) {
      var head = new Constructor();
      var tail = head;
      function get() {
        var current = head;
        if (current.next) {
          head = current.next;
        } else {
          head = new Constructor();
          tail = head;
        }
        current.next = null;
        return current;
      }
      function release(obj) {
        tail.next = obj;
        tail = obj;
      }
      return {
        get,
        release
      };
    }
    module.exports = reusify;
  }
});

// node_modules/fastq/queue.js
var require_queue = __commonJS({
  "node_modules/fastq/queue.js"(exports, module) {
    "use strict";
    var reusify = require_reusify();
    function fastqueue(context, worker, _concurrency) {
      if (typeof context === "function") {
        _concurrency = worker;
        worker = context;
        context = null;
      }
      if (!(_concurrency >= 1)) {
        throw new Error("fastqueue concurrency must be equal to or greater than 1");
      }
      var cache4 = reusify(Task);
      var queueHead = null;
      var queueTail = null;
      var _running = 0;
      var errorHandler = null;
      var self = {
        push: push2,
        drain: noop2,
        saturated: noop2,
        pause,
        paused: false,
        get concurrency() {
          return _concurrency;
        },
        set concurrency(value) {
          if (!(value >= 1)) {
            throw new Error("fastqueue concurrency must be equal to or greater than 1");
          }
          _concurrency = value;
          if (self.paused) return;
          for (; queueHead && _running < _concurrency; ) {
            _running++;
            release();
          }
        },
        running,
        resume,
        idle,
        length,
        getQueue,
        unshift,
        empty: noop2,
        kill,
        killAndDrain,
        error,
        abort
      };
      return self;
      function running() {
        return _running;
      }
      function pause() {
        self.paused = true;
      }
      function length() {
        var current = queueHead;
        var counter = 0;
        while (current) {
          current = current.next;
          counter++;
        }
        return counter;
      }
      function getQueue() {
        var current = queueHead;
        var tasks = [];
        while (current) {
          tasks.push(current.value);
          current = current.next;
        }
        return tasks;
      }
      function resume() {
        if (!self.paused) return;
        self.paused = false;
        if (queueHead === null) {
          _running++;
          release();
          return;
        }
        for (; queueHead && _running < _concurrency; ) {
          _running++;
          release();
        }
      }
      function idle() {
        return _running === 0 && self.length() === 0;
      }
      function push2(value, done) {
        var current = cache4.get();
        current.context = context;
        current.release = release;
        current.value = value;
        current.callback = done || noop2;
        current.errorHandler = errorHandler;
        if (_running >= _concurrency || self.paused) {
          if (queueTail) {
            queueTail.next = current;
            queueTail = current;
          } else {
            queueHead = current;
            queueTail = current;
            self.saturated();
          }
        } else {
          _running++;
          worker.call(context, current.value, current.worked);
        }
      }
      function unshift(value, done) {
        var current = cache4.get();
        current.context = context;
        current.release = release;
        current.value = value;
        current.callback = done || noop2;
        current.errorHandler = errorHandler;
        if (_running >= _concurrency || self.paused) {
          if (queueHead) {
            current.next = queueHead;
            queueHead = current;
          } else {
            queueHead = current;
            queueTail = current;
            self.saturated();
          }
        } else {
          _running++;
          worker.call(context, current.value, current.worked);
        }
      }
      function release(holder) {
        if (holder) {
          cache4.release(holder);
        }
        var next = queueHead;
        if (next && _running <= _concurrency) {
          if (!self.paused) {
            if (queueTail === queueHead) {
              queueTail = null;
            }
            queueHead = next.next;
            next.next = null;
            worker.call(context, next.value, next.worked);
            if (queueTail === null) {
              self.empty();
            }
          } else {
            _running--;
          }
        } else if (--_running === 0) {
          self.drain();
        }
      }
      function kill() {
        queueHead = null;
        queueTail = null;
        self.drain = noop2;
      }
      function killAndDrain() {
        queueHead = null;
        queueTail = null;
        self.drain();
        self.drain = noop2;
      }
      function abort() {
        var current = queueHead;
        queueHead = null;
        queueTail = null;
        while (current) {
          var next = current.next;
          var callback = current.callback;
          var errorHandler2 = current.errorHandler;
          var val = current.value;
          var context2 = current.context;
          current.value = null;
          current.callback = noop2;
          current.errorHandler = null;
          if (errorHandler2) {
            errorHandler2(new Error("abort"), val);
          }
          callback.call(context2, new Error("abort"));
          current.release(current);
          current = next;
        }
        self.drain = noop2;
      }
      function error(handler) {
        errorHandler = handler;
      }
    }
    function noop2() {
    }
    function Task() {
      this.value = null;
      this.callback = noop2;
      this.next = null;
      this.release = noop2;
      this.context = null;
      this.errorHandler = null;
      var self = this;
      this.worked = function worked(err, result) {
        var callback = self.callback;
        var errorHandler = self.errorHandler;
        var val = self.value;
        self.value = null;
        self.callback = noop2;
        if (self.errorHandler) {
          errorHandler(err, val);
        }
        callback.call(self.context, err, result);
        self.release(self);
      };
    }
    function queueAsPromised(context, worker, _concurrency) {
      if (typeof context === "function") {
        _concurrency = worker;
        worker = context;
        context = null;
      }
      function asyncWrapper(arg, cb) {
        worker.call(this, arg).then(function(res) {
          cb(null, res);
        }, cb);
      }
      var queue = fastqueue(context, asyncWrapper, _concurrency);
      var pushCb = queue.push;
      var unshiftCb = queue.unshift;
      queue.push = push2;
      queue.unshift = unshift;
      queue.drained = drained;
      return queue;
      function push2(value) {
        var p = new Promise(function(resolve4, reject) {
          pushCb(value, function(err, result) {
            if (err) {
              reject(err);
              return;
            }
            resolve4(result);
          });
        });
        p.catch(noop2);
        return p;
      }
      function unshift(value) {
        var p = new Promise(function(resolve4, reject) {
          unshiftCb(value, function(err, result) {
            if (err) {
              reject(err);
              return;
            }
            resolve4(result);
          });
        });
        p.catch(noop2);
        return p;
      }
      function drained() {
        var p = new Promise(function(resolve4) {
          process.nextTick(function() {
            if (queue.idle()) {
              resolve4();
            } else {
              var previousDrain = queue.drain;
              queue.drain = function() {
                if (typeof previousDrain === "function") previousDrain();
                resolve4();
                queue.drain = previousDrain;
              };
            }
          });
        });
        return p;
      }
    }
    module.exports = fastqueue;
    module.exports.promise = queueAsPromised;
  }
});

// node_modules/@nodelib/fs.walk/out/readers/common.js
var require_common2 = __commonJS({
  "node_modules/@nodelib/fs.walk/out/readers/common.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.joinPathSegments = exports.replacePathSegmentSeparator = exports.isAppliedFilter = exports.isFatalError = void 0;
    function isFatalError(settings, error) {
      if (settings.errorFilter === null) {
        return true;
      }
      return !settings.errorFilter(error);
    }
    exports.isFatalError = isFatalError;
    function isAppliedFilter(filter2, value) {
      return filter2 === null || filter2(value);
    }
    exports.isAppliedFilter = isAppliedFilter;
    function replacePathSegmentSeparator(filepath, separator) {
      return filepath.split(/[/\\]/).join(separator);
    }
    exports.replacePathSegmentSeparator = replacePathSegmentSeparator;
    function joinPathSegments(a, b, separator) {
      if (a === "") {
        return b;
      }
      if (a.endsWith(separator)) {
        return a + b;
      }
      return a + separator + b;
    }
    exports.joinPathSegments = joinPathSegments;
  }
});

// node_modules/@nodelib/fs.walk/out/readers/reader.js
var require_reader = __commonJS({
  "node_modules/@nodelib/fs.walk/out/readers/reader.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var common = require_common2();
    var Reader = class {
      constructor(_root2, _settings) {
        this._root = _root2;
        this._settings = _settings;
        this._root = common.replacePathSegmentSeparator(_root2, _settings.pathSegmentSeparator);
      }
    };
    exports.default = Reader;
  }
});

// node_modules/@nodelib/fs.walk/out/readers/async.js
var require_async3 = __commonJS({
  "node_modules/@nodelib/fs.walk/out/readers/async.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var events_1 = __require("events");
    var fsScandir = require_out2();
    var fastq = require_queue();
    var common = require_common2();
    var reader_1 = require_reader();
    var AsyncReader = class extends reader_1.default {
      constructor(_root2, _settings) {
        super(_root2, _settings);
        this._settings = _settings;
        this._scandir = fsScandir.scandir;
        this._emitter = new events_1.EventEmitter();
        this._queue = fastq(this._worker.bind(this), this._settings.concurrency);
        this._isFatalError = false;
        this._isDestroyed = false;
        this._queue.drain = () => {
          if (!this._isFatalError) {
            this._emitter.emit("end");
          }
        };
      }
      read() {
        this._isFatalError = false;
        this._isDestroyed = false;
        setImmediate(() => {
          this._pushToQueue(this._root, this._settings.basePath);
        });
        return this._emitter;
      }
      get isDestroyed() {
        return this._isDestroyed;
      }
      destroy() {
        if (this._isDestroyed) {
          throw new Error("The reader is already destroyed");
        }
        this._isDestroyed = true;
        this._queue.killAndDrain();
      }
      onEntry(callback) {
        this._emitter.on("entry", callback);
      }
      onError(callback) {
        this._emitter.once("error", callback);
      }
      onEnd(callback) {
        this._emitter.once("end", callback);
      }
      _pushToQueue(directory, base) {
        const queueItem = { directory, base };
        this._queue.push(queueItem, (error) => {
          if (error !== null) {
            this._handleError(error);
          }
        });
      }
      _worker(item, done) {
        this._scandir(item.directory, this._settings.fsScandirSettings, (error, entries) => {
          if (error !== null) {
            done(error, void 0);
            return;
          }
          for (const entry of entries) {
            this._handleEntry(entry, item.base);
          }
          done(null, void 0);
        });
      }
      _handleError(error) {
        if (this._isDestroyed || !common.isFatalError(this._settings, error)) {
          return;
        }
        this._isFatalError = true;
        this._isDestroyed = true;
        this._emitter.emit("error", error);
      }
      _handleEntry(entry, base) {
        if (this._isDestroyed || this._isFatalError) {
          return;
        }
        const fullpath = entry.path;
        if (base !== void 0) {
          entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
          this._emitEntry(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
          this._pushToQueue(fullpath, base === void 0 ? void 0 : entry.path);
        }
      }
      _emitEntry(entry) {
        this._emitter.emit("entry", entry);
      }
    };
    exports.default = AsyncReader;
  }
});

// node_modules/@nodelib/fs.walk/out/providers/async.js
var require_async4 = __commonJS({
  "node_modules/@nodelib/fs.walk/out/providers/async.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var async_1 = require_async3();
    var AsyncProvider = class {
      constructor(_root2, _settings) {
        this._root = _root2;
        this._settings = _settings;
        this._reader = new async_1.default(this._root, this._settings);
        this._storage = [];
      }
      read(callback) {
        this._reader.onError((error) => {
          callFailureCallback(callback, error);
        });
        this._reader.onEntry((entry) => {
          this._storage.push(entry);
        });
        this._reader.onEnd(() => {
          callSuccessCallback(callback, this._storage);
        });
        this._reader.read();
      }
    };
    exports.default = AsyncProvider;
    function callFailureCallback(callback, error) {
      callback(error);
    }
    function callSuccessCallback(callback, entries) {
      callback(null, entries);
    }
  }
});

// node_modules/@nodelib/fs.walk/out/providers/stream.js
var require_stream2 = __commonJS({
  "node_modules/@nodelib/fs.walk/out/providers/stream.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var stream_1 = __require("stream");
    var async_1 = require_async3();
    var StreamProvider = class {
      constructor(_root2, _settings) {
        this._root = _root2;
        this._settings = _settings;
        this._reader = new async_1.default(this._root, this._settings);
        this._stream = new stream_1.Readable({
          objectMode: true,
          read: () => {
          },
          destroy: () => {
            if (!this._reader.isDestroyed) {
              this._reader.destroy();
            }
          }
        });
      }
      read() {
        this._reader.onError((error) => {
          this._stream.emit("error", error);
        });
        this._reader.onEntry((entry) => {
          this._stream.push(entry);
        });
        this._reader.onEnd(() => {
          this._stream.push(null);
        });
        this._reader.read();
        return this._stream;
      }
    };
    exports.default = StreamProvider;
  }
});

// node_modules/@nodelib/fs.walk/out/readers/sync.js
var require_sync3 = __commonJS({
  "node_modules/@nodelib/fs.walk/out/readers/sync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fsScandir = require_out2();
    var common = require_common2();
    var reader_1 = require_reader();
    var SyncReader = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._scandir = fsScandir.scandirSync;
        this._storage = [];
        this._queue = /* @__PURE__ */ new Set();
      }
      read() {
        this._pushToQueue(this._root, this._settings.basePath);
        this._handleQueue();
        return this._storage;
      }
      _pushToQueue(directory, base) {
        this._queue.add({ directory, base });
      }
      _handleQueue() {
        for (const item of this._queue.values()) {
          this._handleDirectory(item.directory, item.base);
        }
      }
      _handleDirectory(directory, base) {
        try {
          const entries = this._scandir(directory, this._settings.fsScandirSettings);
          for (const entry of entries) {
            this._handleEntry(entry, base);
          }
        } catch (error) {
          this._handleError(error);
        }
      }
      _handleError(error) {
        if (!common.isFatalError(this._settings, error)) {
          return;
        }
        throw error;
      }
      _handleEntry(entry, base) {
        const fullpath = entry.path;
        if (base !== void 0) {
          entry.path = common.joinPathSegments(base, entry.name, this._settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this._settings.entryFilter, entry)) {
          this._pushToStorage(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this._settings.deepFilter, entry)) {
          this._pushToQueue(fullpath, base === void 0 ? void 0 : entry.path);
        }
      }
      _pushToStorage(entry) {
        this._storage.push(entry);
      }
    };
    exports.default = SyncReader;
  }
});

// node_modules/@nodelib/fs.walk/out/providers/sync.js
var require_sync4 = __commonJS({
  "node_modules/@nodelib/fs.walk/out/providers/sync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var sync_1 = require_sync3();
    var SyncProvider = class {
      constructor(_root2, _settings) {
        this._root = _root2;
        this._settings = _settings;
        this._reader = new sync_1.default(this._root, this._settings);
      }
      read() {
        return this._reader.read();
      }
    };
    exports.default = SyncProvider;
  }
});

// node_modules/@nodelib/fs.walk/out/settings.js
var require_settings3 = __commonJS({
  "node_modules/@nodelib/fs.walk/out/settings.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var path17 = __require("path");
    var fsScandir = require_out2();
    var Settings = class {
      constructor(_options2 = {}) {
        this._options = _options2;
        this.basePath = this._getValue(this._options.basePath, void 0);
        this.concurrency = this._getValue(this._options.concurrency, Number.POSITIVE_INFINITY);
        this.deepFilter = this._getValue(this._options.deepFilter, null);
        this.entryFilter = this._getValue(this._options.entryFilter, null);
        this.errorFilter = this._getValue(this._options.errorFilter, null);
        this.pathSegmentSeparator = this._getValue(this._options.pathSegmentSeparator, path17.sep);
        this.fsScandirSettings = new fsScandir.Settings({
          followSymbolicLinks: this._options.followSymbolicLinks,
          fs: this._options.fs,
          pathSegmentSeparator: this._options.pathSegmentSeparator,
          stats: this._options.stats,
          throwErrorOnBrokenSymbolicLink: this._options.throwErrorOnBrokenSymbolicLink
        });
      }
      _getValue(option, value) {
        return option !== null && option !== void 0 ? option : value;
      }
    };
    exports.default = Settings;
  }
});

// node_modules/@nodelib/fs.walk/out/index.js
var require_out3 = __commonJS({
  "node_modules/@nodelib/fs.walk/out/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Settings = exports.walkStream = exports.walkSync = exports.walk = void 0;
    var async_1 = require_async4();
    var stream_1 = require_stream2();
    var sync_1 = require_sync4();
    var settings_1 = require_settings3();
    exports.Settings = settings_1.default;
    function walk(directory, optionsOrSettingsOrCallback, callback) {
      if (typeof optionsOrSettingsOrCallback === "function") {
        new async_1.default(directory, getSettings()).read(optionsOrSettingsOrCallback);
        return;
      }
      new async_1.default(directory, getSettings(optionsOrSettingsOrCallback)).read(callback);
    }
    exports.walk = walk;
    function walkSync(directory, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      const provider = new sync_1.default(directory, settings);
      return provider.read();
    }
    exports.walkSync = walkSync;
    function walkStream(directory, optionsOrSettings) {
      const settings = getSettings(optionsOrSettings);
      const provider = new stream_1.default(directory, settings);
      return provider.read();
    }
    exports.walkStream = walkStream;
    function getSettings(settingsOrOptions = {}) {
      if (settingsOrOptions instanceof settings_1.default) {
        return settingsOrOptions;
      }
      return new settings_1.default(settingsOrOptions);
    }
  }
});

// node_modules/fast-glob/out/readers/reader.js
var require_reader2 = __commonJS({
  "node_modules/fast-glob/out/readers/reader.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var path17 = __require("path");
    var fsStat = require_out();
    var utils = require_utils3();
    var Reader = class {
      constructor(_settings) {
        this._settings = _settings;
        this._fsStatSettings = new fsStat.Settings({
          followSymbolicLink: this._settings.followSymbolicLinks,
          fs: this._settings.fs,
          throwErrorOnBrokenSymbolicLink: this._settings.followSymbolicLinks
        });
      }
      _getFullEntryPath(filepath) {
        return path17.resolve(this._settings.cwd, filepath);
      }
      _makeEntry(stats, pattern) {
        const entry = {
          name: pattern,
          path: pattern,
          dirent: utils.fs.createDirentFromStats(pattern, stats)
        };
        if (this._settings.stats) {
          entry.stats = stats;
        }
        return entry;
      }
      _isFatalError(error) {
        return !utils.errno.isEnoentCodeError(error) && !this._settings.suppressErrors;
      }
    };
    exports.default = Reader;
  }
});

// node_modules/fast-glob/out/readers/stream.js
var require_stream3 = __commonJS({
  "node_modules/fast-glob/out/readers/stream.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var stream_1 = __require("stream");
    var fsStat = require_out();
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var ReaderStream = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkStream = fsWalk.walkStream;
        this._stat = fsStat.stat;
      }
      dynamic(root2, options7) {
        return this._walkStream(root2, options7);
      }
      static(patterns, options7) {
        const filepaths = patterns.map(this._getFullEntryPath, this);
        const stream = new stream_1.PassThrough({ objectMode: true });
        stream._write = (index, _enc, done) => {
          return this._getEntry(filepaths[index], patterns[index], options7).then((entry) => {
            if (entry !== null && options7.entryFilter(entry)) {
              stream.push(entry);
            }
            if (index === filepaths.length - 1) {
              stream.end();
            }
            done();
          }).catch(done);
        };
        for (let i = 0; i < filepaths.length; i++) {
          stream.write(i);
        }
        return stream;
      }
      _getEntry(filepath, pattern, options7) {
        return this._getStat(filepath).then((stats) => this._makeEntry(stats, pattern)).catch((error) => {
          if (options7.errorFilter(error)) {
            return null;
          }
          throw error;
        });
      }
      _getStat(filepath) {
        return new Promise((resolve4, reject) => {
          this._stat(filepath, this._fsStatSettings, (error, stats) => {
            return error === null ? resolve4(stats) : reject(error);
          });
        });
      }
    };
    exports.default = ReaderStream;
  }
});

// node_modules/fast-glob/out/readers/async.js
var require_async5 = __commonJS({
  "node_modules/fast-glob/out/readers/async.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var stream_1 = require_stream3();
    var ReaderAsync = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkAsync = fsWalk.walk;
        this._readerStream = new stream_1.default(this._settings);
      }
      dynamic(root2, options7) {
        return new Promise((resolve4, reject) => {
          this._walkAsync(root2, options7, (error, entries) => {
            if (error === null) {
              resolve4(entries);
            } else {
              reject(error);
            }
          });
        });
      }
      async static(patterns, options7) {
        const entries = [];
        const stream = this._readerStream.static(patterns, options7);
        return new Promise((resolve4, reject) => {
          stream.once("error", reject);
          stream.on("data", (entry) => entries.push(entry));
          stream.once("end", () => resolve4(entries));
        });
      }
    };
    exports.default = ReaderAsync;
  }
});

// node_modules/fast-glob/out/providers/matchers/matcher.js
var require_matcher = __commonJS({
  "node_modules/fast-glob/out/providers/matchers/matcher.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var utils = require_utils3();
    var Matcher = class {
      constructor(_patterns, _settings, _micromatchOptions) {
        this._patterns = _patterns;
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
        this._storage = [];
        this._fillStorage();
      }
      _fillStorage() {
        for (const pattern of this._patterns) {
          const segments = this._getPatternSegments(pattern);
          const sections = this._splitSegmentsIntoSections(segments);
          this._storage.push({
            complete: sections.length <= 1,
            pattern,
            segments,
            sections
          });
        }
      }
      _getPatternSegments(pattern) {
        const parts = utils.pattern.getPatternParts(pattern, this._micromatchOptions);
        return parts.map((part) => {
          const dynamic = utils.pattern.isDynamicPattern(part, this._settings);
          if (!dynamic) {
            return {
              dynamic: false,
              pattern: part
            };
          }
          return {
            dynamic: true,
            pattern: part,
            patternRe: utils.pattern.makeRe(part, this._micromatchOptions)
          };
        });
      }
      _splitSegmentsIntoSections(segments) {
        return utils.array.splitWhen(segments, (segment) => segment.dynamic && utils.pattern.hasGlobStar(segment.pattern));
      }
    };
    exports.default = Matcher;
  }
});

// node_modules/fast-glob/out/providers/matchers/partial.js
var require_partial = __commonJS({
  "node_modules/fast-glob/out/providers/matchers/partial.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var matcher_1 = require_matcher();
    var PartialMatcher = class extends matcher_1.default {
      match(filepath) {
        const parts = filepath.split("/");
        const levels = parts.length;
        const patterns = this._storage.filter((info) => !info.complete || info.segments.length > levels);
        for (const pattern of patterns) {
          const section = pattern.sections[0];
          if (!pattern.complete && levels > section.length) {
            return true;
          }
          const match2 = parts.every((part, index) => {
            const segment = pattern.segments[index];
            if (segment.dynamic && segment.patternRe.test(part)) {
              return true;
            }
            if (!segment.dynamic && segment.pattern === part) {
              return true;
            }
            return false;
          });
          if (match2) {
            return true;
          }
        }
        return false;
      }
    };
    exports.default = PartialMatcher;
  }
});

// node_modules/fast-glob/out/providers/filters/deep.js
var require_deep = __commonJS({
  "node_modules/fast-glob/out/providers/filters/deep.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var utils = require_utils3();
    var partial_1 = require_partial();
    var DeepFilter = class {
      constructor(_settings, _micromatchOptions) {
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
      }
      getFilter(basePath, positive, negative) {
        const matcher = this._getMatcher(positive);
        const negativeRe = this._getNegativePatternsRe(negative);
        return (entry) => this._filter(basePath, entry, matcher, negativeRe);
      }
      _getMatcher(patterns) {
        return new partial_1.default(patterns, this._settings, this._micromatchOptions);
      }
      _getNegativePatternsRe(patterns) {
        const affectDepthOfReadingPatterns = patterns.filter(utils.pattern.isAffectDepthOfReadingPattern);
        return utils.pattern.convertPatternsToRe(affectDepthOfReadingPatterns, this._micromatchOptions);
      }
      _filter(basePath, entry, matcher, negativeRe) {
        if (this._isSkippedByDeep(basePath, entry.path)) {
          return false;
        }
        if (this._isSkippedSymbolicLink(entry)) {
          return false;
        }
        const filepath = utils.path.removeLeadingDotSegment(entry.path);
        if (this._isSkippedByPositivePatterns(filepath, matcher)) {
          return false;
        }
        return this._isSkippedByNegativePatterns(filepath, negativeRe);
      }
      _isSkippedByDeep(basePath, entryPath) {
        if (this._settings.deep === Infinity) {
          return false;
        }
        return this._getEntryLevel(basePath, entryPath) >= this._settings.deep;
      }
      _getEntryLevel(basePath, entryPath) {
        const entryPathDepth = entryPath.split("/").length;
        if (basePath === "") {
          return entryPathDepth;
        }
        const basePathDepth = basePath.split("/").length;
        return entryPathDepth - basePathDepth;
      }
      _isSkippedSymbolicLink(entry) {
        return !this._settings.followSymbolicLinks && entry.dirent.isSymbolicLink();
      }
      _isSkippedByPositivePatterns(entryPath, matcher) {
        return !this._settings.baseNameMatch && !matcher.match(entryPath);
      }
      _isSkippedByNegativePatterns(entryPath, patternsRe) {
        return !utils.pattern.matchAny(entryPath, patternsRe);
      }
    };
    exports.default = DeepFilter;
  }
});

// node_modules/fast-glob/out/providers/filters/entry.js
var require_entry = __commonJS({
  "node_modules/fast-glob/out/providers/filters/entry.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var utils = require_utils3();
    var EntryFilter = class {
      constructor(_settings, _micromatchOptions) {
        this._settings = _settings;
        this._micromatchOptions = _micromatchOptions;
        this.index = /* @__PURE__ */ new Map();
      }
      getFilter(positive, negative) {
        const [absoluteNegative, relativeNegative] = utils.pattern.partitionAbsoluteAndRelative(negative);
        const patterns = {
          positive: {
            all: utils.pattern.convertPatternsToRe(positive, this._micromatchOptions)
          },
          negative: {
            absolute: utils.pattern.convertPatternsToRe(absoluteNegative, Object.assign(Object.assign({}, this._micromatchOptions), { dot: true })),
            relative: utils.pattern.convertPatternsToRe(relativeNegative, Object.assign(Object.assign({}, this._micromatchOptions), { dot: true }))
          }
        };
        return (entry) => this._filter(entry, patterns);
      }
      _filter(entry, patterns) {
        const filepath = utils.path.removeLeadingDotSegment(entry.path);
        if (this._settings.unique && this._isDuplicateEntry(filepath)) {
          return false;
        }
        if (this._onlyFileFilter(entry) || this._onlyDirectoryFilter(entry)) {
          return false;
        }
        const isMatched = this._isMatchToPatternsSet(filepath, patterns, entry.dirent.isDirectory());
        if (this._settings.unique && isMatched) {
          this._createIndexRecord(filepath);
        }
        return isMatched;
      }
      _isDuplicateEntry(filepath) {
        return this.index.has(filepath);
      }
      _createIndexRecord(filepath) {
        this.index.set(filepath, void 0);
      }
      _onlyFileFilter(entry) {
        return this._settings.onlyFiles && !entry.dirent.isFile();
      }
      _onlyDirectoryFilter(entry) {
        return this._settings.onlyDirectories && !entry.dirent.isDirectory();
      }
      _isMatchToPatternsSet(filepath, patterns, isDirectory) {
        const isMatched = this._isMatchToPatterns(filepath, patterns.positive.all, isDirectory);
        if (!isMatched) {
          return false;
        }
        const isMatchedByRelativeNegative = this._isMatchToPatterns(filepath, patterns.negative.relative, isDirectory);
        if (isMatchedByRelativeNegative) {
          return false;
        }
        const isMatchedByAbsoluteNegative = this._isMatchToAbsoluteNegative(filepath, patterns.negative.absolute, isDirectory);
        if (isMatchedByAbsoluteNegative) {
          return false;
        }
        return true;
      }
      _isMatchToAbsoluteNegative(filepath, patternsRe, isDirectory) {
        if (patternsRe.length === 0) {
          return false;
        }
        const fullpath = utils.path.makeAbsolute(this._settings.cwd, filepath);
        return this._isMatchToPatterns(fullpath, patternsRe, isDirectory);
      }
      _isMatchToPatterns(filepath, patternsRe, isDirectory) {
        if (patternsRe.length === 0) {
          return false;
        }
        const isMatched = utils.pattern.matchAny(filepath, patternsRe);
        if (!isMatched && isDirectory) {
          return utils.pattern.matchAny(filepath + "/", patternsRe);
        }
        return isMatched;
      }
    };
    exports.default = EntryFilter;
  }
});

// node_modules/fast-glob/out/providers/filters/error.js
var require_error = __commonJS({
  "node_modules/fast-glob/out/providers/filters/error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var utils = require_utils3();
    var ErrorFilter = class {
      constructor(_settings) {
        this._settings = _settings;
      }
      getFilter() {
        return (error) => this._isNonFatalError(error);
      }
      _isNonFatalError(error) {
        return utils.errno.isEnoentCodeError(error) || this._settings.suppressErrors;
      }
    };
    exports.default = ErrorFilter;
  }
});

// node_modules/fast-glob/out/providers/transformers/entry.js
var require_entry2 = __commonJS({
  "node_modules/fast-glob/out/providers/transformers/entry.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var utils = require_utils3();
    var EntryTransformer = class {
      constructor(_settings) {
        this._settings = _settings;
      }
      getTransformer() {
        return (entry) => this._transform(entry);
      }
      _transform(entry) {
        let filepath = entry.path;
        if (this._settings.absolute) {
          filepath = utils.path.makeAbsolute(this._settings.cwd, filepath);
          filepath = utils.path.unixify(filepath);
        }
        if (this._settings.markDirectories && entry.dirent.isDirectory()) {
          filepath += "/";
        }
        if (!this._settings.objectMode) {
          return filepath;
        }
        return Object.assign(Object.assign({}, entry), { path: filepath });
      }
    };
    exports.default = EntryTransformer;
  }
});

// node_modules/fast-glob/out/providers/provider.js
var require_provider = __commonJS({
  "node_modules/fast-glob/out/providers/provider.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var path17 = __require("path");
    var deep_1 = require_deep();
    var entry_1 = require_entry();
    var error_1 = require_error();
    var entry_2 = require_entry2();
    var Provider = class {
      constructor(_settings) {
        this._settings = _settings;
        this.errorFilter = new error_1.default(this._settings);
        this.entryFilter = new entry_1.default(this._settings, this._getMicromatchOptions());
        this.deepFilter = new deep_1.default(this._settings, this._getMicromatchOptions());
        this.entryTransformer = new entry_2.default(this._settings);
      }
      _getRootDirectory(task) {
        return path17.resolve(this._settings.cwd, task.base);
      }
      _getReaderOptions(task) {
        const basePath = task.base === "." ? "" : task.base;
        return {
          basePath,
          pathSegmentSeparator: "/",
          concurrency: this._settings.concurrency,
          deepFilter: this.deepFilter.getFilter(basePath, task.positive, task.negative),
          entryFilter: this.entryFilter.getFilter(task.positive, task.negative),
          errorFilter: this.errorFilter.getFilter(),
          followSymbolicLinks: this._settings.followSymbolicLinks,
          fs: this._settings.fs,
          stats: this._settings.stats,
          throwErrorOnBrokenSymbolicLink: this._settings.throwErrorOnBrokenSymbolicLink,
          transform: this.entryTransformer.getTransformer()
        };
      }
      _getMicromatchOptions() {
        return {
          dot: this._settings.dot,
          matchBase: this._settings.baseNameMatch,
          nobrace: !this._settings.braceExpansion,
          nocase: !this._settings.caseSensitiveMatch,
          noext: !this._settings.extglob,
          noglobstar: !this._settings.globstar,
          posix: true,
          strictSlashes: false
        };
      }
    };
    exports.default = Provider;
  }
});

// node_modules/fast-glob/out/providers/async.js
var require_async6 = __commonJS({
  "node_modules/fast-glob/out/providers/async.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var async_1 = require_async5();
    var provider_1 = require_provider();
    var ProviderAsync = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new async_1.default(this._settings);
      }
      async read(task) {
        const root2 = this._getRootDirectory(task);
        const options7 = this._getReaderOptions(task);
        const entries = await this.api(root2, task, options7);
        return entries.map((entry) => options7.transform(entry));
      }
      api(root2, task, options7) {
        if (task.dynamic) {
          return this._reader.dynamic(root2, options7);
        }
        return this._reader.static(task.patterns, options7);
      }
    };
    exports.default = ProviderAsync;
  }
});

// node_modules/fast-glob/out/providers/stream.js
var require_stream4 = __commonJS({
  "node_modules/fast-glob/out/providers/stream.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var stream_1 = __require("stream");
    var stream_2 = require_stream3();
    var provider_1 = require_provider();
    var ProviderStream = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new stream_2.default(this._settings);
      }
      read(task) {
        const root2 = this._getRootDirectory(task);
        const options7 = this._getReaderOptions(task);
        const source2 = this.api(root2, task, options7);
        const destination = new stream_1.Readable({ objectMode: true, read: () => {
        } });
        source2.once("error", (error) => destination.emit("error", error)).on("data", (entry) => destination.emit("data", options7.transform(entry))).once("end", () => destination.emit("end"));
        destination.once("close", () => source2.destroy());
        return destination;
      }
      api(root2, task, options7) {
        if (task.dynamic) {
          return this._reader.dynamic(root2, options7);
        }
        return this._reader.static(task.patterns, options7);
      }
    };
    exports.default = ProviderStream;
  }
});

// node_modules/fast-glob/out/readers/sync.js
var require_sync5 = __commonJS({
  "node_modules/fast-glob/out/readers/sync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fsStat = require_out();
    var fsWalk = require_out3();
    var reader_1 = require_reader2();
    var ReaderSync = class extends reader_1.default {
      constructor() {
        super(...arguments);
        this._walkSync = fsWalk.walkSync;
        this._statSync = fsStat.statSync;
      }
      dynamic(root2, options7) {
        return this._walkSync(root2, options7);
      }
      static(patterns, options7) {
        const entries = [];
        for (const pattern of patterns) {
          const filepath = this._getFullEntryPath(pattern);
          const entry = this._getEntry(filepath, pattern, options7);
          if (entry === null || !options7.entryFilter(entry)) {
            continue;
          }
          entries.push(entry);
        }
        return entries;
      }
      _getEntry(filepath, pattern, options7) {
        try {
          const stats = this._getStat(filepath);
          return this._makeEntry(stats, pattern);
        } catch (error) {
          if (options7.errorFilter(error)) {
            return null;
          }
          throw error;
        }
      }
      _getStat(filepath) {
        return this._statSync(filepath, this._fsStatSettings);
      }
    };
    exports.default = ReaderSync;
  }
});

// node_modules/fast-glob/out/providers/sync.js
var require_sync6 = __commonJS({
  "node_modules/fast-glob/out/providers/sync.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var sync_1 = require_sync5();
    var provider_1 = require_provider();
    var ProviderSync = class extends provider_1.default {
      constructor() {
        super(...arguments);
        this._reader = new sync_1.default(this._settings);
      }
      read(task) {
        const root2 = this._getRootDirectory(task);
        const options7 = this._getReaderOptions(task);
        const entries = this.api(root2, task, options7);
        return entries.map(options7.transform);
      }
      api(root2, task, options7) {
        if (task.dynamic) {
          return this._reader.dynamic(root2, options7);
        }
        return this._reader.static(task.patterns, options7);
      }
    };
    exports.default = ProviderSync;
  }
});

// node_modules/fast-glob/out/settings.js
var require_settings4 = __commonJS({
  "node_modules/fast-glob/out/settings.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_FILE_SYSTEM_ADAPTER = void 0;
    var fs6 = __require("fs");
    var os = __require("os");
    var CPU_COUNT = Math.max(os.cpus().length, 1);
    exports.DEFAULT_FILE_SYSTEM_ADAPTER = {
      lstat: fs6.lstat,
      lstatSync: fs6.lstatSync,
      stat: fs6.stat,
      statSync: fs6.statSync,
      readdir: fs6.readdir,
      readdirSync: fs6.readdirSync
    };
    var Settings = class {
      constructor(_options2 = {}) {
        this._options = _options2;
        this.absolute = this._getValue(this._options.absolute, false);
        this.baseNameMatch = this._getValue(this._options.baseNameMatch, false);
        this.braceExpansion = this._getValue(this._options.braceExpansion, true);
        this.caseSensitiveMatch = this._getValue(this._options.caseSensitiveMatch, true);
        this.concurrency = this._getValue(this._options.concurrency, CPU_COUNT);
        this.cwd = this._getValue(this._options.cwd, process.cwd());
        this.deep = this._getValue(this._options.deep, Infinity);
        this.dot = this._getValue(this._options.dot, false);
        this.extglob = this._getValue(this._options.extglob, true);
        this.followSymbolicLinks = this._getValue(this._options.followSymbolicLinks, true);
        this.fs = this._getFileSystemMethods(this._options.fs);
        this.globstar = this._getValue(this._options.globstar, true);
        this.ignore = this._getValue(this._options.ignore, []);
        this.markDirectories = this._getValue(this._options.markDirectories, false);
        this.objectMode = this._getValue(this._options.objectMode, false);
        this.onlyDirectories = this._getValue(this._options.onlyDirectories, false);
        this.onlyFiles = this._getValue(this._options.onlyFiles, true);
        this.stats = this._getValue(this._options.stats, false);
        this.suppressErrors = this._getValue(this._options.suppressErrors, false);
        this.throwErrorOnBrokenSymbolicLink = this._getValue(this._options.throwErrorOnBrokenSymbolicLink, false);
        this.unique = this._getValue(this._options.unique, true);
        if (this.onlyDirectories) {
          this.onlyFiles = false;
        }
        if (this.stats) {
          this.objectMode = true;
        }
        this.ignore = [].concat(this.ignore);
      }
      _getValue(option, value) {
        return option === void 0 ? value : option;
      }
      _getFileSystemMethods(methods = {}) {
        return Object.assign(Object.assign({}, exports.DEFAULT_FILE_SYSTEM_ADAPTER), methods);
      }
    };
    exports.default = Settings;
  }
});

// node_modules/fast-glob/out/index.js
var require_out4 = __commonJS({
  "node_modules/fast-glob/out/index.js"(exports, module) {
    "use strict";
    var taskManager = require_tasks();
    var async_1 = require_async6();
    var stream_1 = require_stream4();
    var sync_1 = require_sync6();
    var settings_1 = require_settings4();
    var utils = require_utils3();
    async function FastGlob(source2, options7) {
      assertPatternsInput(source2);
      const works = getWorks(source2, async_1.default, options7);
      const result = await Promise.all(works);
      return utils.array.flatten(result);
    }
    (function(FastGlob2) {
      FastGlob2.glob = FastGlob2;
      FastGlob2.globSync = sync;
      FastGlob2.globStream = stream;
      FastGlob2.async = FastGlob2;
      function sync(source2, options7) {
        assertPatternsInput(source2);
        const works = getWorks(source2, sync_1.default, options7);
        return utils.array.flatten(works);
      }
      FastGlob2.sync = sync;
      function stream(source2, options7) {
        assertPatternsInput(source2);
        const works = getWorks(source2, stream_1.default, options7);
        return utils.stream.merge(works);
      }
      FastGlob2.stream = stream;
      function generateTasks(source2, options7) {
        assertPatternsInput(source2);
        const patterns = [].concat(source2);
        const settings = new settings_1.default(options7);
        return taskManager.generate(patterns, settings);
      }
      FastGlob2.generateTasks = generateTasks;
      function isDynamicPattern(source2, options7) {
        assertPatternsInput(source2);
        const settings = new settings_1.default(options7);
        return utils.pattern.isDynamicPattern(source2, settings);
      }
      FastGlob2.isDynamicPattern = isDynamicPattern;
      function escapePath(source2) {
        assertPatternsInput(source2);
        return utils.path.escape(source2);
      }
      FastGlob2.escapePath = escapePath;
      function convertPathToPattern(source2) {
        assertPatternsInput(source2);
        return utils.path.convertPathToPattern(source2);
      }
      FastGlob2.convertPathToPattern = convertPathToPattern;
      let posix;
      (function(posix2) {
        function escapePath2(source2) {
          assertPatternsInput(source2);
          return utils.path.escapePosixPath(source2);
        }
        posix2.escapePath = escapePath2;
        function convertPathToPattern2(source2) {
          assertPatternsInput(source2);
          return utils.path.convertPosixPathToPattern(source2);
        }
        posix2.convertPathToPattern = convertPathToPattern2;
      })(posix = FastGlob2.posix || (FastGlob2.posix = {}));
      let win32;
      (function(win322) {
        function escapePath2(source2) {
          assertPatternsInput(source2);
          return utils.path.escapeWindowsPath(source2);
        }
        win322.escapePath = escapePath2;
        function convertPathToPattern2(source2) {
          assertPatternsInput(source2);
          return utils.path.convertWindowsPathToPattern(source2);
        }
        win322.convertPathToPattern = convertPathToPattern2;
      })(win32 = FastGlob2.win32 || (FastGlob2.win32 = {}));
    })(FastGlob || (FastGlob = {}));
    function getWorks(source2, _Provider, options7) {
      const patterns = [].concat(source2);
      const settings = new settings_1.default(options7);
      const tasks = taskManager.generate(patterns, settings);
      const provider = new _Provider(settings);
      return tasks.map(provider.read, provider);
    }
    function assertPatternsInput(input) {
      const source2 = [].concat(input);
      const isValidSource = source2.every((item) => utils.string.isString(item) && !utils.string.isEmpty(item));
      if (!isValidSource) {
        throw new TypeError("Patterns must be a string (non empty) or an array of strings");
      }
    }
    module.exports = FastGlob;
  }
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports, module) {
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported2 = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor2 = 0;
      do {
        result += string.substring(cursor2, index) + replace;
        cursor2 = index + close.length;
        index = string.indexOf(close, cursor2);
      } while (~index);
      return result + string.substring(cursor2);
    };
    var createColors = (enabled = isColorSupported2) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// src/language-css/languages.evaluate.js
var languages_evaluate_default;
var init_languages_evaluate = __esm({
  "src/language-css/languages.evaluate.js"() {
    languages_evaluate_default = [
      {
        "name": "CSS",
        "type": "markup",
        "aceMode": "css",
        "extensions": [
          ".css",
          ".wxss"
        ],
        "tmScope": "source.css",
        "codemirrorMode": "css",
        "codemirrorMimeType": "text/css",
        "parsers": [
          "css"
        ],
        "vscodeLanguageIds": [
          "css"
        ],
        "linguistLanguageId": 50
      },
      {
        "name": "PostCSS",
        "type": "markup",
        "aceMode": "text",
        "extensions": [
          ".pcss",
          ".postcss"
        ],
        "tmScope": "source.postcss",
        "group": "CSS",
        "parsers": [
          "css"
        ],
        "vscodeLanguageIds": [
          "postcss"
        ],
        "linguistLanguageId": 262764437
      },
      {
        "name": "Less",
        "type": "markup",
        "aceMode": "less",
        "extensions": [
          ".less"
        ],
        "tmScope": "source.css.less",
        "aliases": [
          "less-css"
        ],
        "codemirrorMode": "css",
        "codemirrorMimeType": "text/x-less",
        "parsers": [
          "less"
        ],
        "vscodeLanguageIds": [
          "less"
        ],
        "linguistLanguageId": 198
      },
      {
        "name": "SCSS",
        "type": "markup",
        "aceMode": "scss",
        "extensions": [
          ".scss"
        ],
        "tmScope": "source.css.scss",
        "codemirrorMode": "css",
        "codemirrorMimeType": "text/x-scss",
        "parsers": [
          "scss"
        ],
        "vscodeLanguageIds": [
          "scss"
        ],
        "linguistLanguageId": 329
      }
    ];
  }
});

// src/common/common-options.evaluate.js
var common_options_evaluate_default;
var init_common_options_evaluate = __esm({
  "src/common/common-options.evaluate.js"() {
    common_options_evaluate_default = {
      "bracketSpacing": {
        "category": "Common",
        "type": "boolean",
        "default": true,
        "description": "Print spaces between brackets.",
        "oppositeDescription": "Do not print spaces between brackets."
      },
      "objectWrap": {
        "category": "Common",
        "type": "choice",
        "default": "preserve",
        "description": "How to wrap object literals.",
        "choices": [
          {
            "value": "preserve",
            "description": "Keep as multi-line, if there is a newline between the opening brace and first property."
          },
          {
            "value": "collapse",
            "description": "Fit to a single line when possible."
          }
        ]
      },
      "singleQuote": {
        "category": "Common",
        "type": "boolean",
        "default": false,
        "description": "Use single quotes instead of double quotes."
      },
      "proseWrap": {
        "category": "Common",
        "type": "choice",
        "default": "preserve",
        "description": "How to wrap prose.",
        "choices": [
          {
            "value": "always",
            "description": "Wrap prose if it exceeds the print width."
          },
          {
            "value": "never",
            "description": "Do not wrap prose."
          },
          {
            "value": "preserve",
            "description": "Wrap prose as-is."
          }
        ]
      },
      "bracketSameLine": {
        "category": "Common",
        "type": "boolean",
        "default": false,
        "description": "Put > of opening tags on the last line instead of on a new line."
      },
      "singleAttributePerLine": {
        "category": "Common",
        "type": "boolean",
        "default": false,
        "description": "Enforce single attribute per line in HTML, Vue and JSX."
      }
    };
  }
});

// src/language-css/options.js
var options, options_default;
var init_options = __esm({
  "src/language-css/options.js"() {
    init_common_options_evaluate();
    options = {
      singleQuote: common_options_evaluate_default.singleQuote
    };
    options_default = options;
  }
});

// src/language-graphql/languages.evaluate.js
var languages_evaluate_default2;
var init_languages_evaluate2 = __esm({
  "src/language-graphql/languages.evaluate.js"() {
    languages_evaluate_default2 = [
      {
        "name": "GraphQL",
        "type": "data",
        "aceMode": "graphqlschema",
        "extensions": [
          ".graphql",
          ".gql",
          ".graphqls"
        ],
        "tmScope": "source.graphql",
        "parsers": [
          "graphql"
        ],
        "vscodeLanguageIds": [
          "graphql"
        ],
        "linguistLanguageId": 139
      }
    ];
  }
});

// src/language-graphql/options.js
var options2, options_default2;
var init_options2 = __esm({
  "src/language-graphql/options.js"() {
    init_common_options_evaluate();
    options2 = {
      bracketSpacing: common_options_evaluate_default.bracketSpacing
    };
    options_default2 = options2;
  }
});

// src/language-handlebars/languages.evaluate.js
var languages_evaluate_default3;
var init_languages_evaluate3 = __esm({
  "src/language-handlebars/languages.evaluate.js"() {
    languages_evaluate_default3 = [
      {
        "name": "Handlebars",
        "type": "markup",
        "aceMode": "handlebars",
        "extensions": [
          ".handlebars",
          ".hbs"
        ],
        "tmScope": "text.html.handlebars",
        "aliases": [
          "hbs",
          "htmlbars"
        ],
        "parsers": [
          "glimmer"
        ],
        "vscodeLanguageIds": [
          "handlebars"
        ],
        "linguistLanguageId": 155
      }
    ];
  }
});

// src/language-html/languages.evaluate.js
var languages_evaluate_default4;
var init_languages_evaluate4 = __esm({
  "src/language-html/languages.evaluate.js"() {
    languages_evaluate_default4 = [
      {
        "name": "Angular",
        "type": "markup",
        "aceMode": "html",
        "extensions": [
          ".component.html"
        ],
        "tmScope": "text.html.basic",
        "aliases": [
          "xhtml"
        ],
        "codemirrorMode": "htmlmixed",
        "codemirrorMimeType": "text/html",
        "parsers": [
          "angular"
        ],
        "vscodeLanguageIds": [
          "html"
        ],
        "filenames": [],
        "linguistLanguageId": 146
      },
      {
        "name": "HTML",
        "type": "markup",
        "aceMode": "html",
        "extensions": [
          ".html",
          ".hta",
          ".htm",
          ".html.hl",
          ".inc",
          ".xht",
          ".xhtml"
        ],
        "tmScope": "text.html.basic",
        "aliases": [
          "xhtml"
        ],
        "codemirrorMode": "htmlmixed",
        "codemirrorMimeType": "text/html",
        "parsers": [
          "html"
        ],
        "vscodeLanguageIds": [
          "html"
        ],
        "linguistLanguageId": 146
      },
      {
        "name": "Lightning Web Components",
        "type": "markup",
        "aceMode": "html",
        "extensions": [],
        "tmScope": "text.html.basic",
        "aliases": [
          "LWC",
          "lwc"
        ],
        "codemirrorMode": "htmlmixed",
        "codemirrorMimeType": "text/html",
        "parsers": [
          "lwc"
        ],
        "vscodeLanguageIds": [
          "html"
        ],
        "filenames": [],
        "linguistLanguageId": 146
      },
      {
        "name": "MJML",
        "type": "markup",
        "aceMode": "html",
        "extensions": [
          ".mjml"
        ],
        "tmScope": "text.mjml.basic",
        "aliases": [
          "MJML",
          "mjml"
        ],
        "codemirrorMode": "htmlmixed",
        "codemirrorMimeType": "text/html",
        "parsers": [
          "mjml"
        ],
        "filenames": [],
        "vscodeLanguageIds": [
          "mjml"
        ],
        "linguistLanguageId": 146
      },
      {
        "name": "Vue",
        "type": "markup",
        "aceMode": "vue",
        "extensions": [
          ".vue"
        ],
        "tmScope": "text.html.vue",
        "codemirrorMode": "vue",
        "codemirrorMimeType": "text/x-vue",
        "parsers": [
          "vue"
        ],
        "vscodeLanguageIds": [
          "vue"
        ],
        "linguistLanguageId": 391
      }
    ];
  }
});

// src/language-html/options.js
var CATEGORY_HTML, options3, options_default3;
var init_options3 = __esm({
  "src/language-html/options.js"() {
    init_common_options_evaluate();
    CATEGORY_HTML = "HTML";
    options3 = {
      bracketSameLine: common_options_evaluate_default.bracketSameLine,
      htmlWhitespaceSensitivity: {
        category: CATEGORY_HTML,
        type: "choice",
        default: "css",
        description: "How to handle whitespaces in HTML.",
        choices: [
          {
            value: "css",
            description: "Respect the default value of CSS display property."
          },
          {
            value: "strict",
            description: "Whitespaces are considered sensitive."
          },
          {
            value: "ignore",
            description: "Whitespaces are considered insensitive."
          }
        ]
      },
      singleAttributePerLine: common_options_evaluate_default.singleAttributePerLine,
      vueIndentScriptAndStyle: {
        category: CATEGORY_HTML,
        type: "boolean",
        default: false,
        description: "Indent script and style tags in Vue files."
      }
    };
    options_default3 = options3;
  }
});

// src/language-js/languages.evaluate.js
var languages_evaluate_default5;
var init_languages_evaluate5 = __esm({
  "src/language-js/languages.evaluate.js"() {
    languages_evaluate_default5 = [
      {
        "name": "JavaScript",
        "type": "programming",
        "aceMode": "javascript",
        "extensions": [
          ".js",
          "._js",
          ".bones",
          ".cjs",
          ".es",
          ".es6",
          ".gs",
          ".jake",
          ".javascript",
          ".jsb",
          ".jscad",
          ".jsfl",
          ".jslib",
          ".jsm",
          ".jspre",
          ".jss",
          ".mjs",
          ".njs",
          ".pac",
          ".sjs",
          ".ssjs",
          ".xsjs",
          ".xsjslib",
          ".start.frag",
          ".end.frag",
          ".wxs"
        ],
        "filenames": [
          "Jakefile",
          "start.frag",
          "end.frag"
        ],
        "tmScope": "source.js",
        "aliases": [
          "js",
          "node"
        ],
        "codemirrorMode": "javascript",
        "codemirrorMimeType": "text/javascript",
        "interpreters": [
          "bun",
          "chakra",
          "d8",
          "deno",
          "gjs",
          "js",
          "node",
          "nodejs",
          "qjs",
          "rhino",
          "v8",
          "v8-shell",
          "zx"
        ],
        "parsers": [
          "babel",
          "acorn",
          "espree",
          "meriyah",
          "babel-flow",
          "babel-ts",
          "flow",
          "typescript"
        ],
        "vscodeLanguageIds": [
          "javascript",
          "mongo"
        ],
        "linguistLanguageId": 183
      },
      {
        "name": "Flow",
        "type": "programming",
        "aceMode": "javascript",
        "extensions": [
          ".js.flow"
        ],
        "filenames": [],
        "tmScope": "source.js",
        "aliases": [],
        "codemirrorMode": "javascript",
        "codemirrorMimeType": "text/javascript",
        "interpreters": [
          "bun",
          "chakra",
          "d8",
          "deno",
          "gjs",
          "js",
          "node",
          "nodejs",
          "qjs",
          "rhino",
          "v8",
          "v8-shell"
        ],
        "parsers": [
          "flow",
          "babel-flow"
        ],
        "vscodeLanguageIds": [
          "javascript"
        ],
        "linguistLanguageId": 183
      },
      {
        "name": "JSX",
        "type": "programming",
        "aceMode": "javascript",
        "extensions": [
          ".jsx"
        ],
        "filenames": void 0,
        "tmScope": "source.js.jsx",
        "aliases": void 0,
        "codemirrorMode": "jsx",
        "codemirrorMimeType": "text/jsx",
        "interpreters": void 0,
        "parsers": [
          "babel",
          "babel-flow",
          "babel-ts",
          "flow",
          "typescript",
          "espree",
          "meriyah"
        ],
        "vscodeLanguageIds": [
          "javascriptreact"
        ],
        "group": "JavaScript",
        "linguistLanguageId": 183
      },
      {
        "name": "TypeScript",
        "type": "programming",
        "aceMode": "typescript",
        "extensions": [
          ".ts",
          ".cts",
          ".mts"
        ],
        "tmScope": "source.ts",
        "aliases": [
          "ts"
        ],
        "codemirrorMode": "javascript",
        "codemirrorMimeType": "application/typescript",
        "interpreters": [
          "bun",
          "deno",
          "ts-node",
          "tsx"
        ],
        "parsers": [
          "typescript",
          "babel-ts"
        ],
        "vscodeLanguageIds": [
          "typescript"
        ],
        "linguistLanguageId": 378
      },
      {
        "name": "TSX",
        "type": "programming",
        "aceMode": "tsx",
        "extensions": [
          ".tsx"
        ],
        "tmScope": "source.tsx",
        "aliases": [
          "typescriptreact"
        ],
        "codemirrorMode": "jsx",
        "codemirrorMimeType": "text/typescript-jsx",
        "group": "TypeScript",
        "parsers": [
          "typescript",
          "babel-ts"
        ],
        "vscodeLanguageIds": [
          "typescriptreact"
        ],
        "linguistLanguageId": 94901924
      }
    ];
  }
});

// src/language-js/options.js
var CATEGORY_JAVASCRIPT, options4, options_default4;
var init_options4 = __esm({
  "src/language-js/options.js"() {
    init_common_options_evaluate();
    CATEGORY_JAVASCRIPT = "JavaScript";
    options4 = {
      arrowParens: {
        category: CATEGORY_JAVASCRIPT,
        type: "choice",
        default: "always",
        description: "Include parentheses around a sole arrow function parameter.",
        choices: [
          {
            value: "always",
            description: "Always include parens. Example: `(x) => x`"
          },
          {
            value: "avoid",
            description: "Omit parens when possible. Example: `x => x`"
          }
        ]
      },
      bracketSameLine: common_options_evaluate_default.bracketSameLine,
      objectWrap: common_options_evaluate_default.objectWrap,
      bracketSpacing: common_options_evaluate_default.bracketSpacing,
      jsxBracketSameLine: {
        category: CATEGORY_JAVASCRIPT,
        type: "boolean",
        description: "Put > on the last line instead of at a new line.",
        deprecated: "2.4.0"
      },
      semi: {
        category: CATEGORY_JAVASCRIPT,
        type: "boolean",
        default: true,
        description: "Print semicolons.",
        oppositeDescription: "Do not print semicolons, except at the beginning of lines which may need them."
      },
      experimentalOperatorPosition: {
        category: CATEGORY_JAVASCRIPT,
        type: "choice",
        default: "end",
        description: "Where to print operators when binary expressions wrap lines.",
        choices: [
          {
            value: "start",
            description: "Print operators at the start of new lines."
          },
          {
            value: "end",
            description: "Print operators at the end of previous lines."
          }
        ]
      },
      experimentalTernaries: {
        category: CATEGORY_JAVASCRIPT,
        type: "boolean",
        default: false,
        description: "Use curious ternaries, with the question mark after the condition.",
        oppositeDescription: "Default behavior of ternaries; keep question marks on the same line as the consequent."
      },
      singleQuote: common_options_evaluate_default.singleQuote,
      jsxSingleQuote: {
        category: CATEGORY_JAVASCRIPT,
        type: "boolean",
        default: false,
        description: "Use single quotes in JSX."
      },
      quoteProps: {
        category: CATEGORY_JAVASCRIPT,
        type: "choice",
        default: "as-needed",
        description: "Change when properties in objects are quoted.",
        choices: [
          {
            value: "as-needed",
            description: "Only add quotes around object properties where required."
          },
          {
            value: "consistent",
            description: "If at least one property in an object requires quotes, quote all properties."
          },
          {
            value: "preserve",
            description: "Respect the input use of quotes in object properties."
          }
        ]
      },
      trailingComma: {
        category: CATEGORY_JAVASCRIPT,
        type: "choice",
        default: "all",
        description: "Print trailing commas wherever possible when multi-line.",
        choices: [
          {
            value: "all",
            description: "Trailing commas wherever possible (including function arguments)."
          },
          {
            value: "es5",
            description: "Trailing commas where valid in ES5 (objects, arrays, etc.)"
          },
          { value: "none", description: "No trailing commas." }
        ]
      },
      singleAttributePerLine: common_options_evaluate_default.singleAttributePerLine
    };
    options_default4 = options4;
  }
});

// src/language-json/languages.evaluate.js
var languages_evaluate_default6;
var init_languages_evaluate6 = __esm({
  "src/language-json/languages.evaluate.js"() {
    languages_evaluate_default6 = [
      {
        "name": "JSON.stringify",
        "type": "data",
        "aceMode": "json",
        "extensions": [
          ".importmap"
        ],
        "filenames": [
          "package.json",
          "package-lock.json",
          "composer.json"
        ],
        "tmScope": "source.json",
        "aliases": [
          "geojson",
          "jsonl",
          "sarif",
          "topojson"
        ],
        "codemirrorMode": "javascript",
        "codemirrorMimeType": "application/json",
        "parsers": [
          "json-stringify"
        ],
        "vscodeLanguageIds": [
          "json"
        ],
        "linguistLanguageId": 174
      },
      {
        "name": "JSON",
        "type": "data",
        "aceMode": "json",
        "extensions": [
          ".json",
          ".4DForm",
          ".4DProject",
          ".avsc",
          ".geojson",
          ".gltf",
          ".har",
          ".ice",
          ".JSON-tmLanguage",
          ".json.example",
          ".mcmeta",
          ".sarif",
          ".slnlaunch",
          ".tact",
          ".tfstate",
          ".tfstate.backup",
          ".topojson",
          ".webapp",
          ".webmanifest",
          ".yy",
          ".yyp"
        ],
        "filenames": [
          ".all-contributorsrc",
          ".arcconfig",
          ".auto-changelog",
          ".c8rc",
          ".htmlhintrc",
          ".imgbotconfig",
          ".nycrc",
          ".tern-config",
          ".tern-project",
          ".watchmanconfig",
          ".babelrc",
          ".jscsrc",
          ".jshintrc",
          ".jslintrc",
          ".swcrc"
        ],
        "tmScope": "source.json",
        "aliases": [
          "geojson",
          "jsonl",
          "sarif",
          "topojson"
        ],
        "codemirrorMode": "javascript",
        "codemirrorMimeType": "application/json",
        "parsers": [
          "json"
        ],
        "vscodeLanguageIds": [
          "json"
        ],
        "linguistLanguageId": 174
      },
      {
        "name": "JSON with Comments",
        "type": "data",
        "aceMode": "javascript",
        "extensions": [
          ".jsonc",
          ".code-snippets",
          ".code-workspace",
          ".sublime-build",
          ".sublime-color-scheme",
          ".sublime-commands",
          ".sublime-completions",
          ".sublime-keymap",
          ".sublime-macro",
          ".sublime-menu",
          ".sublime-mousemap",
          ".sublime-project",
          ".sublime-settings",
          ".sublime-theme",
          ".sublime-workspace",
          ".sublime_metrics",
          ".sublime_session"
        ],
        "filenames": [],
        "tmScope": "source.json.comments",
        "aliases": [
          "jsonc"
        ],
        "codemirrorMode": "javascript",
        "codemirrorMimeType": "text/javascript",
        "group": "JSON",
        "parsers": [
          "jsonc"
        ],
        "vscodeLanguageIds": [
          "jsonc"
        ],
        "linguistLanguageId": 423
      },
      {
        "name": "JSON5",
        "type": "data",
        "aceMode": "json5",
        "extensions": [
          ".json5"
        ],
        "tmScope": "source.js",
        "codemirrorMode": "javascript",
        "codemirrorMimeType": "application/json",
        "parsers": [
          "json5"
        ],
        "vscodeLanguageIds": [
          "json5"
        ],
        "linguistLanguageId": 175
      }
    ];
  }
});

// src/language-markdown/languages.evaluate.js
var languages_evaluate_default7;
var init_languages_evaluate7 = __esm({
  "src/language-markdown/languages.evaluate.js"() {
    languages_evaluate_default7 = [
      {
        "name": "Markdown",
        "type": "prose",
        "aceMode": "markdown",
        "extensions": [
          ".md",
          ".livemd",
          ".markdown",
          ".mdown",
          ".mdwn",
          ".mkd",
          ".mkdn",
          ".mkdown",
          ".ronn",
          ".scd",
          ".workbook"
        ],
        "filenames": [
          "contents.lr",
          "README"
        ],
        "tmScope": "text.md",
        "aliases": [
          "md",
          "pandoc"
        ],
        "codemirrorMode": "gfm",
        "codemirrorMimeType": "text/x-gfm",
        "wrap": true,
        "parsers": [
          "markdown"
        ],
        "vscodeLanguageIds": [
          "markdown"
        ],
        "linguistLanguageId": 222
      },
      {
        "name": "MDX",
        "type": "prose",
        "aceMode": "markdown",
        "extensions": [
          ".mdx"
        ],
        "filenames": [],
        "tmScope": "text.md",
        "aliases": [
          "md",
          "pandoc"
        ],
        "codemirrorMode": "gfm",
        "codemirrorMimeType": "text/x-gfm",
        "wrap": true,
        "parsers": [
          "mdx"
        ],
        "vscodeLanguageIds": [
          "mdx"
        ],
        "linguistLanguageId": 222
      }
    ];
  }
});

// src/language-markdown/options.js
var options5, options_default5;
var init_options5 = __esm({
  "src/language-markdown/options.js"() {
    init_common_options_evaluate();
    options5 = {
      proseWrap: common_options_evaluate_default.proseWrap,
      singleQuote: common_options_evaluate_default.singleQuote
    };
    options_default5 = options5;
  }
});

// src/language-yaml/languages.evaluate.js
var languages_evaluate_default8;
var init_languages_evaluate8 = __esm({
  "src/language-yaml/languages.evaluate.js"() {
    languages_evaluate_default8 = [
      {
        "name": "YAML",
        "type": "data",
        "aceMode": "yaml",
        "extensions": [
          ".yml",
          ".mir",
          ".reek",
          ".rviz",
          ".sublime-syntax",
          ".syntax",
          ".yaml",
          ".yaml-tmlanguage",
          ".yaml.sed",
          ".yml.mysql"
        ],
        "filenames": [
          ".clang-format",
          ".clang-tidy",
          ".clangd",
          ".gemrc",
          "CITATION.cff",
          "glide.lock",
          "pixi.lock",
          ".prettierrc",
          ".stylelintrc",
          ".lintstagedrc"
        ],
        "tmScope": "source.yaml",
        "aliases": [
          "yml"
        ],
        "codemirrorMode": "yaml",
        "codemirrorMimeType": "text/x-yaml",
        "parsers": [
          "yaml"
        ],
        "vscodeLanguageIds": [
          "yaml",
          "ansible",
          "dockercompose",
          "github-actions-workflow",
          "home-assistant"
        ],
        "linguistLanguageId": 407
      }
    ];
  }
});

// src/language-yaml/options.js
var options6, options_default6;
var init_options6 = __esm({
  "src/language-yaml/options.js"() {
    init_common_options_evaluate();
    options6 = {
      bracketSpacing: common_options_evaluate_default.bracketSpacing,
      singleQuote: common_options_evaluate_default.singleQuote,
      proseWrap: common_options_evaluate_default.proseWrap
    };
    options_default6 = options6;
  }
});

// src/main/plugins/builtin-plugins/utilities.js
function toLazyLoadPlugin({
  name,
  load,
  options: options7,
  languages,
  parsers: parserNames,
  printers: printerNames
}) {
  const plugin = { name };
  if (options7) {
    plugin.options = options7;
  }
  if (languages) {
    plugin.languages = languages;
  }
  for (const { property, names } of [
    { property: "parsers", names: parserNames },
    { property: "printers", names: printerNames }
  ]) {
    if (names) {
      plugin[property] = Object.fromEntries(
        names.map((name2) => [
          name2,
          true ? async () => {
            const loaded = await load();
            Object.assign(plugin, loaded);
            return loaded[property][name2];
          } : async () => {
            const loaded = await load();
            plugin[property] = loaded[property];
            return loaded[property][name2];
          }
        ])
      );
    }
  }
  return plugin;
}
function toLazyLoadPlugins(...plugins2) {
  return plugins2.map((plugin) => toLazyLoadPlugin(plugin));
}
var init_utilities = __esm({
  "src/main/plugins/builtin-plugins/utilities.js"() {
  }
});

// src/main/plugins/builtin-plugins/production-plugins.js
var production_plugins_exports = {};
__export(production_plugins_exports, {
  plugins: () => plugins
});
var plugins;
var init_production_plugins = __esm({
  "src/main/plugins/builtin-plugins/production-plugins.js"() {
    init_languages_evaluate();
    init_options();
    init_languages_evaluate2();
    init_options2();
    init_languages_evaluate3();
    init_languages_evaluate4();
    init_options3();
    init_languages_evaluate5();
    init_options4();
    init_languages_evaluate6();
    init_languages_evaluate7();
    init_options5();
    init_languages_evaluate8();
    init_options6();
    init_utilities();
    plugins = /* @__PURE__ */ toLazyLoadPlugins(
      {
        name: "acorn",
        load: () => import("./plugins/acorn.mjs"),
        parsers: ["acorn", "espree"]
      },
      {
        name: "angular",
        load: () => import("./plugins/angular.mjs"),
        parsers: [
          "__ng_action",
          "__ng_binding",
          "__ng_directive",
          "__ng_interpolation"
        ]
      },
      {
        name: "babel",
        load: () => import("./plugins/babel.mjs"),
        parsers: [
          "__babel_estree",
          "__js_expression",
          "__ts_expression",
          "__vue_event_binding",
          "__vue_expression",
          "__vue_ts_event_binding",
          "__vue_ts_expression",
          "babel",
          "babel-flow",
          "babel-ts",
          "json",
          "json-stringify",
          "json5",
          "jsonc"
        ]
      },
      {
        name: "estree",
        load: () => import("./plugins/estree.mjs"),
        options: options_default4,
        languages: [...languages_evaluate_default6, ...languages_evaluate_default5],
        printers: ["estree", "estree-json"]
      },
      {
        name: "flow",
        load: () => import("./plugins/flow.mjs"),
        parsers: ["flow"]
      },
      {
        name: "glimmer",
        load: () => import("./plugins/glimmer.mjs"),
        languages: languages_evaluate_default3,
        parsers: ["glimmer"],
        printers: ["glimmer"]
      },
      {
        name: "graphql",
        load: () => import("./plugins/graphql.mjs"),
        options: options_default2,
        languages: languages_evaluate_default2,
        parsers: ["graphql"],
        printers: ["graphql"]
      },
      {
        name: "html",
        load: () => import("./plugins/html.mjs"),
        options: options_default3,
        languages: languages_evaluate_default4,
        parsers: ["angular", "html", "lwc", "mjml", "vue"],
        printers: ["html"]
      },
      {
        name: "markdown",
        load: () => import("./plugins/markdown.mjs"),
        options: options_default5,
        languages: languages_evaluate_default7,
        parsers: ["markdown", "mdx", "remark"],
        printers: ["mdast"]
      },
      {
        name: "meriyah",
        load: () => import("./plugins/meriyah.mjs"),
        parsers: ["meriyah"]
      },
      {
        name: "postcss",
        load: () => import("./plugins/postcss.mjs"),
        options: options_default,
        languages: languages_evaluate_default,
        parsers: ["css", "less", "scss"],
        printers: ["postcss"]
      },
      {
        name: "typescript",
        load: () => import("./plugins/typescript.mjs"),
        parsers: ["typescript"]
      },
      {
        name: "yaml",
        load: () => import("./plugins/yaml.mjs"),
        options: options_default6,
        languages: languages_evaluate_default8,
        parsers: ["yaml"],
        printers: ["yaml"]
      }
    );
  }
});

// node_modules/ignore/index.js
var require_ignore = __commonJS({
  "node_modules/ignore/index.js"(exports, module) {
    function makeArray(subject) {
      return Array.isArray(subject) ? subject : [subject];
    }
    var UNDEFINED = void 0;
    var EMPTY = "";
    var SPACE = " ";
    var ESCAPE = "\\";
    var REGEX_TEST_BLANK_LINE = /^\s+$/;
    var REGEX_INVALID_TRAILING_BACKSLASH = /(?:[^\\]|^)\\$/;
    var REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION = /^\\!/;
    var REGEX_REPLACE_LEADING_EXCAPED_HASH = /^\\#/;
    var REGEX_SPLITALL_CRLF = /\r?\n/g;
    var REGEX_TEST_INVALID_PATH = /^\.{0,2}\/|^\.{1,2}$/;
    var REGEX_TEST_TRAILING_SLASH = /\/$/;
    var SLASH = "/";
    var TMP_KEY_IGNORE = "node-ignore";
    if (typeof Symbol !== "undefined") {
      TMP_KEY_IGNORE = /* @__PURE__ */ Symbol.for("node-ignore");
    }
    var KEY_IGNORE = TMP_KEY_IGNORE;
    var define = (object, key2, value) => {
      Object.defineProperty(object, key2, { value });
      return value;
    };
    var REGEX_REGEXP_RANGE = /([0-z])-([0-z])/g;
    var RETURN_FALSE = () => false;
    var sanitizeRange = (range2) => range2.replace(
      REGEX_REGEXP_RANGE,
      (match2, from, to) => from.charCodeAt(0) <= to.charCodeAt(0) ? match2 : EMPTY
    );
    var cleanRangeBackSlash = (slashes) => {
      const { length } = slashes;
      return slashes.slice(0, length - length % 2);
    };
    var REPLACERS = [
      [
        // Remove BOM
        // TODO:
        // Other similar zero-width characters?
        /^\uFEFF/,
        () => EMPTY
      ],
      // > Trailing spaces are ignored unless they are quoted with backslash ("\")
      [
        // (a\ ) -> (a )
        // (a  ) -> (a)
        // (a ) -> (a)
        // (a \ ) -> (a  )
        /((?:\\\\)*?)(\\?\s+)$/,
        (_, m1, m2) => m1 + (m2.indexOf("\\") === 0 ? SPACE : EMPTY)
      ],
      // Replace (\ ) with ' '
      // (\ ) -> ' '
      // (\\ ) -> '\\ '
      // (\\\ ) -> '\\ '
      [
        /(\\+?)\s/g,
        (_, m1) => {
          const { length } = m1;
          return m1.slice(0, length - length % 2) + SPACE;
        }
      ],
      // Escape metacharacters
      // which is written down by users but means special for regular expressions.
      // > There are 12 characters with special meanings:
      // > - the backslash \,
      // > - the caret ^,
      // > - the dollar sign $,
      // > - the period or dot .,
      // > - the vertical bar or pipe symbol |,
      // > - the question mark ?,
      // > - the asterisk or star *,
      // > - the plus sign +,
      // > - the opening parenthesis (,
      // > - the closing parenthesis ),
      // > - and the opening square bracket [,
      // > - the opening curly brace {,
      // > These special characters are often called "metacharacters".
      [
        /[\\$.|*+(){^]/g,
        (match2) => `\\${match2}`
      ],
      [
        // > a question mark (?) matches a single character
        /(?!\\)\?/g,
        () => "[^/]"
      ],
      // leading slash
      [
        // > A leading slash matches the beginning of the pathname.
        // > For example, "/*.c" matches "cat-file.c" but not "mozilla-sha1/sha1.c".
        // A leading slash matches the beginning of the pathname
        /^\//,
        () => "^"
      ],
      // replace special metacharacter slash after the leading slash
      [
        /\//g,
        () => "\\/"
      ],
      [
        // > A leading "**" followed by a slash means match in all directories.
        // > For example, "**/foo" matches file or directory "foo" anywhere,
        // > the same as pattern "foo".
        // > "**/foo/bar" matches file or directory "bar" anywhere that is directly
        // >   under directory "foo".
        // Notice that the '*'s have been replaced as '\\*'
        /^\^*\\\*\\\*\\\//,
        // '**/foo' <-> 'foo'
        () => "^(?:.*\\/)?"
      ],
      // starting
      [
        // there will be no leading '/'
        //   (which has been replaced by section "leading slash")
        // If starts with '**', adding a '^' to the regular expression also works
        /^(?=[^^])/,
        function startingReplacer() {
          return !/\/(?!$)/.test(this) ? "(?:^|\\/)" : "^";
        }
      ],
      // two globstars
      [
        // Use lookahead assertions so that we could match more than one `'/**'`
        /\\\/\\\*\\\*(?=\\\/|$)/g,
        // Zero, one or several directories
        // should not use '*', or it will be replaced by the next replacer
        // Check if it is not the last `'/**'`
        (_, index, str) => index + 6 < str.length ? "(?:\\/[^\\/]+)*" : "\\/.+"
      ],
      // normal intermediate wildcards
      [
        // Never replace escaped '*'
        // ignore rule '\*' will match the path '*'
        // 'abc.*/' -> go
        // 'abc.*'  -> skip this rule,
        //    coz trailing single wildcard will be handed by [trailing wildcard]
        /(^|[^\\]+)(\\\*)+(?=.+)/g,
        // '*.js' matches '.js'
        // '*.js' doesn't match 'abc'
        (_, p1, p2) => {
          const unescaped = p2.replace(/\\\*/g, "[^\\/]*");
          return p1 + unescaped;
        }
      ],
      [
        // unescape, revert step 3 except for back slash
        // For example, if a user escape a '\\*',
        // after step 3, the result will be '\\\\\\*'
        /\\\\\\(?=[$.|*+(){^])/g,
        () => ESCAPE
      ],
      [
        // '\\\\' -> '\\'
        /\\\\/g,
        () => ESCAPE
      ],
      [
        // > The range notation, e.g. [a-zA-Z],
        // > can be used to match one of the characters in a range.
        // `\` is escaped by step 3
        /(\\)?\[([^\]/]*?)(\\*)($|\])/g,
        (match2, leadEscape, range2, endEscape, close) => leadEscape === ESCAPE ? `\\[${range2}${cleanRangeBackSlash(endEscape)}${close}` : close === "]" ? endEscape.length % 2 === 0 ? `[${sanitizeRange(range2)}${endEscape}]` : "[]" : "[]"
      ],
      // ending
      [
        // 'js' will not match 'js.'
        // 'ab' will not match 'abc'
        /(?:[^*])$/,
        // WTF!
        // https://git-scm.com/docs/gitignore
        // changes in [2.22.1](https://git-scm.com/docs/gitignore/2.22.1)
        // which re-fixes #24, #38
        // > If there is a separator at the end of the pattern then the pattern
        // > will only match directories, otherwise the pattern can match both
        // > files and directories.
        // 'js*' will not match 'a.js'
        // 'js/' will not match 'a.js'
        // 'js' will match 'a.js' and 'a.js/'
        (match2) => /\/$/.test(match2) ? `${match2}$` : `${match2}(?=$|\\/$)`
      ]
    ];
    var REGEX_REPLACE_TRAILING_WILDCARD = /(^|\\\/)?\\\*$/;
    var MODE_IGNORE = "regex";
    var MODE_CHECK_IGNORE = "checkRegex";
    var UNDERSCORE = "_";
    var TRAILING_WILD_CARD_REPLACERS = {
      [MODE_IGNORE](_, p1) {
        const prefix = p1 ? `${p1}[^/]+` : "[^/]*";
        return `${prefix}(?=$|\\/$)`;
      },
      [MODE_CHECK_IGNORE](_, p1) {
        const prefix = p1 ? `${p1}[^/]*` : "[^/]*";
        return `${prefix}(?=$|\\/$)`;
      }
    };
    var makeRegexPrefix = (pattern) => REPLACERS.reduce(
      (prev, [matcher, replacer]) => prev.replace(matcher, replacer.bind(pattern)),
      pattern
    );
    var isString = (subject) => typeof subject === "string";
    var checkPattern = (pattern) => pattern && isString(pattern) && !REGEX_TEST_BLANK_LINE.test(pattern) && !REGEX_INVALID_TRAILING_BACKSLASH.test(pattern) && pattern.indexOf("#") !== 0;
    var splitPattern = (pattern) => pattern.split(REGEX_SPLITALL_CRLF).filter(Boolean);
    var IgnoreRule = class {
      constructor(pattern, mark, body, ignoreCase, negative, prefix) {
        this.pattern = pattern;
        this.mark = mark;
        this.negative = negative;
        define(this, "body", body);
        define(this, "ignoreCase", ignoreCase);
        define(this, "regexPrefix", prefix);
      }
      get regex() {
        const key2 = UNDERSCORE + MODE_IGNORE;
        if (this[key2]) {
          return this[key2];
        }
        return this._make(MODE_IGNORE, key2);
      }
      get checkRegex() {
        const key2 = UNDERSCORE + MODE_CHECK_IGNORE;
        if (this[key2]) {
          return this[key2];
        }
        return this._make(MODE_CHECK_IGNORE, key2);
      }
      _make(mode, key2) {
        const str = this.regexPrefix.replace(
          REGEX_REPLACE_TRAILING_WILDCARD,
          // It does not need to bind pattern
          TRAILING_WILD_CARD_REPLACERS[mode]
        );
        const regex = this.ignoreCase ? new RegExp(str, "i") : new RegExp(str);
        return define(this, key2, regex);
      }
    };
    var createRule = ({
      pattern,
      mark
    }, ignoreCase) => {
      let negative = false;
      let body = pattern;
      if (body.indexOf("!") === 0) {
        negative = true;
        body = body.substr(1);
      }
      body = body.replace(REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION, "!").replace(REGEX_REPLACE_LEADING_EXCAPED_HASH, "#");
      const regexPrefix = makeRegexPrefix(body);
      return new IgnoreRule(
        pattern,
        mark,
        body,
        ignoreCase,
        negative,
        regexPrefix
      );
    };
    var RuleManager = class {
      constructor(ignoreCase) {
        this._ignoreCase = ignoreCase;
        this._rules = [];
      }
      _add(pattern) {
        if (pattern && pattern[KEY_IGNORE]) {
          this._rules = this._rules.concat(pattern._rules._rules);
          this._added = true;
          return;
        }
        if (isString(pattern)) {
          pattern = {
            pattern
          };
        }
        if (checkPattern(pattern.pattern)) {
          const rule = createRule(pattern, this._ignoreCase);
          this._added = true;
          this._rules.push(rule);
        }
      }
      // @param {Array<string> | string | Ignore} pattern
      add(pattern) {
        this._added = false;
        makeArray(
          isString(pattern) ? splitPattern(pattern) : pattern
        ).forEach(this._add, this);
        return this._added;
      }
      // Test one single path without recursively checking parent directories
      //
      // - checkUnignored `boolean` whether should check if the path is unignored,
      //   setting `checkUnignored` to `false` could reduce additional
      //   path matching.
      // - check `string` either `MODE_IGNORE` or `MODE_CHECK_IGNORE`
      // @returns {TestResult} true if a file is ignored
      test(path17, checkUnignored, mode) {
        let ignored = false;
        let unignored = false;
        let matchedRule;
        this._rules.forEach((rule) => {
          const { negative } = rule;
          if (unignored === negative && ignored !== unignored || negative && !ignored && !unignored && !checkUnignored) {
            return;
          }
          const matched = rule[mode].test(path17);
          if (!matched) {
            return;
          }
          ignored = !negative;
          unignored = negative;
          matchedRule = negative ? UNDEFINED : rule;
        });
        const ret = {
          ignored,
          unignored
        };
        if (matchedRule) {
          ret.rule = matchedRule;
        }
        return ret;
      }
    };
    var throwError = (message, Ctor) => {
      throw new Ctor(message);
    };
    var checkPath = (path17, originalPath, doThrow) => {
      if (!isString(path17)) {
        return doThrow(
          `path must be a string, but got \`${originalPath}\``,
          TypeError
        );
      }
      if (!path17) {
        return doThrow(`path must not be empty`, TypeError);
      }
      if (checkPath.isNotRelative(path17)) {
        const r = "`path.relative()`d";
        return doThrow(
          `path should be a ${r} string, but got "${originalPath}"`,
          RangeError
        );
      }
      return true;
    };
    var isNotRelative = (path17) => REGEX_TEST_INVALID_PATH.test(path17);
    checkPath.isNotRelative = isNotRelative;
    checkPath.convert = (p) => p;
    var Ignore = class {
      constructor({
        ignorecase = true,
        ignoreCase = ignorecase,
        allowRelativePaths = false
      } = {}) {
        define(this, KEY_IGNORE, true);
        this._rules = new RuleManager(ignoreCase);
        this._strictPathCheck = !allowRelativePaths;
        this._initCache();
      }
      _initCache() {
        this._ignoreCache = /* @__PURE__ */ Object.create(null);
        this._testCache = /* @__PURE__ */ Object.create(null);
      }
      add(pattern) {
        if (this._rules.add(pattern)) {
          this._initCache();
        }
        return this;
      }
      // legacy
      addPattern(pattern) {
        return this.add(pattern);
      }
      // @returns {TestResult}
      _test(originalPath, cache4, checkUnignored, slices) {
        const path17 = originalPath && checkPath.convert(originalPath);
        checkPath(
          path17,
          originalPath,
          this._strictPathCheck ? throwError : RETURN_FALSE
        );
        return this._t(path17, cache4, checkUnignored, slices);
      }
      checkIgnore(path17) {
        if (!REGEX_TEST_TRAILING_SLASH.test(path17)) {
          return this.test(path17);
        }
        const slices = path17.split(SLASH).filter(Boolean);
        slices.pop();
        if (slices.length) {
          const parent = this._t(
            slices.join(SLASH) + SLASH,
            this._testCache,
            true,
            slices
          );
          if (parent.ignored) {
            return parent;
          }
        }
        return this._rules.test(path17, false, MODE_CHECK_IGNORE);
      }
      _t(path17, cache4, checkUnignored, slices) {
        if (path17 in cache4) {
          return cache4[path17];
        }
        if (!slices) {
          slices = path17.split(SLASH).filter(Boolean);
        }
        slices.pop();
        if (!slices.length) {
          return cache4[path17] = this._rules.test(path17, checkUnignored, MODE_IGNORE);
        }
        const parent = this._t(
          slices.join(SLASH) + SLASH,
          cache4,
          checkUnignored,
          slices
        );
        return cache4[path17] = parent.ignored ? parent : this._rules.test(path17, checkUnignored, MODE_IGNORE);
      }
      ignores(path17) {
        return this._test(path17, this._ignoreCache, false).ignored;
      }
      createFilter() {
        return (path17) => !this.ignores(path17);
      }
      filter(paths) {
        return makeArray(paths).filter(this.createFilter());
      }
      // @returns {TestResult}
      test(path17) {
        return this._test(path17, this._testCache, true);
      }
    };
    var factory = (options7) => new Ignore(options7);
    var isPathValid = (path17) => checkPath(path17 && checkPath.convert(path17), path17, RETURN_FALSE);
    var setupWindows = () => {
      const makePosix = (str) => /^\\\\\?\\/.test(str) || /["<>|\u0000-\u001F]+/u.test(str) ? str : str.replace(/\\/g, "/");
      checkPath.convert = makePosix;
      const REGEX_TEST_WINDOWS_PATH_ABSOLUTE = /^[a-z]:\//i;
      checkPath.isNotRelative = (path17) => REGEX_TEST_WINDOWS_PATH_ABSOLUTE.test(path17) || isNotRelative(path17);
    };
    if (
      // Detect `process` so that it can run in browsers.
      typeof process !== "undefined" && process.platform === "win32"
    ) {
      setupWindows();
    }
    module.exports = factory;
    factory.default = factory;
    module.exports.isPathValid = isPathValid;
    define(module.exports, /* @__PURE__ */ Symbol.for("setupWindows"), setupWindows);
  }
});

// src/index.js
var index_exports = {};
__export(index_exports, {
  __debug: () => debugApis,
  __internal: () => sharedWithCli,
  check: () => check,
  clearConfigCache: () => clearCache3,
  doc: () => doc,
  format: () => format2,
  formatWithCursor: () => formatWithCursor2,
  getFileInfo: () => get_file_info_default,
  getSupportInfo: () => getSupportInfo2,
  resolveConfig: () => resolveConfig,
  resolveConfigFile: () => resolveConfigFile,
  util: () => public_exports,
  version: () => version_evaluate_default
});

// node_modules/diff/libesm/diff/base.js
var Diff = class {
  diff(oldStr, newStr, options7 = {}) {
    let callback;
    if (typeof options7 === "function") {
      callback = options7;
      options7 = {};
    } else if ("callback" in options7) {
      callback = options7.callback;
    }
    const oldString = this.castInput(oldStr, options7);
    const newString = this.castInput(newStr, options7);
    const oldTokens = this.removeEmpty(this.tokenize(oldString, options7));
    const newTokens = this.removeEmpty(this.tokenize(newString, options7));
    return this.diffWithOptionsObj(oldTokens, newTokens, options7, callback);
  }
  diffWithOptionsObj(oldTokens, newTokens, options7, callback) {
    var _a2;
    const done = (value) => {
      value = this.postProcess(value, options7);
      if (callback) {
        setTimeout(function() {
          callback(value);
        }, 0);
        return void 0;
      } else {
        return value;
      }
    };
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    if (options7.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options7.maxEditLength);
    }
    const maxExecutionTime = (_a2 = options7.timeout) !== null && _a2 !== void 0 ? _a2 : Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;
    const bestPath = [{ oldPos: -1, lastComponent: void 0 }];
    let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options7);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
    }
    let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
    const execEditLength = () => {
      for (let diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
        let basePath;
        const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          bestPath[diagonalPath - 1] = void 0;
        }
        let canAdd = false;
        if (addPath) {
          const addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        const canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = void 0;
          continue;
        }
        if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
          basePath = this.addToPath(addPath, true, false, 0, options7);
        } else {
          basePath = this.addToPath(removePath, false, true, 1, options7);
        }
        newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options7);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }
      editLength++;
    };
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback(void 0);
          }
          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        const ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  }
  addToPath(path17, added, removed, oldPosInc, options7) {
    const last = path17.lastComponent;
    if (last && !options7.oneChangePerToken && last.added === added && last.removed === removed) {
      return {
        oldPos: path17.oldPos + oldPosInc,
        lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
      };
    } else {
      return {
        oldPos: path17.oldPos + oldPosInc,
        lastComponent: { count: 1, added, removed, previousComponent: last }
      };
    }
  }
  extractCommon(basePath, newTokens, oldTokens, diagonalPath, options7) {
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options7)) {
      newPos++;
      oldPos++;
      commonCount++;
      if (options7.oneChangePerToken) {
        basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
      }
    }
    if (commonCount && !options7.oneChangePerToken) {
      basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
    }
    basePath.oldPos = oldPos;
    return newPos;
  }
  equals(left, right, options7) {
    if (options7.comparator) {
      return options7.comparator(left, right);
    } else {
      return left === right || !!options7.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  }
  removeEmpty(array2) {
    const ret = [];
    for (let i = 0; i < array2.length; i++) {
      if (array2[i]) {
        ret.push(array2[i]);
      }
    }
    return ret;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  castInput(value, options7) {
    return value;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tokenize(value, options7) {
    return Array.from(value);
  }
  join(chars) {
    return chars.join("");
  }
  postProcess(changeObjects, options7) {
    return changeObjects;
  }
  get useLongestToken() {
    return false;
  }
  buildValues(lastComponent, newTokens, oldTokens) {
    const components = [];
    let nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();
    const componentLen = components.length;
    let componentPos = 0, newPos = 0, oldPos = 0;
    for (; componentPos < componentLen; componentPos++) {
      const component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          let value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value2, i) {
            const oldValue = oldTokens[oldPos + i];
            return oldValue.length > value2.length ? oldValue : value2;
          });
          component.value = this.join(value);
        } else {
          component.value = this.join(newTokens.slice(newPos, newPos + component.count));
        }
        newPos += component.count;
        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
        oldPos += component.count;
      }
    }
    return components;
  }
};

// node_modules/diff/libesm/diff/line.js
var LineDiff = class extends Diff {
  constructor() {
    super(...arguments);
    this.tokenize = tokenize;
  }
  equals(left, right, options7) {
    if (options7.ignoreWhitespace) {
      if (!options7.newlineIsToken || !left.includes("\n")) {
        left = left.trim();
      }
      if (!options7.newlineIsToken || !right.includes("\n")) {
        right = right.trim();
      }
    } else if (options7.ignoreNewlineAtEof && !options7.newlineIsToken) {
      if (left.endsWith("\n")) {
        left = left.slice(0, -1);
      }
      if (right.endsWith("\n")) {
        right = right.slice(0, -1);
      }
    }
    return super.equals(left, right, options7);
  }
};
var lineDiff = new LineDiff();
function diffLines(oldStr, newStr, options7) {
  return lineDiff.diff(oldStr, newStr, options7);
}
function tokenize(value, options7) {
  if (options7.stripTrailingCr) {
    value = value.replace(/\r\n/g, "\n");
  }
  const retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (let i = 0; i < linesAndNewlines.length; i++) {
    const line3 = linesAndNewlines[i];
    if (i % 2 && !options7.newlineIsToken) {
      retLines[retLines.length - 1] += line3;
    } else {
      retLines.push(line3);
    }
  }
  return retLines;
}

// node_modules/diff/libesm/diff/array.js
var ArrayDiff = class extends Diff {
  tokenize(value) {
    return value.slice();
  }
  join(value) {
    return value;
  }
  removeEmpty(value) {
    return value;
  }
};
var arrayDiff = new ArrayDiff();
function diffArrays(oldArr, newArr, options7) {
  return arrayDiff.diff(oldArr, newArr, options7);
}

// node_modules/diff/libesm/patch/create.js
function needsQuoting(s) {
  for (let i = 0; i < s.length; i++) {
    if (s[i] < " " || s[i] > "~" || s[i] === '"' || s[i] === "\\") {
      return true;
    }
  }
  return false;
}
function quoteFileNameIfNeeded(s) {
  if (!needsQuoting(s)) {
    return s;
  }
  let result = '"';
  const bytes = new TextEncoder().encode(s);
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b === 7) {
      result += "\\a";
    } else if (b === 8) {
      result += "\\b";
    } else if (b === 9) {
      result += "\\t";
    } else if (b === 10) {
      result += "\\n";
    } else if (b === 11) {
      result += "\\v";
    } else if (b === 12) {
      result += "\\f";
    } else if (b === 13) {
      result += "\\r";
    } else if (b === 34) {
      result += '\\"';
    } else if (b === 92) {
      result += "\\\\";
    } else if (b >= 32 && b <= 126) {
      result += String.fromCharCode(b);
    } else {
      result += "\\" + b.toString(8).padStart(3, "0");
    }
    i++;
  }
  result += '"';
  return result;
}
var INCLUDE_HEADERS = {
  includeIndex: true,
  includeUnderline: true,
  includeFileHeaders: true
};
function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options7) {
  let optionsObj;
  if (!options7) {
    optionsObj = {};
  } else if (typeof options7 === "function") {
    optionsObj = { callback: options7 };
  } else {
    optionsObj = options7;
  }
  if (typeof optionsObj.context === "undefined") {
    optionsObj.context = 4;
  }
  const context = optionsObj.context;
  if (optionsObj.newlineIsToken) {
    throw new Error("newlineIsToken may not be used with patch-generation functions, only with diffing functions");
  }
  if (!optionsObj.callback) {
    return diffLinesResultToPatch(diffLines(oldStr, newStr, optionsObj));
  } else {
    const { callback } = optionsObj;
    diffLines(oldStr, newStr, Object.assign(Object.assign({}, optionsObj), { callback: (diff) => {
      const patch = diffLinesResultToPatch(diff);
      callback(patch);
    } }));
  }
  function diffLinesResultToPatch(diff) {
    if (!diff) {
      return;
    }
    diff.push({ value: "", lines: [] });
    function contextLines(lines) {
      return lines.map(function(entry) {
        return " " + entry;
      });
    }
    const hunks = [];
    let oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
    for (let i = 0; i < diff.length; i++) {
      const current = diff[i], lines = current.lines || splitLines(current.value);
      current.lines = lines;
      if (current.added || current.removed) {
        if (!oldRangeStart) {
          const prev = diff[i - 1];
          oldRangeStart = oldLine;
          newRangeStart = newLine;
          if (prev) {
            curRange = context > 0 ? contextLines(prev.lines.slice(-context)) : [];
            oldRangeStart -= curRange.length;
            newRangeStart -= curRange.length;
          }
        }
        for (const line3 of lines) {
          curRange.push((current.added ? "+" : "-") + line3);
        }
        if (current.added) {
          newLine += lines.length;
        } else {
          oldLine += lines.length;
        }
      } else {
        if (oldRangeStart) {
          if (lines.length <= context * 2 && i < diff.length - 2) {
            for (const line3 of contextLines(lines)) {
              curRange.push(line3);
            }
          } else {
            const contextSize = Math.min(lines.length, context);
            for (const line3 of contextLines(lines.slice(0, contextSize))) {
              curRange.push(line3);
            }
            const hunk = {
              oldStart: oldRangeStart,
              oldLines: oldLine - oldRangeStart + contextSize,
              newStart: newRangeStart,
              newLines: newLine - newRangeStart + contextSize,
              lines: curRange
            };
            hunks.push(hunk);
            oldRangeStart = 0;
            newRangeStart = 0;
            curRange = [];
          }
        }
        oldLine += lines.length;
        newLine += lines.length;
      }
    }
    for (const hunk of hunks) {
      for (let i = 0; i < hunk.lines.length; i++) {
        if (hunk.lines[i].endsWith("\n")) {
          hunk.lines[i] = hunk.lines[i].slice(0, -1);
        } else {
          hunk.lines.splice(i + 1, 0, "\\ No newline at end of file");
          i++;
        }
      }
    }
    return {
      oldFileName,
      newFileName,
      oldHeader,
      newHeader,
      hunks
    };
  }
}
function formatPatch(patch, headerOptions) {
  var _a2, _b, _c, _d, _e, _f;
  if (!headerOptions) {
    headerOptions = INCLUDE_HEADERS;
  }
  if (Array.isArray(patch)) {
    if (patch.length > 1 && !headerOptions.includeFileHeaders && !patch.every((p) => p.isGit)) {
      throw new Error("Cannot omit file headers on a multi-file patch. (The result would be unparseable; how would a tool trying to apply the patch know which changes are to which file?)");
    }
    return patch.map((p) => formatPatch(p, headerOptions)).join("\n");
  }
  const ret = [];
  if (patch.isGit) {
    headerOptions = INCLUDE_HEADERS;
    if (!patch.oldFileName) {
      throw new Error("oldFileName must be specified for Git patches");
    }
    if (!patch.newFileName) {
      throw new Error("newFileName must be specified for Git patches");
    }
    let gitOldName = patch.oldFileName;
    let gitNewName = patch.newFileName;
    if (patch.isCreate && gitOldName === "/dev/null") {
      gitOldName = gitNewName.replace(/^b\//, "a/");
    } else if (patch.isDelete && gitNewName === "/dev/null") {
      gitNewName = gitOldName.replace(/^a\//, "b/");
    }
    ret.push("diff --git " + quoteFileNameIfNeeded(gitOldName) + " " + quoteFileNameIfNeeded(gitNewName));
    if (patch.isDelete) {
      ret.push("deleted file mode " + ((_a2 = patch.oldMode) !== null && _a2 !== void 0 ? _a2 : "100644"));
    }
    if (patch.isCreate) {
      ret.push("new file mode " + ((_b = patch.newMode) !== null && _b !== void 0 ? _b : "100644"));
    }
    if (patch.oldMode && patch.newMode && !patch.isDelete && !patch.isCreate) {
      ret.push("old mode " + patch.oldMode);
      ret.push("new mode " + patch.newMode);
    }
    if (patch.isRename) {
      ret.push("rename from " + quoteFileNameIfNeeded(((_c = patch.oldFileName) !== null && _c !== void 0 ? _c : "").replace(/^a\//, "")));
      ret.push("rename to " + quoteFileNameIfNeeded(((_d = patch.newFileName) !== null && _d !== void 0 ? _d : "").replace(/^b\//, "")));
    }
    if (patch.isCopy) {
      ret.push("copy from " + quoteFileNameIfNeeded(((_e = patch.oldFileName) !== null && _e !== void 0 ? _e : "").replace(/^a\//, "")));
      ret.push("copy to " + quoteFileNameIfNeeded(((_f = patch.newFileName) !== null && _f !== void 0 ? _f : "").replace(/^b\//, "")));
    }
  } else {
    if (headerOptions.includeIndex && patch.oldFileName == patch.newFileName && patch.oldFileName !== void 0) {
      ret.push("Index: " + patch.oldFileName);
    }
    if (headerOptions.includeUnderline) {
      ret.push("===================================================================");
    }
  }
  const hasHunks = patch.hunks.length > 0;
  if (headerOptions.includeFileHeaders && patch.oldFileName !== void 0 && patch.newFileName !== void 0 && (!patch.isGit || hasHunks)) {
    ret.push("--- " + quoteFileNameIfNeeded(patch.oldFileName) + (patch.oldHeader ? "	" + patch.oldHeader : ""));
    ret.push("+++ " + quoteFileNameIfNeeded(patch.newFileName) + (patch.newHeader ? "	" + patch.newHeader : ""));
  }
  for (let i = 0; i < patch.hunks.length; i++) {
    const hunk = patch.hunks[i];
    const oldStart = hunk.oldLines === 0 ? hunk.oldStart - 1 : hunk.oldStart;
    const newStart = hunk.newLines === 0 ? hunk.newStart - 1 : hunk.newStart;
    ret.push("@@ -" + oldStart + "," + hunk.oldLines + " +" + newStart + "," + hunk.newLines + " @@");
    for (const line3 of hunk.lines) {
      ret.push(line3);
    }
  }
  return ret.join("\n") + "\n";
}
function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options7) {
  if (typeof options7 === "function") {
    options7 = { callback: options7 };
  }
  if (!(options7 === null || options7 === void 0 ? void 0 : options7.callback)) {
    const patchObj = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options7);
    if (!patchObj) {
      return;
    }
    return formatPatch(patchObj, options7 === null || options7 === void 0 ? void 0 : options7.headerOptions);
  } else {
    const { callback } = options7;
    structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, Object.assign(Object.assign({}, options7), { callback: (patchObj) => {
      if (!patchObj) {
        callback(void 0);
      } else {
        callback(formatPatch(patchObj, options7.headerOptions));
      }
    } }));
  }
}
function splitLines(text) {
  const hasTrailingNl = text.endsWith("\n");
  const result = text.split("\n").map((line3) => line3 + "\n");
  if (hasTrailingNl) {
    result.pop();
  } else {
    result.push(result.pop().slice(0, -1));
  }
  return result;
}

// src/index.js
var import_fast_glob = __toESM(require_out4(), 1);

// node_modules/leven/index.js
var array = [];
var characterCodeCache = [];
function leven(first, second, options7) {
  if (first === second) {
    return 0;
  }
  const maxDistance = options7?.maxDistance;
  const swap = first;
  if (first.length > second.length) {
    first = second;
    second = swap;
  }
  let firstLength = first.length;
  let secondLength = second.length;
  while (firstLength > 0 && first.charCodeAt(~-firstLength) === second.charCodeAt(~-secondLength)) {
    firstLength--;
    secondLength--;
  }
  let start = 0;
  while (start < firstLength && first.charCodeAt(start) === second.charCodeAt(start)) {
    start++;
  }
  firstLength -= start;
  secondLength -= start;
  if (maxDistance !== void 0 && secondLength - firstLength > maxDistance) {
    return maxDistance;
  }
  if (firstLength === 0) {
    return maxDistance !== void 0 && secondLength > maxDistance ? maxDistance : secondLength;
  }
  let bCharacterCode;
  let result;
  let temporary;
  let temporary2;
  let index = 0;
  let index2 = 0;
  while (index < firstLength) {
    characterCodeCache[index] = first.charCodeAt(start + index);
    array[index] = ++index;
  }
  while (index2 < secondLength) {
    bCharacterCode = second.charCodeAt(start + index2);
    temporary = index2++;
    result = index2;
    for (index = 0; index < firstLength; index++) {
      temporary2 = bCharacterCode === characterCodeCache[index] ? temporary : temporary + 1;
      temporary = array[index];
      result = array[index] = temporary > result ? temporary2 > result ? result + 1 : temporary2 : temporary2 > temporary ? temporary + 1 : temporary2;
    }
    if (maxDistance !== void 0) {
      let rowMinimum = result;
      for (index = 0; index < firstLength; index++) {
        if (array[index] < rowMinimum) {
          rowMinimum = array[index];
        }
      }
      if (rowMinimum > maxDistance) {
        return maxDistance;
      }
    }
  }
  array.length = firstLength;
  characterCodeCache.length = firstLength;
  return maxDistance !== void 0 && result > maxDistance ? maxDistance : result;
}
function closestMatch(target, candidates, options7) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return void 0;
  }
  const userMax = options7?.maxDistance;
  const targetLength = target.length;
  for (const candidate of candidates) {
    if (candidate === target) {
      return candidate;
    }
  }
  if (userMax === 0) {
    return void 0;
  }
  let best;
  let bestDist = Number.POSITIVE_INFINITY;
  const seen = /* @__PURE__ */ new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    const lengthDiff = Math.abs(candidate.length - targetLength);
    if (lengthDiff >= bestDist) {
      continue;
    }
    if (userMax !== void 0 && lengthDiff > userMax) {
      continue;
    }
    const cap = Number.isFinite(bestDist) ? userMax === void 0 ? bestDist : Math.min(bestDist, userMax) : userMax;
    const distance = cap === void 0 ? leven(target, candidate) : leven(target, candidate, { maxDistance: cap });
    if (userMax !== void 0 && distance > userMax) {
      continue;
    }
    let actualD = distance;
    if (cap !== void 0 && distance === cap && cap === userMax) {
      actualD = leven(target, candidate);
    }
    if (actualD < bestDist) {
      bestDist = actualD;
      best = candidate;
      if (bestDist === 0) {
        break;
      }
    }
  }
  if (userMax !== void 0 && bestDist > userMax) {
    return void 0;
  }
  return best;
}

// src/index.js
var import_picocolors4 = __toESM(require_picocolors(), 1);

// node_modules/vnopts/lib/descriptors/api.js
var apiDescriptor = {
  key: (key2) => /^[$_a-zA-Z][$_a-zA-Z0-9]*$/.test(key2) ? key2 : JSON.stringify(key2),
  value(value) {
    if (value === null || typeof value !== "object") {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return `[${value.map((subValue) => apiDescriptor.value(subValue)).join(", ")}]`;
    }
    const keys = Object.keys(value);
    return keys.length === 0 ? "{}" : `{ ${keys.map((key2) => `${apiDescriptor.key(key2)}: ${apiDescriptor.value(value[key2])}`).join(", ")} }`;
  },
  pair: ({ key: key2, value }) => apiDescriptor.value({ [key2]: value })
};

// node_modules/vnopts/lib/handlers/deprecated/common.js
var import_picocolors = __toESM(require_picocolors(), 1);
var commonDeprecatedHandler = (keyOrPair, redirectTo, { descriptor }) => {
  const messages2 = [
    `${import_picocolors.default.yellow(typeof keyOrPair === "string" ? descriptor.key(keyOrPair) : descriptor.pair(keyOrPair))} is deprecated`
  ];
  if (redirectTo) {
    messages2.push(`we now treat it as ${import_picocolors.default.blue(typeof redirectTo === "string" ? descriptor.key(redirectTo) : descriptor.pair(redirectTo))}`);
  }
  return messages2.join("; ") + ".";
};

// node_modules/vnopts/lib/handlers/invalid/common.js
var import_picocolors2 = __toESM(require_picocolors(), 1);

// node_modules/vnopts/lib/constants.js
var VALUE_NOT_EXIST = /* @__PURE__ */ Symbol.for("vnopts.VALUE_NOT_EXIST");
var VALUE_UNCHANGED = /* @__PURE__ */ Symbol.for("vnopts.VALUE_UNCHANGED");

// node_modules/vnopts/lib/handlers/invalid/common.js
var INDENTATION = " ".repeat(2);
var commonInvalidHandler = (key2, value, utils) => {
  const { text, list } = utils.normalizeExpectedResult(utils.schemas[key2].expected(utils));
  const descriptions = [];
  if (text) {
    descriptions.push(getDescription(key2, value, text, utils.descriptor));
  }
  if (list) {
    descriptions.push([getDescription(key2, value, list.title, utils.descriptor)].concat(list.values.map((valueDescription) => getListDescription(valueDescription, utils.loggerPrintWidth))).join("\n"));
  }
  return chooseDescription(descriptions, utils.loggerPrintWidth);
};
function getDescription(key2, value, expected, descriptor) {
  return [
    `Invalid ${import_picocolors2.default.red(descriptor.key(key2))} value.`,
    `Expected ${import_picocolors2.default.blue(expected)},`,
    `but received ${value === VALUE_NOT_EXIST ? import_picocolors2.default.gray("nothing") : import_picocolors2.default.red(descriptor.value(value))}.`
  ].join(" ");
}
function getListDescription({ text, list }, printWidth) {
  const descriptions = [];
  if (text) {
    descriptions.push(`- ${import_picocolors2.default.blue(text)}`);
  }
  if (list) {
    descriptions.push([`- ${import_picocolors2.default.blue(list.title)}:`].concat(list.values.map((valueDescription) => getListDescription(valueDescription, printWidth - INDENTATION.length).replace(/^|\n/g, `$&${INDENTATION}`))).join("\n"));
  }
  return chooseDescription(descriptions, printWidth);
}
function chooseDescription(descriptions, printWidth) {
  if (descriptions.length === 1) {
    return descriptions[0];
  }
  const [firstDescription, secondDescription] = descriptions;
  const [firstWidth, secondWidth] = descriptions.map((description) => description.split("\n", 1)[0].length);
  return firstWidth > printWidth && firstWidth > secondWidth ? secondDescription : firstDescription;
}

// node_modules/vnopts/lib/handlers/unknown/leven.js
var import_picocolors3 = __toESM(require_picocolors(), 1);
var levenUnknownHandler = (key2, value, { descriptor, logger, schemas }) => {
  const messages2 = [
    `Ignored unknown option ${import_picocolors3.default.yellow(descriptor.pair({ key: key2, value }))}.`
  ];
  const suggestion = closestMatch(key2, Object.keys(schemas), { maxDistance: 3 });
  if (suggestion) {
    messages2.push(`Did you mean ${import_picocolors3.default.blue(descriptor.key(suggestion))}?`);
  }
  logger.warn(messages2.join(" "));
};

// node_modules/vnopts/lib/schema.js
var HANDLER_KEYS = [
  "default",
  "expected",
  "validate",
  "deprecated",
  "forward",
  "redirect",
  "overlap",
  "preprocess",
  "postprocess"
];
function createSchema(SchemaConstructor, parameters) {
  const schema = new SchemaConstructor(parameters);
  const subSchema = Object.create(schema);
  for (const handlerKey of HANDLER_KEYS) {
    if (handlerKey in parameters) {
      subSchema[handlerKey] = normalizeHandler(parameters[handlerKey], schema, Schema.prototype[handlerKey].length);
    }
  }
  return subSchema;
}
var Schema = class {
  static create(parameters) {
    return createSchema(this, parameters);
  }
  constructor(parameters) {
    this.name = parameters.name;
  }
  default(_utils) {
    return void 0;
  }
  // this is actually an abstract method but we need a placeholder to get `function.length`
  /* c8 ignore start */
  expected(_utils) {
    return "nothing";
  }
  /* c8 ignore stop */
  // this is actually an abstract method but we need a placeholder to get `function.length`
  /* c8 ignore start */
  validate(_value, _utils) {
    return false;
  }
  /* c8 ignore stop */
  deprecated(_value, _utils) {
    return false;
  }
  forward(_value, _utils) {
    return void 0;
  }
  redirect(_value, _utils) {
    return void 0;
  }
  overlap(currentValue, _newValue, _utils) {
    return currentValue;
  }
  preprocess(value, _utils) {
    return value;
  }
  postprocess(_value, _utils) {
    return VALUE_UNCHANGED;
  }
};
function normalizeHandler(handler, superSchema, handlerArgumentsLength) {
  return typeof handler === "function" ? (...args) => handler(...args.slice(0, handlerArgumentsLength - 1), superSchema, ...args.slice(handlerArgumentsLength - 1)) : () => handler;
}

// node_modules/vnopts/lib/schemas/alias.js
var AliasSchema = class extends Schema {
  constructor(parameters) {
    super(parameters);
    this._sourceName = parameters.sourceName;
  }
  expected(utils) {
    return utils.schemas[this._sourceName].expected(utils);
  }
  validate(value, utils) {
    return utils.schemas[this._sourceName].validate(value, utils);
  }
  redirect(_value, _utils) {
    return this._sourceName;
  }
};

// node_modules/vnopts/lib/schemas/any.js
var AnySchema = class extends Schema {
  expected() {
    return "anything";
  }
  validate() {
    return true;
  }
};

// node_modules/vnopts/lib/schemas/array.js
var ArraySchema = class extends Schema {
  constructor({ valueSchema, name = valueSchema.name, ...handlers }) {
    super({ ...handlers, name });
    this._valueSchema = valueSchema;
  }
  expected(utils) {
    const { text, list } = utils.normalizeExpectedResult(this._valueSchema.expected(utils));
    return {
      text: text && `an array of ${text}`,
      list: list && {
        title: `an array of the following values`,
        values: [{ list }]
      }
    };
  }
  validate(value, utils) {
    if (!Array.isArray(value)) {
      return false;
    }
    const invalidValues = [];
    for (const subValue of value) {
      const subValidateResult = utils.normalizeValidateResult(this._valueSchema.validate(subValue, utils), subValue);
      if (subValidateResult !== true) {
        invalidValues.push(subValidateResult.value);
      }
    }
    return invalidValues.length === 0 ? true : { value: invalidValues };
  }
  deprecated(value, utils) {
    const deprecatedResult = [];
    for (const subValue of value) {
      const subDeprecatedResult = utils.normalizeDeprecatedResult(this._valueSchema.deprecated(subValue, utils), subValue);
      if (subDeprecatedResult !== false) {
        deprecatedResult.push(...subDeprecatedResult.map(({ value: deprecatedValue }) => ({
          value: [deprecatedValue]
        })));
      }
    }
    return deprecatedResult;
  }
  forward(value, utils) {
    const forwardResult = [];
    for (const subValue of value) {
      const subForwardResult = utils.normalizeForwardResult(this._valueSchema.forward(subValue, utils), subValue);
      forwardResult.push(...subForwardResult.map(wrapTransferResult));
    }
    return forwardResult;
  }
  redirect(value, utils) {
    const remain = [];
    const redirect = [];
    for (const subValue of value) {
      const subRedirectResult = utils.normalizeRedirectResult(this._valueSchema.redirect(subValue, utils), subValue);
      if ("remain" in subRedirectResult) {
        remain.push(subRedirectResult.remain);
      }
      redirect.push(...subRedirectResult.redirect.map(wrapTransferResult));
    }
    return remain.length === 0 ? { redirect } : { redirect, remain };
  }
  overlap(currentValue, newValue) {
    return currentValue.concat(newValue);
  }
};
function wrapTransferResult({ from, to }) {
  return { from: [from], to };
}

// node_modules/vnopts/lib/schemas/boolean.js
var BooleanSchema = class extends Schema {
  expected() {
    return "true or false";
  }
  validate(value) {
    return typeof value === "boolean";
  }
};

// node_modules/vnopts/lib/utils.js
function recordFromArray(array2, mainKey) {
  const record = /* @__PURE__ */ Object.create(null);
  for (const value of array2) {
    const key2 = value[mainKey];
    if (record[key2]) {
      throw new Error(`Duplicate ${mainKey} ${JSON.stringify(key2)}`);
    }
    record[key2] = value;
  }
  return record;
}
function mapFromArray(array2, mainKey) {
  const map = /* @__PURE__ */ new Map();
  for (const value of array2) {
    const key2 = value[mainKey];
    if (map.has(key2)) {
      throw new Error(`Duplicate ${mainKey} ${JSON.stringify(key2)}`);
    }
    map.set(key2, value);
  }
  return map;
}
function createAutoChecklist() {
  const map = /* @__PURE__ */ Object.create(null);
  return (id) => {
    const idString = JSON.stringify(id);
    if (map[idString]) {
      return true;
    }
    map[idString] = true;
    return false;
  };
}
function partition(array2, predicate) {
  const trueArray = [];
  const falseArray = [];
  for (const value of array2) {
    if (predicate(value)) {
      trueArray.push(value);
    } else {
      falseArray.push(value);
    }
  }
  return [trueArray, falseArray];
}
function isInt(value) {
  return value === Math.floor(value);
}
function comparePrimitive(a, b) {
  if (a === b) {
    return 0;
  }
  const typeofA = typeof a;
  const typeofB = typeof b;
  const orders = [
    "undefined",
    "object",
    // null
    "boolean",
    "number",
    "string"
  ];
  if (typeofA !== typeofB) {
    return orders.indexOf(typeofA) - orders.indexOf(typeofB);
  }
  if (typeofA !== "string") {
    return Number(a) - Number(b);
  }
  return a.localeCompare(b);
}
function normalizeInvalidHandler(invalidHandler) {
  return (...args) => {
    const errorMessageOrError = invalidHandler(...args);
    return typeof errorMessageOrError === "string" ? new Error(errorMessageOrError) : errorMessageOrError;
  };
}
function normalizeDefaultResult(result) {
  return result === void 0 ? {} : result;
}
function normalizeExpectedResult(result) {
  if (typeof result === "string") {
    return { text: result };
  }
  const { text, list } = result;
  assert((text || list) !== void 0, "Unexpected `expected` result, there should be at least one field.");
  if (!list) {
    return { text };
  }
  return {
    text,
    list: {
      title: list.title,
      values: list.values.map(normalizeExpectedResult)
    }
  };
}
function normalizeValidateResult(result, value) {
  return result === true ? true : result === false ? { value } : result;
}
function normalizeDeprecatedResult(result, value, doNotNormalizeTrue = false) {
  return result === false ? false : result === true ? doNotNormalizeTrue ? true : [{ value }] : "value" in result ? [result] : result.length === 0 ? false : result;
}
function normalizeTransferResult(result, value) {
  return typeof result === "string" || "key" in result ? { from: value, to: result } : "from" in result ? { from: result.from, to: result.to } : { from: value, to: result.to };
}
function normalizeForwardResult(result, value) {
  return result === void 0 ? [] : Array.isArray(result) ? result.map((transferResult) => normalizeTransferResult(transferResult, value)) : [normalizeTransferResult(result, value)];
}
function normalizeRedirectResult(result, value) {
  const redirect = normalizeForwardResult(typeof result === "object" && "redirect" in result ? result.redirect : result, value);
  return redirect.length === 0 ? { remain: value, redirect } : typeof result === "object" && "remain" in result ? { remain: result.remain, redirect } : { redirect };
}
function assert(isValid, message) {
  if (!isValid) {
    throw new Error(message);
  }
}

// node_modules/vnopts/lib/schemas/choice.js
var ChoiceSchema = class extends Schema {
  constructor(parameters) {
    super(parameters);
    this._choices = mapFromArray(parameters.choices.map((choice) => choice && typeof choice === "object" ? choice : { value: choice }), "value");
  }
  expected({ descriptor }) {
    const choiceDescriptions = Array.from(this._choices.keys()).map((value) => this._choices.get(value)).filter(({ hidden }) => !hidden).map((choiceInfo) => choiceInfo.value).sort(comparePrimitive).map(descriptor.value);
    const head = choiceDescriptions.slice(0, -2);
    const tail = choiceDescriptions.slice(-2);
    const message = head.concat(tail.join(" or ")).join(", ");
    return {
      text: message,
      list: {
        title: "one of the following values",
        values: choiceDescriptions
      }
    };
  }
  validate(value) {
    return this._choices.has(value);
  }
  deprecated(value) {
    const choiceInfo = this._choices.get(value);
    return choiceInfo && choiceInfo.deprecated ? { value } : false;
  }
  forward(value) {
    const choiceInfo = this._choices.get(value);
    return choiceInfo ? choiceInfo.forward : void 0;
  }
  redirect(value) {
    const choiceInfo = this._choices.get(value);
    return choiceInfo ? choiceInfo.redirect : void 0;
  }
};

// node_modules/vnopts/lib/schemas/number.js
var NumberSchema = class extends Schema {
  expected() {
    return "a number";
  }
  validate(value, _utils) {
    return typeof value === "number";
  }
};

// node_modules/vnopts/lib/schemas/integer.js
var IntegerSchema = class extends NumberSchema {
  expected() {
    return "an integer";
  }
  validate(value, utils) {
    return utils.normalizeValidateResult(super.validate(value, utils), value) === true && isInt(value);
  }
};

// node_modules/vnopts/lib/schemas/string.js
var StringSchema = class extends Schema {
  expected() {
    return "a string";
  }
  validate(value) {
    return typeof value === "string";
  }
};

// node_modules/vnopts/lib/defaults.js
var defaultDescriptor = apiDescriptor;
var defaultUnknownHandler = levenUnknownHandler;
var defaultInvalidHandler = commonInvalidHandler;
var defaultDeprecatedHandler = commonDeprecatedHandler;

// node_modules/vnopts/lib/normalize.js
var Normalizer = class {
  constructor(schemas, opts2) {
    const { logger = console, loggerPrintWidth = 80, descriptor = defaultDescriptor, unknown = defaultUnknownHandler, invalid = defaultInvalidHandler, deprecated = defaultDeprecatedHandler, missing = () => false, required = () => false, preprocess = (x) => x, postprocess = () => VALUE_UNCHANGED } = opts2 || {};
    this._utils = {
      descriptor,
      logger: (
        /* c8 ignore next */
        logger || { warn: () => {
        } }
      ),
      loggerPrintWidth,
      schemas: recordFromArray(schemas, "name"),
      normalizeDefaultResult,
      normalizeExpectedResult,
      normalizeDeprecatedResult,
      normalizeForwardResult,
      normalizeRedirectResult,
      normalizeValidateResult
    };
    this._unknownHandler = unknown;
    this._invalidHandler = normalizeInvalidHandler(invalid);
    this._deprecatedHandler = deprecated;
    this._identifyMissing = (k, o) => !(k in o) || missing(k, o);
    this._identifyRequired = required;
    this._preprocess = preprocess;
    this._postprocess = postprocess;
    this.cleanHistory();
  }
  cleanHistory() {
    this._hasDeprecationWarned = createAutoChecklist();
  }
  normalize(options7) {
    const newOptions = {};
    const preprocessed = this._preprocess(options7, this._utils);
    const restOptionsArray = [preprocessed];
    const applyNormalization = () => {
      while (restOptionsArray.length !== 0) {
        const currentOptions = restOptionsArray.shift();
        const transferredOptionsArray = this._applyNormalization(currentOptions, newOptions);
        restOptionsArray.push(...transferredOptionsArray);
      }
    };
    applyNormalization();
    for (const key2 of Object.keys(this._utils.schemas)) {
      const schema = this._utils.schemas[key2];
      if (!(key2 in newOptions)) {
        const defaultResult = normalizeDefaultResult(schema.default(this._utils));
        if ("value" in defaultResult) {
          restOptionsArray.push({ [key2]: defaultResult.value });
        }
      }
    }
    applyNormalization();
    for (const key2 of Object.keys(this._utils.schemas)) {
      if (!(key2 in newOptions)) {
        continue;
      }
      const schema = this._utils.schemas[key2];
      const value = newOptions[key2];
      const newValue = schema.postprocess(value, this._utils);
      if (newValue === VALUE_UNCHANGED) {
        continue;
      }
      this._applyValidation(newValue, key2, schema);
      newOptions[key2] = newValue;
    }
    this._applyPostprocess(newOptions);
    this._applyRequiredCheck(newOptions);
    return newOptions;
  }
  _applyNormalization(options7, newOptions) {
    const transferredOptionsArray = [];
    const { knownKeys, unknownKeys } = this._partitionOptionKeys(options7);
    for (const key2 of knownKeys) {
      const schema = this._utils.schemas[key2];
      const value = schema.preprocess(options7[key2], this._utils);
      this._applyValidation(value, key2, schema);
      const appendTransferredOptions = ({ from, to }) => {
        transferredOptionsArray.push(typeof to === "string" ? { [to]: from } : { [to.key]: to.value });
      };
      const warnDeprecated = ({ value: currentValue, redirectTo }) => {
        const deprecatedResult = normalizeDeprecatedResult(
          schema.deprecated(currentValue, this._utils),
          value,
          /* doNotNormalizeTrue */
          true
        );
        if (deprecatedResult === false) {
          return;
        }
        if (deprecatedResult === true) {
          if (!this._hasDeprecationWarned(key2)) {
            this._utils.logger.warn(this._deprecatedHandler(key2, redirectTo, this._utils));
          }
        } else {
          for (const { value: deprecatedValue } of deprecatedResult) {
            const pair = { key: key2, value: deprecatedValue };
            if (!this._hasDeprecationWarned(pair)) {
              const redirectToPair = typeof redirectTo === "string" ? { key: redirectTo, value: deprecatedValue } : redirectTo;
              this._utils.logger.warn(this._deprecatedHandler(pair, redirectToPair, this._utils));
            }
          }
        }
      };
      const forwardResult = normalizeForwardResult(schema.forward(value, this._utils), value);
      forwardResult.forEach(appendTransferredOptions);
      const redirectResult = normalizeRedirectResult(schema.redirect(value, this._utils), value);
      redirectResult.redirect.forEach(appendTransferredOptions);
      if ("remain" in redirectResult) {
        const remainingValue = redirectResult.remain;
        newOptions[key2] = key2 in newOptions ? schema.overlap(newOptions[key2], remainingValue, this._utils) : remainingValue;
        warnDeprecated({ value: remainingValue });
      }
      for (const { from, to } of redirectResult.redirect) {
        warnDeprecated({ value: from, redirectTo: to });
      }
    }
    for (const key2 of unknownKeys) {
      const value = options7[key2];
      this._applyUnknownHandler(key2, value, newOptions, (knownResultKey, knownResultValue) => {
        transferredOptionsArray.push({ [knownResultKey]: knownResultValue });
      });
    }
    return transferredOptionsArray;
  }
  _applyRequiredCheck(options7) {
    for (const key2 of Object.keys(this._utils.schemas)) {
      if (this._identifyMissing(key2, options7)) {
        if (this._identifyRequired(key2)) {
          throw this._invalidHandler(key2, VALUE_NOT_EXIST, this._utils);
        }
      }
    }
  }
  _partitionOptionKeys(options7) {
    const [knownKeys, unknownKeys] = partition(Object.keys(options7).filter((key2) => !this._identifyMissing(key2, options7)), (key2) => key2 in this._utils.schemas);
    return { knownKeys, unknownKeys };
  }
  _applyValidation(value, key2, schema) {
    const validateResult = normalizeValidateResult(schema.validate(value, this._utils), value);
    if (validateResult !== true) {
      throw this._invalidHandler(key2, validateResult.value, this._utils);
    }
  }
  _applyUnknownHandler(key2, value, newOptions, knownResultHandler) {
    const unknownResult = this._unknownHandler(key2, value, this._utils);
    if (!unknownResult) {
      return;
    }
    for (const resultKey of Object.keys(unknownResult)) {
      if (this._identifyMissing(resultKey, unknownResult)) {
        continue;
      }
      const resultValue = unknownResult[resultKey];
      if (resultKey in this._utils.schemas) {
        knownResultHandler(resultKey, resultValue);
      } else {
        newOptions[resultKey] = resultValue;
      }
    }
  }
  _applyPostprocess(options7) {
    const postprocessed = this._postprocess(options7, this._utils);
    if (postprocessed === VALUE_UNCHANGED) {
      return;
    }
    if (postprocessed.delete) {
      for (const deleteKey of postprocessed.delete) {
        delete options7[deleteKey];
      }
    }
    if (postprocessed.override) {
      const { knownKeys, unknownKeys } = this._partitionOptionKeys(postprocessed.override);
      for (const key2 of knownKeys) {
        const value = postprocessed.override[key2];
        this._applyValidation(value, key2, this._utils.schemas[key2]);
        options7[key2] = value;
      }
      for (const key2 of unknownKeys) {
        const value = postprocessed.override[key2];
        this._applyUnknownHandler(key2, value, options7, (knownResultKey, knownResultValue) => {
          const schema = this._utils.schemas[knownResultKey];
          this._applyValidation(knownResultValue, knownResultKey, schema);
          options7[knownResultKey] = knownResultValue;
        });
      }
    }
  }
};

// src/common/errors.js
var errors_exports = {};
__export(errors_exports, {
  ArgExpansionBailout: () => ArgExpansionBailout,
  ConfigError: () => ConfigError,
  UndefinedParserError: () => UndefinedParserError
});
var ConfigError = class extends Error {
  name = "ConfigError";
};
var UndefinedParserError = class extends Error {
  name = "UndefinedParserError";
};
var ArgExpansionBailout = class extends Error {
  name = "ArgExpansionBailout";
};

// scripts/build/shims/function-object-has-own.js
var hasOwn = Object.hasOwn ?? Function.prototype.call.bind(Object.prototype.hasOwnProperty);
var function_object_has_own_default = hasOwn;

// src/utilities/create-mockable.js
function createMockable(implementations) {
  const mocked = {
    ...implementations
  };
  const mockImplementation = (functionality, implementation) => {
    if (!function_object_has_own_default(implementations, functionality)) {
      throw new Error(`Unexpected mock '${functionality}'.`);
    }
    mocked[functionality] = implementation;
  };
  const mockImplementations = (overrideImplementations) => {
    for (const [functionality, implementation] of Object.entries(overrideImplementations)) {
      mockImplementation(functionality, implementation);
    }
  };
  const mockRestore = () => {
    Object.assign(mocked, implementations);
  };
  return {
    mocked,
    implementations,
    mockImplementation,
    mockImplementations,
    mockRestore
  };
}
var create_mockable_default = createMockable;

// src/common/mockable.js
var mockable = create_mockable_default({
  getPrettierConfigSearchStopDirectory: () => void 0
});
var mockable_default = mockable.mocked;

// scripts/build/shims/function-object-group-by.js
var groupBy = Object.groupBy ?? ((array2, callback) => {
  const result = /* @__PURE__ */ Object.create(null);
  for (const value of array2) {
    const key2 = callback(value);
    if (result[key2]) {
      result[key2].push(value);
    } else {
      result[key2] = [value];
    }
  }
  return result;
});
var function_object_group_by_default = groupBy;

// src/config/resolve-config.js
var import_micromatch = __toESM(require_micromatch(), 1);
import path12 from "path";

// node_modules/url-or-path/index.js
import * as path from "path";
import * as url from "url";
var URL_STRING_PREFIX = "file:";
var isUrlInstance = (value) => value instanceof URL;
var isUrlString = (value) => typeof value === "string" && value.startsWith(URL_STRING_PREFIX);
var isUrl = (urlOrPath) => isUrlInstance(urlOrPath) || isUrlString(urlOrPath);
var toPath = (urlOrPath) => isUrl(urlOrPath) ? url.fileURLToPath(urlOrPath) : urlOrPath;
var toAbsolutePath = (urlOrPath) => urlOrPath ? path.resolve(toPath(urlOrPath)) : urlOrPath;

// src/config/editorconfig/index.js
import path7 from "path";

// node_modules/editorconfig-without-wasm/lib/index.js
import * as fs from "fs";
import * as path3 from "path";

// node_modules/brace-expansion/node_modules/balanced-match/dist/esm/index.js
var balanced = (a, b, str) => {
  const ma = a instanceof RegExp ? maybeMatch(a, str) : a;
  const mb = b instanceof RegExp ? maybeMatch(b, str) : b;
  const r = ma !== null && mb != null && range(ma, mb, str);
  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + ma.length, r[1]),
    post: str.slice(r[1] + mb.length)
  };
};
var maybeMatch = (reg, str) => {
  const m = str.match(reg);
  return m ? m[0] : null;
};
var range = (a, b, str) => {
  let begs, beg, left, right = void 0, result;
  let ai = str.indexOf(a);
  let bi = str.indexOf(b, ai + 1);
  let i = ai;
  if (ai >= 0 && bi > 0) {
    if (a === b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;
    while (i >= 0 && !result) {
      if (i === ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length === 1) {
        const r = begs.pop();
        if (r !== void 0)
          result = [r, bi];
      } else {
        beg = begs.pop();
        if (beg !== void 0 && beg < left) {
          left = beg;
          right = bi;
        }
        bi = str.indexOf(b, i + 1);
      }
      i = ai < bi && ai >= 0 ? ai : bi;
    }
    if (begs.length && right !== void 0) {
      result = [left, right];
    }
  }
  return result;
};

// node_modules/brace-expansion/dist/esm/index.js
var escSlash = "\0SLASH" + Math.random() + "\0";
var escOpen = "\0OPEN" + Math.random() + "\0";
var escClose = "\0CLOSE" + Math.random() + "\0";
var escComma = "\0COMMA" + Math.random() + "\0";
var escPeriod = "\0PERIOD" + Math.random() + "\0";
var escSlashPattern = new RegExp(escSlash, "g");
var escOpenPattern = new RegExp(escOpen, "g");
var escClosePattern = new RegExp(escClose, "g");
var escCommaPattern = new RegExp(escComma, "g");
var escPeriodPattern = new RegExp(escPeriod, "g");
var slashPattern = /\\\\/g;
var openPattern = /\\{/g;
var closePattern = /\\}/g;
var commaPattern = /\\,/g;
var periodPattern = /\\\./g;
var EXPANSION_MAX = 1e5;
function numeric(str) {
  return !isNaN(str) ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces(str) {
  return str.replace(slashPattern, escSlash).replace(openPattern, escOpen).replace(closePattern, escClose).replace(commaPattern, escComma).replace(periodPattern, escPeriod);
}
function unescapeBraces(str) {
  return str.replace(escSlashPattern, "\\").replace(escOpenPattern, "{").replace(escClosePattern, "}").replace(escCommaPattern, ",").replace(escPeriodPattern, ".");
}
function parseCommaParts(str) {
  if (!str) {
    return [""];
  }
  const parts = [];
  const m = balanced("{", "}", str);
  if (!m) {
    return str.split(",");
  }
  const { pre, body, post } = m;
  const p = pre.split(",");
  p[p.length - 1] += "{" + body + "}";
  const postParts = parseCommaParts(post);
  if (post.length) {
    ;
    p[p.length - 1] += postParts.shift();
    p.push.apply(p, postParts);
  }
  parts.push.apply(parts, p);
  return parts;
}
function expand(str, options7 = {}) {
  if (!str) {
    return [];
  }
  const { max = EXPANSION_MAX } = options7;
  if (str.slice(0, 2) === "{}") {
    str = "\\{\\}" + str.slice(2);
  }
  return expand_(escapeBraces(str), max, true).map(unescapeBraces);
}
function embrace(str) {
  return "{" + str + "}";
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}
function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}
function expand_(str, max, isTop) {
  const expansions = [];
  const m = balanced("{", "}", str);
  if (!m)
    return [str];
  const pre = m.pre;
  const post = m.post.length ? expand_(m.post, max, false) : [""];
  if (/\$$/.test(m.pre)) {
    for (let k = 0; k < post.length && k < max; k++) {
      const expansion = pre + "{" + m.body + "}" + post[k];
      expansions.push(expansion);
    }
  } else {
    const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
    const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
    const isSequence = isNumericSequence || isAlphaSequence;
    const isOptions = m.body.indexOf(",") >= 0;
    if (!isSequence && !isOptions) {
      if (m.post.match(/,(?!,).*\}/)) {
        str = m.pre + "{" + m.body + escClose + m.post;
        return expand_(str, max, true);
      }
      return [str];
    }
    let n;
    if (isSequence) {
      n = m.body.split(/\.\./);
    } else {
      n = parseCommaParts(m.body);
      if (n.length === 1 && n[0] !== void 0) {
        n = expand_(n[0], max, false).map(embrace);
        if (n.length === 1) {
          return post.map((p) => m.pre + n[0] + p);
        }
      }
    }
    let N;
    if (isSequence && n[0] !== void 0 && n[1] !== void 0) {
      const x = numeric(n[0]);
      const y = numeric(n[1]);
      const width = Math.max(n[0].length, n[1].length);
      let incr = n.length === 3 && n[2] !== void 0 ? Math.max(Math.abs(numeric(n[2])), 1) : 1;
      let test = lte;
      const reverse = y < x;
      if (reverse) {
        incr *= -1;
        test = gte;
      }
      const pad = n.some(isPadded);
      N = [];
      for (let i = x; test(i, y) && N.length < max; i += incr) {
        let c2;
        if (isAlphaSequence) {
          c2 = String.fromCharCode(i);
          if (c2 === "\\") {
            c2 = "";
          }
        } else {
          c2 = String(i);
          if (pad) {
            const need = width - c2.length;
            if (need > 0) {
              const z = new Array(need + 1).join("0");
              if (i < 0) {
                c2 = "-" + z + c2.slice(1);
              } else {
                c2 = z + c2;
              }
            }
          }
        }
        N.push(c2);
      }
    } else {
      N = [];
      for (let j = 0; j < n.length; j++) {
        N.push.apply(N, expand_(n[j], max, false));
      }
    }
    for (let j = 0; j < N.length; j++) {
      for (let k = 0; k < post.length && expansions.length < max; k++) {
        const expansion = pre + N[j] + post[k];
        if (!isTop || isSequence || expansion) {
          expansions.push(expansion);
        }
      }
    }
  }
  return expansions;
}

// node_modules/minimatch/dist/esm/assert-valid-pattern.js
var MAX_PATTERN_LENGTH = 1024 * 64;
var assertValidPattern = (pattern) => {
  if (typeof pattern !== "string") {
    throw new TypeError("invalid pattern");
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError("pattern is too long");
  }
};

// node_modules/minimatch/dist/esm/brace-expressions.js
var posixClasses = {
  "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true],
  "[:alpha:]": ["\\p{L}\\p{Nl}", true],
  "[:ascii:]": ["\\x00-\\x7f", false],
  "[:blank:]": ["\\p{Zs}\\t", true],
  "[:cntrl:]": ["\\p{Cc}", true],
  "[:digit:]": ["\\p{Nd}", true],
  "[:graph:]": ["\\p{Z}\\p{C}", true, true],
  "[:lower:]": ["\\p{Ll}", true],
  "[:print:]": ["\\p{C}", true],
  "[:punct:]": ["\\p{P}", true],
  "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true],
  "[:upper:]": ["\\p{Lu}", true],
  "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true],
  "[:xdigit:]": ["A-Fa-f0-9", false]
};
var braceEscape = (s) => s.replace(/[[\]\\-]/g, "\\$&");
var regexpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var rangesToString = (ranges) => ranges.join("");
var parseClass = (glob, position) => {
  const pos2 = position;
  if (glob.charAt(pos2) !== "[") {
    throw new Error("not in a brace expression");
  }
  const ranges = [];
  const negs = [];
  let i = pos2 + 1;
  let sawStart = false;
  let uflag = false;
  let escaping = false;
  let negate = false;
  let endPos = pos2;
  let rangeStart = "";
  WHILE: while (i < glob.length) {
    const c2 = glob.charAt(i);
    if ((c2 === "!" || c2 === "^") && i === pos2 + 1) {
      negate = true;
      i++;
      continue;
    }
    if (c2 === "]" && sawStart && !escaping) {
      endPos = i + 1;
      break;
    }
    sawStart = true;
    if (c2 === "\\") {
      if (!escaping) {
        escaping = true;
        i++;
        continue;
      }
    }
    if (c2 === "[" && !escaping) {
      for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) {
        if (glob.startsWith(cls, i)) {
          if (rangeStart) {
            return ["$.", false, glob.length - pos2, true];
          }
          i += cls.length;
          if (neg)
            negs.push(unip);
          else
            ranges.push(unip);
          uflag = uflag || u;
          continue WHILE;
        }
      }
    }
    escaping = false;
    if (rangeStart) {
      if (c2 > rangeStart) {
        ranges.push(braceEscape(rangeStart) + "-" + braceEscape(c2));
      } else if (c2 === rangeStart) {
        ranges.push(braceEscape(c2));
      }
      rangeStart = "";
      i++;
      continue;
    }
    if (glob.startsWith("-]", i + 1)) {
      ranges.push(braceEscape(c2 + "-"));
      i += 2;
      continue;
    }
    if (glob.startsWith("-", i + 1)) {
      rangeStart = c2;
      i += 2;
      continue;
    }
    ranges.push(braceEscape(c2));
    i++;
  }
  if (endPos < i) {
    return ["", false, 0, false];
  }
  if (!ranges.length && !negs.length) {
    return ["$.", false, glob.length - pos2, true];
  }
  if (negs.length === 0 && ranges.length === 1 && /^\\?.$/.test(ranges[0]) && !negate) {
    const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
    return [regexpEscape(r), false, endPos - pos2, false];
  }
  const sranges = "[" + (negate ? "^" : "") + rangesToString(ranges) + "]";
  const snegs = "[" + (negate ? "" : "^") + rangesToString(negs) + "]";
  const comb = ranges.length && negs.length ? "(" + sranges + "|" + snegs + ")" : ranges.length ? sranges : snegs;
  return [comb, uflag, endPos - pos2, true];
};

// node_modules/minimatch/dist/esm/unescape.js
var unescape = (s, { windowsPathsNoEscape = false, magicalBraces = true } = {}) => {
  if (magicalBraces) {
    return windowsPathsNoEscape ? s.replace(/\[([^/\\])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\])\]/g, "$1$2").replace(/\\([^/])/g, "$1");
  }
  return windowsPathsNoEscape ? s.replace(/\[([^/\\{}])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\{}])\]/g, "$1$2").replace(/\\([^/{}])/g, "$1");
};

// node_modules/minimatch/dist/esm/ast.js
var _a;
var types = /* @__PURE__ */ new Set(["!", "?", "+", "*", "@"]);
var isExtglobType = (c2) => types.has(c2);
var isExtglobAST = (c2) => isExtglobType(c2.type);
var adoptionMap = /* @__PURE__ */ new Map([
  ["!", ["@"]],
  ["?", ["?", "@"]],
  ["@", ["@"]],
  ["*", ["*", "+", "?", "@"]],
  ["+", ["+", "@"]]
]);
var adoptionWithSpaceMap = /* @__PURE__ */ new Map([
  ["!", ["?"]],
  ["@", ["?"]],
  ["+", ["?", "*"]]
]);
var adoptionAnyMap = /* @__PURE__ */ new Map([
  ["!", ["?", "@"]],
  ["?", ["?", "@"]],
  ["@", ["?", "@"]],
  ["*", ["*", "+", "?", "@"]],
  ["+", ["+", "@", "?", "*"]]
]);
var usurpMap = /* @__PURE__ */ new Map([
  ["!", /* @__PURE__ */ new Map([["!", "@"]])],
  [
    "?",
    /* @__PURE__ */ new Map([
      ["*", "*"],
      ["+", "*"]
    ])
  ],
  [
    "@",
    /* @__PURE__ */ new Map([
      ["!", "!"],
      ["?", "?"],
      ["@", "@"],
      ["*", "*"],
      ["+", "+"]
    ])
  ],
  [
    "+",
    /* @__PURE__ */ new Map([
      ["?", "*"],
      ["*", "*"]
    ])
  ]
]);
var startNoTraversal = "(?!(?:^|/)\\.\\.?(?:$|/))";
var startNoDot = "(?!\\.)";
var addPatternStart = /* @__PURE__ */ new Set(["[", "."]);
var justDots = /* @__PURE__ */ new Set(["..", "."]);
var reSpecials = new Set("().*{}+?[]^$\\!");
var regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var qmark = "[^/]";
var star = qmark + "*?";
var starNoEmpty = qmark + "+?";
var ID = 0;
var _root, _hasMagic, _uflag, _parts, _parent, _parentIndex, _negs, _filledNegs, _options, _toString, _emptyExt, _AST_instances, fillNegs_fn, _AST_static, parseAST_fn, canAdoptWithSpace_fn, canAdopt_fn, canAdoptType_fn, adoptWithSpace_fn, adopt_fn, canUsurpType_fn, canUsurp_fn, usurp_fn, flatten_fn, partsToRegExp_fn, parseGlob_fn;
var AST = class {
  constructor(type, parent, options7 = {}) {
    __privateAdd(this, _AST_instances);
    __publicField(this, "type");
    __privateAdd(this, _root);
    __privateAdd(this, _hasMagic);
    __privateAdd(this, _uflag, false);
    __privateAdd(this, _parts, []);
    __privateAdd(this, _parent);
    __privateAdd(this, _parentIndex);
    __privateAdd(this, _negs);
    __privateAdd(this, _filledNegs, false);
    __privateAdd(this, _options);
    __privateAdd(this, _toString);
    // set to true if it's an extglob with no children
    // (which really means one child of '')
    __privateAdd(this, _emptyExt, false);
    __publicField(this, "id", ++ID);
    this.type = type;
    if (type)
      __privateSet(this, _hasMagic, true);
    __privateSet(this, _parent, parent);
    __privateSet(this, _root, __privateGet(this, _parent) ? __privateGet(__privateGet(this, _parent), _root) : this);
    __privateSet(this, _options, __privateGet(this, _root) === this ? options7 : __privateGet(__privateGet(this, _root), _options));
    __privateSet(this, _negs, __privateGet(this, _root) === this ? [] : __privateGet(__privateGet(this, _root), _negs));
    if (type === "!" && !__privateGet(__privateGet(this, _root), _filledNegs))
      __privateGet(this, _negs).push(this);
    __privateSet(this, _parentIndex, __privateGet(this, _parent) ? __privateGet(__privateGet(this, _parent), _parts).length : 0);
  }
  get depth() {
    return (__privateGet(this, _parent)?.depth ?? -1) + 1;
  }
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return {
      "@@type": "AST",
      id: this.id,
      type: this.type,
      root: __privateGet(this, _root).id,
      parent: __privateGet(this, _parent)?.id,
      depth: this.depth,
      partsLength: __privateGet(this, _parts).length,
      parts: __privateGet(this, _parts)
    };
  }
  get hasMagic() {
    if (__privateGet(this, _hasMagic) !== void 0)
      return __privateGet(this, _hasMagic);
    for (const p of __privateGet(this, _parts)) {
      if (typeof p === "string")
        continue;
      if (p.type || p.hasMagic)
        return __privateSet(this, _hasMagic, true);
    }
    return __privateGet(this, _hasMagic);
  }
  // reconstructs the pattern
  toString() {
    return __privateGet(this, _toString) !== void 0 ? __privateGet(this, _toString) : !this.type ? __privateSet(this, _toString, __privateGet(this, _parts).map((p) => String(p)).join("")) : __privateSet(this, _toString, this.type + "(" + __privateGet(this, _parts).map((p) => String(p)).join("|") + ")");
  }
  push(...parts) {
    for (const p of parts) {
      if (p === "")
        continue;
      if (typeof p !== "string" && !(p instanceof _a && __privateGet(p, _parent) === this)) {
        throw new Error("invalid part: " + p);
      }
      __privateGet(this, _parts).push(p);
    }
  }
  toJSON() {
    const ret = this.type === null ? __privateGet(this, _parts).slice().map((p) => typeof p === "string" ? p : p.toJSON()) : [this.type, ...__privateGet(this, _parts).map((p) => p.toJSON())];
    if (this.isStart() && !this.type)
      ret.unshift([]);
    if (this.isEnd() && (this === __privateGet(this, _root) || __privateGet(__privateGet(this, _root), _filledNegs) && __privateGet(this, _parent)?.type === "!")) {
      ret.push({});
    }
    return ret;
  }
  isStart() {
    if (__privateGet(this, _root) === this)
      return true;
    if (!__privateGet(this, _parent)?.isStart())
      return false;
    if (__privateGet(this, _parentIndex) === 0)
      return true;
    const p = __privateGet(this, _parent);
    for (let i = 0; i < __privateGet(this, _parentIndex); i++) {
      const pp = __privateGet(p, _parts)[i];
      if (!(pp instanceof _a && pp.type === "!")) {
        return false;
      }
    }
    return true;
  }
  isEnd() {
    if (__privateGet(this, _root) === this)
      return true;
    if (__privateGet(this, _parent)?.type === "!")
      return true;
    if (!__privateGet(this, _parent)?.isEnd())
      return false;
    if (!this.type)
      return __privateGet(this, _parent)?.isEnd();
    const pl = __privateGet(this, _parent) ? __privateGet(__privateGet(this, _parent), _parts).length : 0;
    return __privateGet(this, _parentIndex) === pl - 1;
  }
  copyIn(part) {
    if (typeof part === "string")
      this.push(part);
    else
      this.push(part.clone(this));
  }
  clone(parent) {
    const c2 = new _a(this.type, parent);
    for (const p of __privateGet(this, _parts)) {
      c2.copyIn(p);
    }
    return c2;
  }
  static fromGlob(pattern, options7 = {}) {
    var _a2;
    const ast = new _a(null, void 0, options7);
    __privateMethod(_a2 = _a, _AST_static, parseAST_fn).call(_a2, pattern, ast, 0, options7, 0);
    return ast;
  }
  // returns the regular expression if there's magic, or the unescaped
  // string if not.
  toMMPattern() {
    if (this !== __privateGet(this, _root))
      return __privateGet(this, _root).toMMPattern();
    const glob = this.toString();
    const [re, body, hasMagic, uflag] = this.toRegExpSource();
    const anyMagic = hasMagic || __privateGet(this, _hasMagic) || __privateGet(this, _options).nocase && !__privateGet(this, _options).nocaseMagicOnly && glob.toUpperCase() !== glob.toLowerCase();
    if (!anyMagic) {
      return body;
    }
    const flags = (__privateGet(this, _options).nocase ? "i" : "") + (uflag ? "u" : "");
    return Object.assign(new RegExp(`^${re}$`, flags), {
      _src: re,
      _glob: glob
    });
  }
  get options() {
    return __privateGet(this, _options);
  }
  // returns the string match, the regexp source, whether there's magic
  // in the regexp (so a regular expression is required) and whether or
  // not the uflag is needed for the regular expression (for posix classes)
  // TODO: instead of injecting the start/end at this point, just return
  // the BODY of the regexp, along with the start/end portions suitable
  // for binding the start/end in either a joined full-path makeRe context
  // (where we bind to (^|/), or a standalone matchPart context (where
  // we bind to ^, and not /).  Otherwise slashes get duped!
  //
  // In part-matching mode, the start is:
  // - if not isStart: nothing
  // - if traversal possible, but not allowed: ^(?!\.\.?$)
  // - if dots allowed or not possible: ^
  // - if dots possible and not allowed: ^(?!\.)
  // end is:
  // - if not isEnd(): nothing
  // - else: $
  //
  // In full-path matching mode, we put the slash at the START of the
  // pattern, so start is:
  // - if first pattern: same as part-matching mode
  // - if not isStart(): nothing
  // - if traversal possible, but not allowed: /(?!\.\.?(?:$|/))
  // - if dots allowed or not possible: /
  // - if dots possible and not allowed: /(?!\.)
  // end is:
  // - if last pattern, same as part-matching mode
  // - else nothing
  //
  // Always put the (?:$|/) on negated tails, though, because that has to be
  // there to bind the end of the negated pattern portion, and it's easier to
  // just stick it in now rather than try to inject it later in the middle of
  // the pattern.
  //
  // We can just always return the same end, and leave it up to the caller
  // to know whether it's going to be used joined or in parts.
  // And, if the start is adjusted slightly, can do the same there:
  // - if not isStart: nothing
  // - if traversal possible, but not allowed: (?:/|^)(?!\.\.?$)
  // - if dots allowed or not possible: (?:/|^)
  // - if dots possible and not allowed: (?:/|^)(?!\.)
  //
  // But it's better to have a simpler binding without a conditional, for
  // performance, so probably better to return both start options.
  //
  // Then the caller just ignores the end if it's not the first pattern,
  // and the start always gets applied.
  //
  // But that's always going to be $ if it's the ending pattern, or nothing,
  // so the caller can just attach $ at the end of the pattern when building.
  //
  // So the todo is:
  // - better detect what kind of start is needed
  // - return both flavors of starting pattern
  // - attach $ at the end of the pattern when creating the actual RegExp
  //
  // Ah, but wait, no, that all only applies to the root when the first pattern
  // is not an extglob. If the first pattern IS an extglob, then we need all
  // that dot prevention biz to live in the extglob portions, because eg
  // +(*|.x*) can match .xy but not .yx.
  //
  // So, return the two flavors if it's #root and the first child is not an
  // AST, otherwise leave it to the child AST to handle it, and there,
  // use the (?:^|/) style of start binding.
  //
  // Even simplified further:
  // - Since the start for a join is eg /(?!\.) and the start for a part
  // is ^(?!\.), we can just prepend (?!\.) to the pattern (either root
  // or start or whatever) and prepend ^ or / at the Regexp construction.
  toRegExpSource(allowDot) {
    const dot = allowDot ?? !!__privateGet(this, _options).dot;
    if (__privateGet(this, _root) === this) {
      __privateMethod(this, _AST_instances, flatten_fn).call(this);
      __privateMethod(this, _AST_instances, fillNegs_fn).call(this);
    }
    if (!isExtglobAST(this)) {
      const noEmpty = this.isStart() && this.isEnd() && !__privateGet(this, _parts).some((s) => typeof s !== "string");
      const src = __privateGet(this, _parts).map((p) => {
        var _a2;
        const [re, _, hasMagic, uflag] = typeof p === "string" ? __privateMethod(_a2 = _a, _AST_static, parseGlob_fn).call(_a2, p, __privateGet(this, _hasMagic), noEmpty) : p.toRegExpSource(allowDot);
        __privateSet(this, _hasMagic, __privateGet(this, _hasMagic) || hasMagic);
        __privateSet(this, _uflag, __privateGet(this, _uflag) || uflag);
        return re;
      }).join("");
      let start2 = "";
      if (this.isStart()) {
        if (typeof __privateGet(this, _parts)[0] === "string") {
          const dotTravAllowed = __privateGet(this, _parts).length === 1 && justDots.has(__privateGet(this, _parts)[0]);
          if (!dotTravAllowed) {
            const aps = addPatternStart;
            const needNoTrav = (
              // dots are allowed, and the pattern starts with [ or .
              dot && aps.has(src.charAt(0)) || // the pattern starts with \., and then [ or .
              src.startsWith("\\.") && aps.has(src.charAt(2)) || // the pattern starts with \.\., and then [ or .
              src.startsWith("\\.\\.") && aps.has(src.charAt(4))
            );
            const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
            start2 = needNoTrav ? startNoTraversal : needNoDot ? startNoDot : "";
          }
        }
      }
      let end = "";
      if (this.isEnd() && __privateGet(__privateGet(this, _root), _filledNegs) && __privateGet(this, _parent)?.type === "!") {
        end = "(?:$|\\/)";
      }
      const final2 = start2 + src + end;
      return [
        final2,
        unescape(src),
        __privateSet(this, _hasMagic, !!__privateGet(this, _hasMagic)),
        __privateGet(this, _uflag)
      ];
    }
    const repeated = this.type === "*" || this.type === "+";
    const start = this.type === "!" ? "(?:(?!(?:" : "(?:";
    let body = __privateMethod(this, _AST_instances, partsToRegExp_fn).call(this, dot);
    if (this.isStart() && this.isEnd() && !body && this.type !== "!") {
      const s = this.toString();
      const me = this;
      __privateSet(me, _parts, [s]);
      me.type = null;
      __privateSet(me, _hasMagic, void 0);
      return [s, unescape(this.toString()), false, false];
    }
    let bodyDotAllowed = !repeated || allowDot || dot || !startNoDot ? "" : __privateMethod(this, _AST_instances, partsToRegExp_fn).call(this, true);
    if (bodyDotAllowed === body) {
      bodyDotAllowed = "";
    }
    if (bodyDotAllowed) {
      body = `(?:${body})(?:${bodyDotAllowed})*?`;
    }
    let final = "";
    if (this.type === "!" && __privateGet(this, _emptyExt)) {
      final = (this.isStart() && !dot ? startNoDot : "") + starNoEmpty;
    } else {
      const close = this.type === "!" ? (
        // !() must match something,but !(x) can match ''
        "))" + (this.isStart() && !dot && !allowDot ? startNoDot : "") + star + ")"
      ) : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && bodyDotAllowed ? ")" : this.type === "*" && bodyDotAllowed ? `)?` : `)${this.type}`;
      final = start + body + close;
    }
    return [
      final,
      unescape(body),
      __privateSet(this, _hasMagic, !!__privateGet(this, _hasMagic)),
      __privateGet(this, _uflag)
    ];
  }
};
_root = new WeakMap();
_hasMagic = new WeakMap();
_uflag = new WeakMap();
_parts = new WeakMap();
_parent = new WeakMap();
_parentIndex = new WeakMap();
_negs = new WeakMap();
_filledNegs = new WeakMap();
_options = new WeakMap();
_toString = new WeakMap();
_emptyExt = new WeakMap();
_AST_instances = new WeakSet();
fillNegs_fn = function() {
  if (this !== __privateGet(this, _root))
    throw new Error("should only call on root");
  if (__privateGet(this, _filledNegs))
    return this;
  this.toString();
  __privateSet(this, _filledNegs, true);
  let n;
  while (n = __privateGet(this, _negs).pop()) {
    if (n.type !== "!")
      continue;
    let p = n;
    let pp = __privateGet(p, _parent);
    while (pp) {
      for (let i = __privateGet(p, _parentIndex) + 1; !pp.type && i < __privateGet(pp, _parts).length; i++) {
        for (const part of __privateGet(n, _parts)) {
          if (typeof part === "string") {
            throw new Error("string part in extglob AST??");
          }
          part.copyIn(__privateGet(pp, _parts)[i]);
        }
      }
      p = pp;
      pp = __privateGet(p, _parent);
    }
  }
  return this;
};
_AST_static = new WeakSet();
parseAST_fn = function(str, ast, pos2, opt, extDepth) {
  var _a2, _b, _c, _d;
  const maxDepth = opt.maxExtglobRecursion ?? 2;
  let escaping = false;
  let inBrace = false;
  let braceStart = -1;
  let braceNeg = false;
  if (ast.type === null) {
    let i2 = pos2;
    let acc2 = "";
    while (i2 < str.length) {
      const c2 = str.charAt(i2++);
      if (escaping || c2 === "\\") {
        escaping = !escaping;
        acc2 += c2;
        continue;
      }
      if (inBrace) {
        if (i2 === braceStart + 1) {
          if (c2 === "^" || c2 === "!") {
            braceNeg = true;
          }
        } else if (c2 === "]" && !(i2 === braceStart + 2 && braceNeg)) {
          inBrace = false;
        }
        acc2 += c2;
        continue;
      } else if (c2 === "[") {
        inBrace = true;
        braceStart = i2;
        braceNeg = false;
        acc2 += c2;
        continue;
      }
      const doRecurse = !opt.noext && isExtglobType(c2) && str.charAt(i2) === "(" && extDepth <= maxDepth;
      if (doRecurse) {
        ast.push(acc2);
        acc2 = "";
        const ext2 = new _a(c2, ast);
        i2 = __privateMethod(_a2 = _a, _AST_static, parseAST_fn).call(_a2, str, ext2, i2, opt, extDepth + 1);
        ast.push(ext2);
        continue;
      }
      acc2 += c2;
    }
    ast.push(acc2);
    return i2;
  }
  let i = pos2 + 1;
  let part = new _a(null, ast);
  const parts = [];
  let acc = "";
  while (i < str.length) {
    const c2 = str.charAt(i++);
    if (escaping || c2 === "\\") {
      escaping = !escaping;
      acc += c2;
      continue;
    }
    if (inBrace) {
      if (i === braceStart + 1) {
        if (c2 === "^" || c2 === "!") {
          braceNeg = true;
        }
      } else if (c2 === "]" && !(i === braceStart + 2 && braceNeg)) {
        inBrace = false;
      }
      acc += c2;
      continue;
    } else if (c2 === "[") {
      inBrace = true;
      braceStart = i;
      braceNeg = false;
      acc += c2;
      continue;
    }
    const doRecurse = !opt.noext && isExtglobType(c2) && str.charAt(i) === "(" && /* c8 ignore start - the maxDepth is sufficient here */
    (extDepth <= maxDepth || ast && __privateMethod(_b = ast, _AST_instances, canAdoptType_fn).call(_b, c2));
    if (doRecurse) {
      const depthAdd = ast && __privateMethod(_c = ast, _AST_instances, canAdoptType_fn).call(_c, c2) ? 0 : 1;
      part.push(acc);
      acc = "";
      const ext2 = new _a(c2, part);
      part.push(ext2);
      i = __privateMethod(_d = _a, _AST_static, parseAST_fn).call(_d, str, ext2, i, opt, extDepth + depthAdd);
      continue;
    }
    if (c2 === "|") {
      part.push(acc);
      acc = "";
      parts.push(part);
      part = new _a(null, ast);
      continue;
    }
    if (c2 === ")") {
      if (acc === "" && __privateGet(ast, _parts).length === 0) {
        __privateSet(ast, _emptyExt, true);
      }
      part.push(acc);
      acc = "";
      ast.push(...parts, part);
      return i;
    }
    acc += c2;
  }
  ast.type = null;
  __privateSet(ast, _hasMagic, void 0);
  __privateSet(ast, _parts, [str.substring(pos2 - 1)]);
  return i;
};
canAdoptWithSpace_fn = function(child) {
  return __privateMethod(this, _AST_instances, canAdopt_fn).call(this, child, adoptionWithSpaceMap);
};
canAdopt_fn = function(child, map = adoptionMap) {
  if (!child || typeof child !== "object" || child.type !== null || __privateGet(child, _parts).length !== 1 || this.type === null) {
    return false;
  }
  const gc = __privateGet(child, _parts)[0];
  if (!gc || typeof gc !== "object" || gc.type === null) {
    return false;
  }
  return __privateMethod(this, _AST_instances, canAdoptType_fn).call(this, gc.type, map);
};
canAdoptType_fn = function(c2, map = adoptionAnyMap) {
  return !!map.get(this.type)?.includes(c2);
};
adoptWithSpace_fn = function(child, index) {
  const gc = __privateGet(child, _parts)[0];
  const blank = new _a(null, gc, this.options);
  __privateGet(blank, _parts).push("");
  gc.push(blank);
  __privateMethod(this, _AST_instances, adopt_fn).call(this, child, index);
};
adopt_fn = function(child, index) {
  const gc = __privateGet(child, _parts)[0];
  __privateGet(this, _parts).splice(index, 1, ...__privateGet(gc, _parts));
  for (const p of __privateGet(gc, _parts)) {
    if (typeof p === "object")
      __privateSet(p, _parent, this);
  }
  __privateSet(this, _toString, void 0);
};
canUsurpType_fn = function(c2) {
  const m = usurpMap.get(this.type);
  return !!m?.has(c2);
};
canUsurp_fn = function(child) {
  if (!child || typeof child !== "object" || child.type !== null || __privateGet(child, _parts).length !== 1 || this.type === null || __privateGet(this, _parts).length !== 1) {
    return false;
  }
  const gc = __privateGet(child, _parts)[0];
  if (!gc || typeof gc !== "object" || gc.type === null) {
    return false;
  }
  return __privateMethod(this, _AST_instances, canUsurpType_fn).call(this, gc.type);
};
usurp_fn = function(child) {
  const m = usurpMap.get(this.type);
  const gc = __privateGet(child, _parts)[0];
  const nt = m?.get(gc.type);
  if (!nt)
    return false;
  __privateSet(this, _parts, __privateGet(gc, _parts));
  for (const p of __privateGet(this, _parts)) {
    if (typeof p === "object") {
      __privateSet(p, _parent, this);
    }
  }
  this.type = nt;
  __privateSet(this, _toString, void 0);
  __privateSet(this, _emptyExt, false);
};
flatten_fn = function() {
  var _a2, _b;
  if (!isExtglobAST(this)) {
    for (const p of __privateGet(this, _parts)) {
      if (typeof p === "object") {
        __privateMethod(_a2 = p, _AST_instances, flatten_fn).call(_a2);
      }
    }
  } else {
    let iterations = 0;
    let done = false;
    do {
      done = true;
      for (let i = 0; i < __privateGet(this, _parts).length; i++) {
        const c2 = __privateGet(this, _parts)[i];
        if (typeof c2 === "object") {
          __privateMethod(_b = c2, _AST_instances, flatten_fn).call(_b);
          if (__privateMethod(this, _AST_instances, canAdopt_fn).call(this, c2)) {
            done = false;
            __privateMethod(this, _AST_instances, adopt_fn).call(this, c2, i);
          } else if (__privateMethod(this, _AST_instances, canAdoptWithSpace_fn).call(this, c2)) {
            done = false;
            __privateMethod(this, _AST_instances, adoptWithSpace_fn).call(this, c2, i);
          } else if (__privateMethod(this, _AST_instances, canUsurp_fn).call(this, c2)) {
            done = false;
            __privateMethod(this, _AST_instances, usurp_fn).call(this, c2);
          }
        }
      }
    } while (!done && ++iterations < 10);
  }
  __privateSet(this, _toString, void 0);
};
partsToRegExp_fn = function(dot) {
  return __privateGet(this, _parts).map((p) => {
    if (typeof p === "string") {
      throw new Error("string type in extglob ast??");
    }
    const [re, _, _hasMagic2, uflag] = p.toRegExpSource(dot);
    __privateSet(this, _uflag, __privateGet(this, _uflag) || uflag);
    return re;
  }).filter((p) => !(this.isStart() && this.isEnd()) || !!p).join("|");
};
parseGlob_fn = function(glob, hasMagic, noEmpty = false) {
  let escaping = false;
  let re = "";
  let uflag = false;
  let inStar = false;
  for (let i = 0; i < glob.length; i++) {
    const c2 = glob.charAt(i);
    if (escaping) {
      escaping = false;
      re += (reSpecials.has(c2) ? "\\" : "") + c2;
      continue;
    }
    if (c2 === "*") {
      if (inStar)
        continue;
      inStar = true;
      re += noEmpty && /^[*]+$/.test(glob) ? starNoEmpty : star;
      hasMagic = true;
      continue;
    } else {
      inStar = false;
    }
    if (c2 === "\\") {
      if (i === glob.length - 1) {
        re += "\\\\";
      } else {
        escaping = true;
      }
      continue;
    }
    if (c2 === "[") {
      const [src, needUflag, consumed, magic] = parseClass(glob, i);
      if (consumed) {
        re += src;
        uflag = uflag || needUflag;
        i += consumed - 1;
        hasMagic = hasMagic || magic;
        continue;
      }
    }
    if (c2 === "?") {
      re += qmark;
      hasMagic = true;
      continue;
    }
    re += regExpEscape(c2);
  }
  return [re, unescape(glob), !!hasMagic, uflag];
};
__privateAdd(AST, _AST_static);
_a = AST;

// node_modules/minimatch/dist/esm/escape.js
var escape = (s, { windowsPathsNoEscape = false, magicalBraces = false } = {}) => {
  if (magicalBraces) {
    return windowsPathsNoEscape ? s.replace(/[?*()[\]{}]/g, "[$&]") : s.replace(/[?*()[\]\\{}]/g, "\\$&");
  }
  return windowsPathsNoEscape ? s.replace(/[?*()[\]]/g, "[$&]") : s.replace(/[?*()[\]\\]/g, "\\$&");
};

// node_modules/minimatch/dist/esm/index.js
var minimatch = (p, pattern, options7 = {}) => {
  assertValidPattern(pattern);
  if (!options7.nocomment && pattern.charAt(0) === "#") {
    return false;
  }
  return new Minimatch(pattern, options7).match(p);
};
var starDotExtRE = /^\*+([^+@!?*[(]*)$/;
var starDotExtTest = (ext2) => (f) => !f.startsWith(".") && f.endsWith(ext2);
var starDotExtTestDot = (ext2) => (f) => f.endsWith(ext2);
var starDotExtTestNocase = (ext2) => {
  ext2 = ext2.toLowerCase();
  return (f) => !f.startsWith(".") && f.toLowerCase().endsWith(ext2);
};
var starDotExtTestNocaseDot = (ext2) => {
  ext2 = ext2.toLowerCase();
  return (f) => f.toLowerCase().endsWith(ext2);
};
var starDotStarRE = /^\*+\.\*+$/;
var starDotStarTest = (f) => !f.startsWith(".") && f.includes(".");
var starDotStarTestDot = (f) => f !== "." && f !== ".." && f.includes(".");
var dotStarRE = /^\.\*+$/;
var dotStarTest = (f) => f !== "." && f !== ".." && f.startsWith(".");
var starRE = /^\*+$/;
var starTest = (f) => f.length !== 0 && !f.startsWith(".");
var starTestDot = (f) => f.length !== 0 && f !== "." && f !== "..";
var qmarksRE = /^\?+([^+@!?*[(]*)?$/;
var qmarksTestNocase = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExt([$0]);
  if (!ext2)
    return noext;
  ext2 = ext2.toLowerCase();
  return (f) => noext(f) && f.toLowerCase().endsWith(ext2);
};
var qmarksTestNocaseDot = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExtDot([$0]);
  if (!ext2)
    return noext;
  ext2 = ext2.toLowerCase();
  return (f) => noext(f) && f.toLowerCase().endsWith(ext2);
};
var qmarksTestDot = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExtDot([$0]);
  return !ext2 ? noext : (f) => noext(f) && f.endsWith(ext2);
};
var qmarksTest = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExt([$0]);
  return !ext2 ? noext : (f) => noext(f) && f.endsWith(ext2);
};
var qmarksTestNoExt = ([$0]) => {
  const len = $0.length;
  return (f) => f.length === len && !f.startsWith(".");
};
var qmarksTestNoExtDot = ([$0]) => {
  const len = $0.length;
  return (f) => f.length === len && f !== "." && f !== "..";
};
var defaultPlatform = typeof process === "object" && process ? typeof process.env === "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
var path2 = {
  win32: { sep: "\\" },
  posix: { sep: "/" }
};
var sep = defaultPlatform === "win32" ? path2.win32.sep : path2.posix.sep;
minimatch.sep = sep;
var GLOBSTAR = /* @__PURE__ */ Symbol("globstar **");
minimatch.GLOBSTAR = GLOBSTAR;
var qmark2 = "[^/]";
var star2 = qmark2 + "*?";
var twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
var twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
var filter = (pattern, options7 = {}) => (p) => minimatch(p, pattern, options7);
minimatch.filter = filter;
var ext = (a, b = {}) => Object.assign({}, a, b);
var defaults = (def) => {
  if (!def || typeof def !== "object" || !Object.keys(def).length) {
    return minimatch;
  }
  const orig = minimatch;
  const m = (p, pattern, options7 = {}) => orig(p, pattern, ext(def, options7));
  return Object.assign(m, {
    Minimatch: class Minimatch extends orig.Minimatch {
      constructor(pattern, options7 = {}) {
        super(pattern, ext(def, options7));
      }
      static defaults(options7) {
        return orig.defaults(ext(def, options7)).Minimatch;
      }
    },
    AST: class AST extends orig.AST {
      /* c8 ignore start */
      constructor(type, parent, options7 = {}) {
        super(type, parent, ext(def, options7));
      }
      /* c8 ignore stop */
      static fromGlob(pattern, options7 = {}) {
        return orig.AST.fromGlob(pattern, ext(def, options7));
      }
    },
    unescape: (s, options7 = {}) => orig.unescape(s, ext(def, options7)),
    escape: (s, options7 = {}) => orig.escape(s, ext(def, options7)),
    filter: (pattern, options7 = {}) => orig.filter(pattern, ext(def, options7)),
    defaults: (options7) => orig.defaults(ext(def, options7)),
    makeRe: (pattern, options7 = {}) => orig.makeRe(pattern, ext(def, options7)),
    braceExpand: (pattern, options7 = {}) => orig.braceExpand(pattern, ext(def, options7)),
    match: (list, pattern, options7 = {}) => orig.match(list, pattern, ext(def, options7)),
    sep: orig.sep,
    GLOBSTAR
  });
};
minimatch.defaults = defaults;
var braceExpand = (pattern, options7 = {}) => {
  assertValidPattern(pattern);
  if (options7.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    return [pattern];
  }
  return expand(pattern, { max: options7.braceExpandMax });
};
minimatch.braceExpand = braceExpand;
var makeRe = (pattern, options7 = {}) => new Minimatch(pattern, options7).makeRe();
minimatch.makeRe = makeRe;
var match = (list, pattern, options7 = {}) => {
  const mm = new Minimatch(pattern, options7);
  list = list.filter((f) => mm.match(f));
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list;
};
minimatch.match = match;
var globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
var regExpEscape2 = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var Minimatch = class {
  options;
  set;
  pattern;
  windowsPathsNoEscape;
  nonegate;
  negate;
  comment;
  empty;
  preserveMultipleSlashes;
  partial;
  globSet;
  globParts;
  nocase;
  isWindows;
  platform;
  windowsNoMagicRoot;
  maxGlobstarRecursion;
  regexp;
  constructor(pattern, options7 = {}) {
    assertValidPattern(pattern);
    options7 = options7 || {};
    this.options = options7;
    this.maxGlobstarRecursion = options7.maxGlobstarRecursion ?? 200;
    this.pattern = pattern;
    this.platform = options7.platform || defaultPlatform;
    this.isWindows = this.platform === "win32";
    const awe = "allowWindowsEscape";
    this.windowsPathsNoEscape = !!options7.windowsPathsNoEscape || options7[awe] === false;
    if (this.windowsPathsNoEscape) {
      this.pattern = this.pattern.replace(/\\/g, "/");
    }
    this.preserveMultipleSlashes = !!options7.preserveMultipleSlashes;
    this.regexp = null;
    this.negate = false;
    this.nonegate = !!options7.nonegate;
    this.comment = false;
    this.empty = false;
    this.partial = !!options7.partial;
    this.nocase = !!this.options.nocase;
    this.windowsNoMagicRoot = options7.windowsNoMagicRoot !== void 0 ? options7.windowsNoMagicRoot : !!(this.isWindows && this.nocase);
    this.globSet = [];
    this.globParts = [];
    this.set = [];
    this.make();
  }
  hasMagic() {
    if (this.options.magicalBraces && this.set.length > 1) {
      return true;
    }
    for (const pattern of this.set) {
      for (const part of pattern) {
        if (typeof part !== "string")
          return true;
      }
    }
    return false;
  }
  debug(..._) {
  }
  make() {
    const pattern = this.pattern;
    const options7 = this.options;
    if (!options7.nocomment && pattern.charAt(0) === "#") {
      this.comment = true;
      return;
    }
    if (!pattern) {
      this.empty = true;
      return;
    }
    this.parseNegate();
    this.globSet = [...new Set(this.braceExpand())];
    if (options7.debug) {
      this.debug = (...args) => console.error(...args);
    }
    this.debug(this.pattern, this.globSet);
    const rawGlobParts = this.globSet.map((s) => this.slashSplit(s));
    this.globParts = this.preprocess(rawGlobParts);
    this.debug(this.pattern, this.globParts);
    let set = this.globParts.map((s, _, __) => {
      if (this.isWindows && this.windowsNoMagicRoot) {
        const isUNC = s[0] === "" && s[1] === "" && (s[2] === "?" || !globMagic.test(s[2])) && !globMagic.test(s[3]);
        const isDrive = /^[a-z]:/i.test(s[0]);
        if (isUNC) {
          return [
            ...s.slice(0, 4),
            ...s.slice(4).map((ss) => this.parse(ss))
          ];
        } else if (isDrive) {
          return [s[0], ...s.slice(1).map((ss) => this.parse(ss))];
        }
      }
      return s.map((ss) => this.parse(ss));
    });
    this.debug(this.pattern, set);
    this.set = set.filter((s) => s.indexOf(false) === -1);
    if (this.isWindows) {
      for (let i = 0; i < this.set.length; i++) {
        const p = this.set[i];
        if (p[0] === "" && p[1] === "" && this.globParts[i][2] === "?" && typeof p[3] === "string" && /^[a-z]:$/i.test(p[3])) {
          p[2] = "?";
        }
      }
    }
    this.debug(this.pattern, this.set);
  }
  // various transforms to equivalent pattern sets that are
  // faster to process in a filesystem walk.  The goal is to
  // eliminate what we can, and push all ** patterns as far
  // to the right as possible, even if it increases the number
  // of patterns that we have to process.
  preprocess(globParts) {
    if (this.options.noglobstar) {
      for (const partset of globParts) {
        for (let j = 0; j < partset.length; j++) {
          if (partset[j] === "**") {
            partset[j] = "*";
          }
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      globParts = this.firstPhasePreProcess(globParts);
      globParts = this.secondPhasePreProcess(globParts);
    } else if (optimizationLevel >= 1) {
      globParts = this.levelOneOptimize(globParts);
    } else {
      globParts = this.adjascentGlobstarOptimize(globParts);
    }
    return globParts;
  }
  // just get rid of adjascent ** portions
  adjascentGlobstarOptimize(globParts) {
    return globParts.map((parts) => {
      let gs = -1;
      while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
        let i = gs;
        while (parts[i + 1] === "**") {
          i++;
        }
        if (i !== gs) {
          parts.splice(gs, i - gs);
        }
      }
      return parts;
    });
  }
  // get rid of adjascent ** and resolve .. portions
  levelOneOptimize(globParts) {
    return globParts.map((parts) => {
      parts = parts.reduce((set, part) => {
        const prev = set[set.length - 1];
        if (part === "**" && prev === "**") {
          return set;
        }
        if (part === "..") {
          if (prev && prev !== ".." && prev !== "." && prev !== "**") {
            set.pop();
            return set;
          }
        }
        set.push(part);
        return set;
      }, []);
      return parts.length === 0 ? [""] : parts;
    });
  }
  levelTwoFileOptimize(parts) {
    if (!Array.isArray(parts)) {
      parts = this.slashSplit(parts);
    }
    let didSomething = false;
    do {
      didSomething = false;
      if (!this.preserveMultipleSlashes) {
        for (let i = 1; i < parts.length - 1; i++) {
          const p = parts[i];
          if (i === 1 && p === "" && parts[0] === "")
            continue;
          if (p === "." || p === "") {
            didSomething = true;
            parts.splice(i, 1);
            i--;
          }
        }
        if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
          didSomething = true;
          parts.pop();
        }
      }
      let dd = 0;
      while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
        const p = parts[dd - 1];
        if (p && p !== "." && p !== ".." && p !== "**" && !(this.isWindows && /^[a-z]:$/i.test(p))) {
          didSomething = true;
          parts.splice(dd - 1, 2);
          dd -= 2;
        }
      }
    } while (didSomething);
    return parts.length === 0 ? [""] : parts;
  }
  // First phase: single-pattern processing
  // <pre> is 1 or more portions
  // <rest> is 1 or more portions
  // <p> is any portion other than ., .., '', or **
  // <e> is . or ''
  //
  // **/.. is *brutal* for filesystem walking performance, because
  // it effectively resets the recursive walk each time it occurs,
  // and ** cannot be reduced out by a .. pattern part like a regexp
  // or most strings (other than .., ., and '') can be.
  //
  // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
  // <pre>/<e>/<rest> -> <pre>/<rest>
  // <pre>/<p>/../<rest> -> <pre>/<rest>
  // **/**/<rest> -> **/<rest>
  //
  // **/*/<rest> -> */**/<rest> <== not valid because ** doesn't follow
  // this WOULD be allowed if ** did follow symlinks, or * didn't
  firstPhasePreProcess(globParts) {
    let didSomething = false;
    do {
      didSomething = false;
      for (let parts of globParts) {
        let gs = -1;
        while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
          let gss = gs;
          while (parts[gss + 1] === "**") {
            gss++;
          }
          if (gss > gs) {
            parts.splice(gs + 1, gss - gs);
          }
          let next = parts[gs + 1];
          const p = parts[gs + 2];
          const p2 = parts[gs + 3];
          if (next !== "..")
            continue;
          if (!p || p === "." || p === ".." || !p2 || p2 === "." || p2 === "..") {
            continue;
          }
          didSomething = true;
          parts.splice(gs, 1);
          const other = parts.slice(0);
          other[gs] = "**";
          globParts.push(other);
          gs--;
        }
        if (!this.preserveMultipleSlashes) {
          for (let i = 1; i < parts.length - 1; i++) {
            const p = parts[i];
            if (i === 1 && p === "" && parts[0] === "")
              continue;
            if (p === "." || p === "") {
              didSomething = true;
              parts.splice(i, 1);
              i--;
            }
          }
          if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
            didSomething = true;
            parts.pop();
          }
        }
        let dd = 0;
        while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
          const p = parts[dd - 1];
          if (p && p !== "." && p !== ".." && p !== "**") {
            didSomething = true;
            const needDot = dd === 1 && parts[dd + 1] === "**";
            const splin = needDot ? ["."] : [];
            parts.splice(dd - 1, 2, ...splin);
            if (parts.length === 0)
              parts.push("");
            dd -= 2;
          }
        }
      }
    } while (didSomething);
    return globParts;
  }
  // second phase: multi-pattern dedupes
  // {<pre>/*/<rest>,<pre>/<p>/<rest>} -> <pre>/*/<rest>
  // {<pre>/<rest>,<pre>/<rest>} -> <pre>/<rest>
  // {<pre>/**/<rest>,<pre>/<rest>} -> <pre>/**/<rest>
  //
  // {<pre>/**/<rest>,<pre>/**/<p>/<rest>} -> <pre>/**/<rest>
  // ^-- not valid because ** doens't follow symlinks
  secondPhasePreProcess(globParts) {
    for (let i = 0; i < globParts.length - 1; i++) {
      for (let j = i + 1; j < globParts.length; j++) {
        const matched = this.partsMatch(globParts[i], globParts[j], !this.preserveMultipleSlashes);
        if (matched) {
          globParts[i] = [];
          globParts[j] = matched;
          break;
        }
      }
    }
    return globParts.filter((gs) => gs.length);
  }
  partsMatch(a, b, emptyGSMatch = false) {
    let ai = 0;
    let bi = 0;
    let result = [];
    let which = "";
    while (ai < a.length && bi < b.length) {
      if (a[ai] === b[bi]) {
        result.push(which === "b" ? b[bi] : a[ai]);
        ai++;
        bi++;
      } else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
        result.push(a[ai]);
        ai++;
      } else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
        result.push(b[bi]);
        bi++;
      } else if (a[ai] === "*" && b[bi] && (this.options.dot || !b[bi].startsWith(".")) && b[bi] !== "**") {
        if (which === "b")
          return false;
        which = "a";
        result.push(a[ai]);
        ai++;
        bi++;
      } else if (b[bi] === "*" && a[ai] && (this.options.dot || !a[ai].startsWith(".")) && a[ai] !== "**") {
        if (which === "a")
          return false;
        which = "b";
        result.push(b[bi]);
        ai++;
        bi++;
      } else {
        return false;
      }
    }
    return a.length === b.length && result;
  }
  parseNegate() {
    if (this.nonegate)
      return;
    const pattern = this.pattern;
    let negate = false;
    let negateOffset = 0;
    for (let i = 0; i < pattern.length && pattern.charAt(i) === "!"; i++) {
      negate = !negate;
      negateOffset++;
    }
    if (negateOffset)
      this.pattern = pattern.slice(negateOffset);
    this.negate = negate;
  }
  // set partial to true to test if, for example,
  // "/a/b" matches the start of "/*/b/*/d"
  // Partial means, if you run out of file before you run
  // out of pattern, then that's fine, as long as all
  // the parts match.
  matchOne(file, pattern, partial = false) {
    let fileStartIndex = 0;
    let patternStartIndex = 0;
    if (this.isWindows) {
      const fileDrive = typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
      const fileUNC = !fileDrive && file[0] === "" && file[1] === "" && file[2] === "?" && /^[a-z]:$/i.test(file[3]);
      const patternDrive = typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
      const patternUNC = !patternDrive && pattern[0] === "" && pattern[1] === "" && pattern[2] === "?" && typeof pattern[3] === "string" && /^[a-z]:$/i.test(pattern[3]);
      const fdi = fileUNC ? 3 : fileDrive ? 0 : void 0;
      const pdi = patternUNC ? 3 : patternDrive ? 0 : void 0;
      if (typeof fdi === "number" && typeof pdi === "number") {
        const [fd, pd] = [
          file[fdi],
          pattern[pdi]
        ];
        if (fd.toLowerCase() === pd.toLowerCase()) {
          pattern[pdi] = fd;
          patternStartIndex = pdi;
          fileStartIndex = fdi;
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      file = this.levelTwoFileOptimize(file);
    }
    if (pattern.includes(GLOBSTAR)) {
      return this.#matchGlobstar(file, pattern, partial, fileStartIndex, patternStartIndex);
    }
    return this.#matchOne(file, pattern, partial, fileStartIndex, patternStartIndex);
  }
  #matchGlobstar(file, pattern, partial, fileIndex, patternIndex) {
    const firstgs = pattern.indexOf(GLOBSTAR, patternIndex);
    const lastgs = pattern.lastIndexOf(GLOBSTAR);
    const [head, body, tail] = partial ? [
      pattern.slice(patternIndex, firstgs),
      pattern.slice(firstgs + 1),
      []
    ] : [
      pattern.slice(patternIndex, firstgs),
      pattern.slice(firstgs + 1, lastgs),
      pattern.slice(lastgs + 1)
    ];
    if (head.length) {
      const fileHead = file.slice(fileIndex, fileIndex + head.length);
      if (!this.#matchOne(fileHead, head, partial, 0, 0)) {
        return false;
      }
      fileIndex += head.length;
      patternIndex += head.length;
    }
    let fileTailMatch = 0;
    if (tail.length) {
      if (tail.length + fileIndex > file.length)
        return false;
      let tailStart = file.length - tail.length;
      if (this.#matchOne(file, tail, partial, tailStart, 0)) {
        fileTailMatch = tail.length;
      } else {
        if (file[file.length - 1] !== "" || fileIndex + tail.length === file.length) {
          return false;
        }
        tailStart--;
        if (!this.#matchOne(file, tail, partial, tailStart, 0)) {
          return false;
        }
        fileTailMatch = tail.length + 1;
      }
    }
    if (!body.length) {
      let sawSome = !!fileTailMatch;
      for (let i2 = fileIndex; i2 < file.length - fileTailMatch; i2++) {
        const f = String(file[i2]);
        sawSome = true;
        if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
          return false;
        }
      }
      return partial || sawSome;
    }
    const bodySegments = [[[], 0]];
    let currentBody = bodySegments[0];
    let nonGsParts = 0;
    const nonGsPartsSums = [0];
    for (const b of body) {
      if (b === GLOBSTAR) {
        nonGsPartsSums.push(nonGsParts);
        currentBody = [[], 0];
        bodySegments.push(currentBody);
      } else {
        currentBody[0].push(b);
        nonGsParts++;
      }
    }
    let i = bodySegments.length - 1;
    const fileLength = file.length - fileTailMatch;
    for (const b of bodySegments) {
      b[1] = fileLength - (nonGsPartsSums[i--] + b[0].length);
    }
    return !!this.#matchGlobStarBodySections(file, bodySegments, fileIndex, 0, partial, 0, !!fileTailMatch);
  }
  // return false for "nope, not matching"
  // return null for "not matching, cannot keep trying"
  #matchGlobStarBodySections(file, bodySegments, fileIndex, bodyIndex, partial, globStarDepth, sawTail) {
    const bs = bodySegments[bodyIndex];
    if (!bs) {
      for (let i = fileIndex; i < file.length; i++) {
        sawTail = true;
        const f = file[i];
        if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
          return false;
        }
      }
      return sawTail;
    }
    const [body, after] = bs;
    while (fileIndex <= after) {
      const m = this.#matchOne(file.slice(0, fileIndex + body.length), body, partial, fileIndex, 0);
      if (m && globStarDepth < this.maxGlobstarRecursion) {
        const sub = this.#matchGlobStarBodySections(file, bodySegments, fileIndex + body.length, bodyIndex + 1, partial, globStarDepth + 1, sawTail);
        if (sub !== false) {
          return sub;
        }
      }
      const f = file[fileIndex];
      if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
        return false;
      }
      fileIndex++;
    }
    return partial || null;
  }
  #matchOne(file, pattern, partial, fileIndex, patternIndex) {
    let fi;
    let pi;
    let pl;
    let fl;
    for (fi = fileIndex, pi = patternIndex, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
      this.debug("matchOne loop");
      let p = pattern[pi];
      let f = file[fi];
      this.debug(pattern, p, f);
      if (p === false || p === GLOBSTAR) {
        return false;
      }
      let hit;
      if (typeof p === "string") {
        hit = f === p;
        this.debug("string match", p, f, hit);
      } else {
        hit = p.test(f);
        this.debug("pattern match", p, f, hit);
      }
      if (!hit)
        return false;
    }
    if (fi === fl && pi === pl) {
      return true;
    } else if (fi === fl) {
      return partial;
    } else if (pi === pl) {
      return fi === fl - 1 && file[fi] === "";
    } else {
      throw new Error("wtf?");
    }
  }
  braceExpand() {
    return braceExpand(this.pattern, this.options);
  }
  parse(pattern) {
    assertValidPattern(pattern);
    const options7 = this.options;
    if (pattern === "**")
      return GLOBSTAR;
    if (pattern === "")
      return "";
    let m;
    let fastTest = null;
    if (m = pattern.match(starRE)) {
      fastTest = options7.dot ? starTestDot : starTest;
    } else if (m = pattern.match(starDotExtRE)) {
      fastTest = (options7.nocase ? options7.dot ? starDotExtTestNocaseDot : starDotExtTestNocase : options7.dot ? starDotExtTestDot : starDotExtTest)(m[1]);
    } else if (m = pattern.match(qmarksRE)) {
      fastTest = (options7.nocase ? options7.dot ? qmarksTestNocaseDot : qmarksTestNocase : options7.dot ? qmarksTestDot : qmarksTest)(m);
    } else if (m = pattern.match(starDotStarRE)) {
      fastTest = options7.dot ? starDotStarTestDot : starDotStarTest;
    } else if (m = pattern.match(dotStarRE)) {
      fastTest = dotStarTest;
    }
    const re = AST.fromGlob(pattern, this.options).toMMPattern();
    if (fastTest && typeof re === "object") {
      Reflect.defineProperty(re, "test", { value: fastTest });
    }
    return re;
  }
  makeRe() {
    if (this.regexp || this.regexp === false)
      return this.regexp;
    const set = this.set;
    if (!set.length) {
      this.regexp = false;
      return this.regexp;
    }
    const options7 = this.options;
    const twoStar = options7.noglobstar ? star2 : options7.dot ? twoStarDot : twoStarNoDot;
    const flags = new Set(options7.nocase ? ["i"] : []);
    let re = set.map((pattern) => {
      const pp = pattern.map((p) => {
        if (p instanceof RegExp) {
          for (const f of p.flags.split(""))
            flags.add(f);
        }
        return typeof p === "string" ? regExpEscape2(p) : p === GLOBSTAR ? GLOBSTAR : p._src;
      });
      pp.forEach((p, i) => {
        const next = pp[i + 1];
        const prev = pp[i - 1];
        if (p !== GLOBSTAR || prev === GLOBSTAR) {
          return;
        }
        if (prev === void 0) {
          if (next !== void 0 && next !== GLOBSTAR) {
            pp[i + 1] = "(?:\\/|" + twoStar + "\\/)?" + next;
          } else {
            pp[i] = twoStar;
          }
        } else if (next === void 0) {
          pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + ")?";
        } else if (next !== GLOBSTAR) {
          pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + "\\/)" + next;
          pp[i + 1] = GLOBSTAR;
        }
      });
      const filtered = pp.filter((p) => p !== GLOBSTAR);
      if (this.partial && filtered.length >= 1) {
        const prefixes = [];
        for (let i = 1; i <= filtered.length; i++) {
          prefixes.push(filtered.slice(0, i).join("/"));
        }
        return "(?:" + prefixes.join("|") + ")";
      }
      return filtered.join("/");
    }).join("|");
    const [open, close] = set.length > 1 ? ["(?:", ")"] : ["", ""];
    re = "^" + open + re + close + "$";
    if (this.partial) {
      re = "^(?:\\/|" + open + re.slice(1, -1) + close + ")$";
    }
    if (this.negate)
      re = "^(?!" + re + ").+$";
    try {
      this.regexp = new RegExp(re, [...flags].join(""));
    } catch {
      this.regexp = false;
    }
    return this.regexp;
  }
  slashSplit(p) {
    if (this.preserveMultipleSlashes) {
      return p.split("/");
    } else if (this.isWindows && /^\/\/[^/]+/.test(p)) {
      return ["", ...p.split(/\/+/)];
    } else {
      return p.split(/\/+/);
    }
  }
  match(f, partial = this.partial) {
    this.debug("match", f, this.pattern);
    if (this.comment) {
      return false;
    }
    if (this.empty) {
      return f === "";
    }
    if (f === "/" && partial) {
      return true;
    }
    const options7 = this.options;
    if (this.isWindows) {
      f = f.split("\\").join("/");
    }
    const ff = this.slashSplit(f);
    this.debug(this.pattern, "split", ff);
    const set = this.set;
    this.debug(this.pattern, "set", set);
    let filename = ff[ff.length - 1];
    if (!filename) {
      for (let i = ff.length - 2; !filename && i >= 0; i--) {
        filename = ff[i];
      }
    }
    for (const pattern of set) {
      let file = ff;
      if (options7.matchBase && pattern.length === 1) {
        file = [filename];
      }
      const hit = this.matchOne(file, pattern, partial);
      if (hit) {
        if (options7.flipNegate) {
          return true;
        }
        return !this.negate;
      }
    }
    if (options7.flipNegate) {
      return false;
    }
    return this.negate;
  }
  static defaults(def) {
    return minimatch.defaults(def).Minimatch;
  }
};
minimatch.AST = AST;
minimatch.Minimatch = Minimatch;
minimatch.escape = escape;
minimatch.unescape = unescape;

// node_modules/editorconfig-without-wasm/lib/ini-simple-parser/index.js
var parse = (input) => {
  const COMMENT1 = 35;
  const COMMENT2 = 59;
  const SECTION_START = 91;
  const SECTION_END = 93;
  const results = /* @__PURE__ */ Object.create(null);
  const lines = input.split(/\r?\n|\r/g);
  let section = results;
  for (let i = 0, l = lines.length; i < l; i++) {
    const line3 = lines[i].trim();
    if (!line3.length)
      continue;
    const firstChar = line3.charCodeAt(0);
    if (firstChar === COMMENT1 || firstChar === COMMENT2)
      continue;
    const lastChar = line3.charCodeAt(line3.length - 1);
    if (firstChar === SECTION_START) {
      if (lastChar === SECTION_END) {
        const key2 = line3.slice(1, -1);
        section = Object.prototype.hasOwnProperty.call(results, key2) && typeof results[key2] !== "string" ? results[key2] : results[key2] = /* @__PURE__ */ Object.create(null);
        continue;
      } else {
        throw new Error(`Unexpected unclosed section at line ${i + 1}`);
      }
    }
    const delimiterIndex = line3.indexOf("=");
    if (delimiterIndex >= 0) {
      let key2 = line3.slice(0, delimiterIndex).trim();
      let value = line3.slice(delimiterIndex + 1).trim();
      section[`${key2}`] = value;
      continue;
    }
    throw new Error(`Unexpected characters at line ${i + 1}`);
  }
  return results;
};
var ini_simple_parser_default = parse;

// node_modules/editorconfig-without-wasm/lib/parse.js
function parseString(data) {
  const root2 = {};
  const result = [[null, root2]];
  let parsed = void 0;
  try {
    parsed = ini_simple_parser_default(data);
  } catch (_a2) {
    return result;
  }
  for (const [key2, value] of Object.entries(parsed)) {
    if (value && typeof value === "object") {
      result.push([key2, value]);
    } else {
      root2[key2] = value;
    }
  }
  return result;
}
function parseBuffer(data) {
  return parseString(data.toString());
}

// node_modules/editorconfig-without-wasm/lib/index.js
var EDITORCONFIG_VERSION = "3.0.2";
var escapedSep = new RegExp(path3.sep.replace(/\\/g, "\\\\"), "g");
var matchOptions = { matchBase: true, dot: true };
var knownPropNames = [
  "charset",
  "end_of_line",
  "indent_size",
  "indent_style",
  "insert_final_newline",
  // 'tab_width' // This should be an integer, not a string.
  "trim_trailing_whitespace"
];
var knownProps = new Set(knownPropNames);
function getConfigFileNames(filepath, options7) {
  const paths = [];
  do {
    filepath = path3.dirname(filepath);
    paths.push(path3.join(filepath, options7.config));
  } while (filepath !== options7.root);
  return paths;
}
function processMatches(matches, version) {
  if ("indent_style" in matches && matches.indent_style === "tab" && !("indent_size" in matches) && (version === EDITORCONFIG_VERSION || true)) {
    matches.indent_size = "tab";
  }
  if ("indent_size" in matches && !("tab_width" in matches) && matches.indent_size !== "tab") {
    matches.tab_width = matches.indent_size;
  }
  if ("indent_size" in matches && "tab_width" in matches && matches.indent_size === "tab") {
    matches.indent_size = matches.tab_width;
  }
  return matches;
}
function buildFullGlob(pathPrefix, glob) {
  switch (glob.indexOf("/")) {
    case -1:
      glob = `**/${glob}`;
      break;
    case 0:
      glob = glob.substring(1);
      break;
    default:
      break;
  }
  glob = glob.replace(/\\\\/g, "\\\\\\\\");
  glob = glob.replace(/\*\*/g, "{*,**/**/**}");
  return new Minimatch(`${pathPrefix}/${glob}`, matchOptions);
}
function normalizeProps(options7) {
  const props = {};
  for (const key2 in options7) {
    if (Object.prototype.hasOwnProperty.call(options7, key2)) {
      const value = options7[key2];
      const key22 = key2.toLowerCase();
      let value2 = value;
      if (knownProps.has(key22)) {
        value2 = String(value).toLowerCase();
      }
      try {
        value2 = JSON.parse(String(value));
      } catch (_e) {
      }
      if (typeof value2 === "undefined" || value2 === null) {
        value2 = String(value);
      }
      props[key22] = value2;
    }
  }
  return props;
}
function processFileContents(filepath, contents, options7) {
  let res = void 0;
  if (!contents) {
    res = {
      root: false,
      notfound: true,
      name: filepath,
      config: [[null, {}, null]]
    };
  } else {
    let pathPrefix = path3.dirname(filepath);
    if (path3.sep !== "/") {
      pathPrefix = pathPrefix.replace(escapedSep, "/");
    }
    pathPrefix = escape(pathPrefix, { windowsPathsNoEscape: true });
    pathPrefix = pathPrefix.replace(/^#/, "[#]");
    const globbed = parseBuffer(contents).map(([name, body]) => [
      name,
      normalizeProps(body),
      name ? buildFullGlob(pathPrefix, name) : null
    ]);
    res = {
      root: Boolean(globbed[0][1].root),
      // Global section: globbed[0]
      name: filepath,
      config: globbed
    };
  }
  if (options7.cache) {
    options7.cache.set(filepath, res);
  }
  return res;
}
async function getConfig(filepath, options7) {
  if (options7.cache) {
    const cached = options7.cache.get(filepath);
    if (cached) {
      return cached;
    }
  }
  const contents = await new Promise((resolve4) => {
    fs.readFile(filepath, (_, buf) => {
      resolve4(buf);
    });
  });
  return processFileContents(filepath, contents, options7);
}
async function getAllConfigs(files, options7) {
  const configs = [];
  for (const file of files) {
    const config = await getConfig(file, options7);
    if (!config.notfound) {
      configs.push(config);
      if (config.root) {
        break;
      }
    }
  }
  return configs;
}
function opts(filepath, options7 = {}) {
  const resolvedFilePath = path3.resolve(filepath);
  return [
    resolvedFilePath,
    {
      config: options7.config || ".editorconfig",
      version: options7.version || EDITORCONFIG_VERSION,
      root: path3.resolve(options7.root || path3.parse(resolvedFilePath).root),
      files: options7.files,
      cache: options7.cache,
      unset: options7.unset
    }
  ];
}
function unset(props) {
  const keys = Object.keys(props);
  for (const k of keys) {
    if (props[k] === "unset") {
      delete props[k];
    }
  }
}
function combine(filepath, configs, options7) {
  const ret = configs.reverse().reduce((props, processed) => {
    for (const [name, body, glob] of processed.config) {
      if (glob === null || glob === void 0 ? void 0 : glob.match(filepath)) {
        Object.assign(props, body);
        if (options7.files) {
          options7.files.push({
            fileName: processed.name,
            glob: name
          });
        }
      }
    }
    return props;
  }, {});
  if (options7.unset) {
    unset(ret);
  }
  return processMatches(ret, options7.version);
}
async function parse3(filepath, options7 = {}) {
  const [resolvedFilePath, processedOptions] = opts(filepath, options7);
  const filepaths = getConfigFileNames(resolvedFilePath, processedOptions);
  const configs = await getAllConfigs(filepaths, processedOptions);
  return combine(resolvedFilePath, configs, processedOptions);
}

// src/config/find-project-root.js
import * as path6 from "path";

// node_modules/find-in-directory/index.js
import * as fs2 from "fs/promises";
import * as path4 from "path";
import process2 from "process";
async function safeStat(path17, allowSymlinks) {
  try {
    return await (allowSymlinks ? fs2.stat : fs2.lstat)(path17);
  } catch {
  }
}
function isTypeSatisfied(stats, type) {
  return !type || type === "file" && stats.isFile() || type === "directory" && stats.isDirectory();
}
async function findInternal(targetOrTargets, filterOrOptions, optionsWithoutFilter, type) {
  const targets = Array.isArray(targetOrTargets) ? targetOrTargets : [targetOrTargets];
  const options7 = typeof filterOrOptions === "function" ? { ...optionsWithoutFilter, filter: filterOrOptions } : { ...filterOrOptions };
  const shouldIgnoreTargetType = Boolean(type);
  if (shouldIgnoreTargetType) {
    options7.type = type;
  }
  const { cwd, allowSymlinks = true } = options7;
  const directory = toAbsolutePath(cwd) ?? process2.cwd();
  for (let target of targets) {
    if (typeof target === "string") {
      target = { name: target };
    }
    const fileOrDirectory = path4.join(directory, target.name);
    const stats = await safeStat(fileOrDirectory, allowSymlinks);
    if (!stats) {
      continue;
    }
    const type2 = shouldIgnoreTargetType ? options7.type : options7.type ?? target.type;
    if (!isTypeSatisfied(stats, type2)) {
      continue;
    }
    if (options7.filter || target.filter) {
      const file = { name: target.name, path: fileOrDirectory, stats };
      if (
        // `options.filter` not matched
        options7.filter && !await options7.filter(file) || // `target.filter` not matched
        target.filter && !await target.filter(file)
      ) {
        continue;
      }
    }
    return fileOrDirectory;
  }
}
function findFileInDirectory(targetOrTargets, filterOrOptions, optionsWithoutFilter) {
  return findInternal(
    targetOrTargets,
    filterOrOptions,
    optionsWithoutFilter,
    "file"
  );
}
function findInDirectory(targetOrTargets, filterOrOptions, optionsWithoutFilter) {
  return findInternal(targetOrTargets, filterOrOptions, optionsWithoutFilter);
}

// node_modules/iterate-directory-up/index.js
import * as path5 from "path";
import process3 from "process";
function* iterateDirectoryUp(from, to) {
  let directory = toAbsolutePath(from) ?? process3.cwd();
  let stopDirectory = toAbsolutePath(to);
  if (stopDirectory) {
    const relation = path5.relative(stopDirectory, directory);
    if (relation[0] === "." || relation === directory) {
      return;
    }
  }
  stopDirectory = stopDirectory ? directory.slice(0, stopDirectory.length) : path5.parse(directory).root;
  while (directory !== stopDirectory) {
    yield directory;
    directory = path5.dirname(directory);
  }
  yield stopDirectory;
}
var iterate_directory_up_default = iterateDirectoryUp;

// node_modules/search-closest/index.js
var SearcherInternal = class {
  #stopDirectory;
  #cache;
  #resultCache = /* @__PURE__ */ new Map();
  #searchWithoutCache;
  /**
  @protected
  @type {typeof findFileInDirectory | typeof findDirectoryInDirectory | typeof findInDirectory | undefined}
  */
  findInDirectory;
  /**
  @param {TargetOrTargets} targetOrTargets
  @param {FilterOrSearcherOptions} [filterOrOptions]
  @param {SearcherOptionsWithoutFilter} [optionsWithoutFilter]
  */
  constructor(targetOrTargets, filterOrOptions, optionsWithoutFilter) {
    const {
      allowSymlinks,
      filter: filter2,
      stopDirectory,
      cache: cache4 = true
    } = typeof filterOrOptions === "function" ? { ...optionsWithoutFilter, filter: filterOrOptions } : { ...filterOrOptions };
    this.#stopDirectory = stopDirectory;
    this.#cache = cache4;
    this.#searchWithoutCache = (directory) => (
      // @ts-expect-error
      this.findInDirectory(targetOrTargets, {
        cwd: directory,
        filter: filter2,
        allowSymlinks
      })
    );
  }
  /**
    @param {string} directory
    */
  #search(directory, cache4 = true) {
    const resultCache = this.#resultCache;
    if (!cache4 || !resultCache.has(directory)) {
      resultCache.set(directory, this.#searchWithoutCache(directory));
    }
    return resultCache.get(directory);
  }
  /**
    Find closest file or directory matches name or names.
  
    @param {OptionalUrlOrPath} [startDirectory]
    @param {SearchOptions} [options]
    @returns {SearchResult}
    */
  async search(startDirectory, options7) {
    for (const directory of iterate_directory_up_default(
      startDirectory,
      this.#stopDirectory
    )) {
      const result = await this.#search(
        directory,
        options7?.cache ?? this.#cache
      );
      if (result) {
        return result;
      }
    }
  }
  /**
    Clear caches.
  
    @returns {void}
    */
  clearCache() {
    this.#resultCache.clear();
  }
};
var FileSearcher = class extends SearcherInternal {
  /** @protected */
  findInDirectory = findFileInDirectory;
};
var Searcher = class extends SearcherInternal {
  /** @protected */
  findInDirectory = findInDirectory;
};

// src/config/find-project-root.js
var MARKERS = [
  // Git can be a file when the repository is a submodule or a working tree
  ".git",
  { name: ".hg", type: "directory" }
];
var searcher;
async function findProjectRoot(startDirectory, options7) {
  searcher ?? (searcher = new Searcher(MARKERS, { allowSymlinks: false }));
  const marker = await searcher.search(startDirectory, {
    cache: options7.shouldCache
  });
  return marker ? path6.dirname(marker) : void 0;
}
function clearFindProjectRootCache() {
  searcher?.clearCache();
}

// src/config/editorconfig/editorconfig-to-prettier.js
var isPositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;
function editorConfigToPrettier(editorConfig) {
  if (!editorConfig) {
    return;
  }
  const result = {};
  const {
    indent_style,
    indent_size,
    tab_width,
    max_line_length,
    quote_type,
    end_of_line
  } = editorConfig;
  if (indent_style === "space") {
    result.useTabs = false;
  } else if (indent_style === "tab" || indent_size === "tab") {
    result.useTabs = true;
  }
  if (result.useTabs === false && isPositiveInteger(indent_size)) {
    result.tabWidth = indent_size;
  } else if (isPositiveInteger(tab_width)) {
    result.tabWidth = tab_width;
  }
  if (max_line_length === "off") {
    result.printWidth = Number.POSITIVE_INFINITY;
  } else if (isPositiveInteger(max_line_length)) {
    result.printWidth = max_line_length;
  }
  if (quote_type === "single") {
    result.singleQuote = true;
  } else if (quote_type === "double") {
    result.singleQuote = false;
  }
  if (end_of_line === "lf" || end_of_line === "crlf" || end_of_line === "cr") {
    result.endOfLine = end_of_line;
  }
  if (Object.keys(result).length === 0) {
    return;
  }
  return result;
}
var editorconfig_to_prettier_default = editorConfigToPrettier;

// src/config/editorconfig/index.js
var editorconfigCache = /* @__PURE__ */ new Map();
function clearEditorconfigCache() {
  clearFindProjectRootCache();
  editorconfigCache.clear();
}
async function loadEditorconfigInternal(file, { shouldCache }) {
  const directory = path7.dirname(file);
  const root2 = await findProjectRoot(directory, { shouldCache });
  const editorConfig = await parse3(file, { root: root2 });
  const config = editorconfig_to_prettier_default(editorConfig);
  return config;
}
function loadEditorconfig(file, { shouldCache }) {
  file = path7.resolve(file);
  if (!shouldCache || !editorconfigCache.has(file)) {
    editorconfigCache.set(
      file,
      loadEditorconfigInternal(file, { shouldCache })
    );
  }
  return editorconfigCache.get(file);
}

// src/config/prettier-config/index.js
import path11 from "path";

// src/utilities/get-or-insert.js
function getOrInsertComputed(map, key2, callback) {
  if (!map.has(key2)) {
    const value = callback(key2);
    map.set(key2, value);
  }
  return map.get(key2);
}

// src/config/prettier-config/loaders.js
import { pathToFileURL as pathToFileURL2 } from "url";

// node_modules/json5/dist/index.mjs
var Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/;
var ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;
var ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;
var unicode = {
  Space_Separator,
  ID_Start,
  ID_Continue
};
var util = {
  isSpaceSeparator(c2) {
    return typeof c2 === "string" && unicode.Space_Separator.test(c2);
  },
  isIdStartChar(c2) {
    return typeof c2 === "string" && (c2 >= "a" && c2 <= "z" || c2 >= "A" && c2 <= "Z" || c2 === "$" || c2 === "_" || unicode.ID_Start.test(c2));
  },
  isIdContinueChar(c2) {
    return typeof c2 === "string" && (c2 >= "a" && c2 <= "z" || c2 >= "A" && c2 <= "Z" || c2 >= "0" && c2 <= "9" || c2 === "$" || c2 === "_" || c2 === "\u200C" || c2 === "\u200D" || unicode.ID_Continue.test(c2));
  },
  isDigit(c2) {
    return typeof c2 === "string" && /[0-9]/.test(c2);
  },
  isHexDigit(c2) {
    return typeof c2 === "string" && /[0-9A-Fa-f]/.test(c2);
  }
};
var source;
var parseState;
var stack;
var pos;
var line;
var column;
var token;
var key;
var root;
var parse5 = function parse6(text, reviver) {
  source = String(text);
  parseState = "start";
  stack = [];
  pos = 0;
  line = 1;
  column = 0;
  token = void 0;
  key = void 0;
  root = void 0;
  do {
    token = lex();
    parseStates[parseState]();
  } while (token.type !== "eof");
  if (typeof reviver === "function") {
    return internalize({ "": root }, "", reviver);
  }
  return root;
};
function internalize(holder, name, reviver) {
  const value = holder[name];
  if (value != null && typeof value === "object") {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const key2 = String(i);
        const replacement = internalize(value, key2, reviver);
        if (replacement === void 0) {
          delete value[key2];
        } else {
          Object.defineProperty(value, key2, {
            value: replacement,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
    } else {
      for (const key2 in value) {
        const replacement = internalize(value, key2, reviver);
        if (replacement === void 0) {
          delete value[key2];
        } else {
          Object.defineProperty(value, key2, {
            value: replacement,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
    }
  }
  return reviver.call(holder, name, value);
}
var lexState;
var buffer;
var doubleQuote;
var sign;
var c;
function lex() {
  lexState = "default";
  buffer = "";
  doubleQuote = false;
  sign = 1;
  for (; ; ) {
    c = peek();
    const token2 = lexStates[lexState]();
    if (token2) {
      return token2;
    }
  }
}
function peek() {
  if (source[pos]) {
    return String.fromCodePoint(source.codePointAt(pos));
  }
}
function read() {
  const c2 = peek();
  if (c2 === "\n") {
    line++;
    column = 0;
  } else if (c2) {
    column += c2.length;
  } else {
    column++;
  }
  if (c2) {
    pos += c2.length;
  }
  return c2;
}
var lexStates = {
  default() {
    switch (c) {
      case "	":
      case "\v":
      case "\f":
      case " ":
      case "\xA0":
      case "\uFEFF":
      case "\n":
      case "\r":
      case "\u2028":
      case "\u2029":
        read();
        return;
      case "/":
        read();
        lexState = "comment";
        return;
      case void 0:
        read();
        return newToken("eof");
    }
    if (util.isSpaceSeparator(c)) {
      read();
      return;
    }
    return lexStates[parseState]();
  },
  comment() {
    switch (c) {
      case "*":
        read();
        lexState = "multiLineComment";
        return;
      case "/":
        read();
        lexState = "singleLineComment";
        return;
    }
    throw invalidChar(read());
  },
  multiLineComment() {
    switch (c) {
      case "*":
        read();
        lexState = "multiLineCommentAsterisk";
        return;
      case void 0:
        throw invalidChar(read());
    }
    read();
  },
  multiLineCommentAsterisk() {
    switch (c) {
      case "*":
        read();
        return;
      case "/":
        read();
        lexState = "default";
        return;
      case void 0:
        throw invalidChar(read());
    }
    read();
    lexState = "multiLineComment";
  },
  singleLineComment() {
    switch (c) {
      case "\n":
      case "\r":
      case "\u2028":
      case "\u2029":
        read();
        lexState = "default";
        return;
      case void 0:
        read();
        return newToken("eof");
    }
    read();
  },
  value() {
    switch (c) {
      case "{":
      case "[":
        return newToken("punctuator", read());
      case "n":
        read();
        literal("ull");
        return newToken("null", null);
      case "t":
        read();
        literal("rue");
        return newToken("boolean", true);
      case "f":
        read();
        literal("alse");
        return newToken("boolean", false);
      case "-":
      case "+":
        if (read() === "-") {
          sign = -1;
        }
        lexState = "sign";
        return;
      case ".":
        buffer = read();
        lexState = "decimalPointLeading";
        return;
      case "0":
        buffer = read();
        lexState = "zero";
        return;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        buffer = read();
        lexState = "decimalInteger";
        return;
      case "I":
        read();
        literal("nfinity");
        return newToken("numeric", Infinity);
      case "N":
        read();
        literal("aN");
        return newToken("numeric", NaN);
      case '"':
      case "'":
        doubleQuote = read() === '"';
        buffer = "";
        lexState = "string";
        return;
    }
    throw invalidChar(read());
  },
  identifierNameStartEscape() {
    if (c !== "u") {
      throw invalidChar(read());
    }
    read();
    const u = unicodeEscape();
    switch (u) {
      case "$":
      case "_":
        break;
      default:
        if (!util.isIdStartChar(u)) {
          throw invalidIdentifier();
        }
        break;
    }
    buffer += u;
    lexState = "identifierName";
  },
  identifierName() {
    switch (c) {
      case "$":
      case "_":
      case "\u200C":
      case "\u200D":
        buffer += read();
        return;
      case "\\":
        read();
        lexState = "identifierNameEscape";
        return;
    }
    if (util.isIdContinueChar(c)) {
      buffer += read();
      return;
    }
    return newToken("identifier", buffer);
  },
  identifierNameEscape() {
    if (c !== "u") {
      throw invalidChar(read());
    }
    read();
    const u = unicodeEscape();
    switch (u) {
      case "$":
      case "_":
      case "\u200C":
      case "\u200D":
        break;
      default:
        if (!util.isIdContinueChar(u)) {
          throw invalidIdentifier();
        }
        break;
    }
    buffer += u;
    lexState = "identifierName";
  },
  sign() {
    switch (c) {
      case ".":
        buffer = read();
        lexState = "decimalPointLeading";
        return;
      case "0":
        buffer = read();
        lexState = "zero";
        return;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        buffer = read();
        lexState = "decimalInteger";
        return;
      case "I":
        read();
        literal("nfinity");
        return newToken("numeric", sign * Infinity);
      case "N":
        read();
        literal("aN");
        return newToken("numeric", NaN);
    }
    throw invalidChar(read());
  },
  zero() {
    switch (c) {
      case ".":
        buffer += read();
        lexState = "decimalPoint";
        return;
      case "e":
      case "E":
        buffer += read();
        lexState = "decimalExponent";
        return;
      case "x":
      case "X":
        buffer += read();
        lexState = "hexadecimal";
        return;
    }
    return newToken("numeric", sign * 0);
  },
  decimalInteger() {
    switch (c) {
      case ".":
        buffer += read();
        lexState = "decimalPoint";
        return;
      case "e":
      case "E":
        buffer += read();
        lexState = "decimalExponent";
        return;
    }
    if (util.isDigit(c)) {
      buffer += read();
      return;
    }
    return newToken("numeric", sign * Number(buffer));
  },
  decimalPointLeading() {
    if (util.isDigit(c)) {
      buffer += read();
      lexState = "decimalFraction";
      return;
    }
    throw invalidChar(read());
  },
  decimalPoint() {
    switch (c) {
      case "e":
      case "E":
        buffer += read();
        lexState = "decimalExponent";
        return;
    }
    if (util.isDigit(c)) {
      buffer += read();
      lexState = "decimalFraction";
      return;
    }
    return newToken("numeric", sign * Number(buffer));
  },
  decimalFraction() {
    switch (c) {
      case "e":
      case "E":
        buffer += read();
        lexState = "decimalExponent";
        return;
    }
    if (util.isDigit(c)) {
      buffer += read();
      return;
    }
    return newToken("numeric", sign * Number(buffer));
  },
  decimalExponent() {
    switch (c) {
      case "+":
      case "-":
        buffer += read();
        lexState = "decimalExponentSign";
        return;
    }
    if (util.isDigit(c)) {
      buffer += read();
      lexState = "decimalExponentInteger";
      return;
    }
    throw invalidChar(read());
  },
  decimalExponentSign() {
    if (util.isDigit(c)) {
      buffer += read();
      lexState = "decimalExponentInteger";
      return;
    }
    throw invalidChar(read());
  },
  decimalExponentInteger() {
    if (util.isDigit(c)) {
      buffer += read();
      return;
    }
    return newToken("numeric", sign * Number(buffer));
  },
  hexadecimal() {
    if (util.isHexDigit(c)) {
      buffer += read();
      lexState = "hexadecimalInteger";
      return;
    }
    throw invalidChar(read());
  },
  hexadecimalInteger() {
    if (util.isHexDigit(c)) {
      buffer += read();
      return;
    }
    return newToken("numeric", sign * Number(buffer));
  },
  string() {
    switch (c) {
      case "\\":
        read();
        buffer += escape2();
        return;
      case '"':
        if (doubleQuote) {
          read();
          return newToken("string", buffer);
        }
        buffer += read();
        return;
      case "'":
        if (!doubleQuote) {
          read();
          return newToken("string", buffer);
        }
        buffer += read();
        return;
      case "\n":
      case "\r":
        throw invalidChar(read());
      case "\u2028":
      case "\u2029":
        separatorChar(c);
        break;
      case void 0:
        throw invalidChar(read());
    }
    buffer += read();
  },
  start() {
    switch (c) {
      case "{":
      case "[":
        return newToken("punctuator", read());
    }
    lexState = "value";
  },
  beforePropertyName() {
    switch (c) {
      case "$":
      case "_":
        buffer = read();
        lexState = "identifierName";
        return;
      case "\\":
        read();
        lexState = "identifierNameStartEscape";
        return;
      case "}":
        return newToken("punctuator", read());
      case '"':
      case "'":
        doubleQuote = read() === '"';
        lexState = "string";
        return;
    }
    if (util.isIdStartChar(c)) {
      buffer += read();
      lexState = "identifierName";
      return;
    }
    throw invalidChar(read());
  },
  afterPropertyName() {
    if (c === ":") {
      return newToken("punctuator", read());
    }
    throw invalidChar(read());
  },
  beforePropertyValue() {
    lexState = "value";
  },
  afterPropertyValue() {
    switch (c) {
      case ",":
      case "}":
        return newToken("punctuator", read());
    }
    throw invalidChar(read());
  },
  beforeArrayValue() {
    if (c === "]") {
      return newToken("punctuator", read());
    }
    lexState = "value";
  },
  afterArrayValue() {
    switch (c) {
      case ",":
      case "]":
        return newToken("punctuator", read());
    }
    throw invalidChar(read());
  },
  end() {
    throw invalidChar(read());
  }
};
function newToken(type, value) {
  return {
    type,
    value,
    line,
    column
  };
}
function literal(s) {
  for (const c2 of s) {
    const p = peek();
    if (p !== c2) {
      throw invalidChar(read());
    }
    read();
  }
}
function escape2() {
  const c2 = peek();
  switch (c2) {
    case "b":
      read();
      return "\b";
    case "f":
      read();
      return "\f";
    case "n":
      read();
      return "\n";
    case "r":
      read();
      return "\r";
    case "t":
      read();
      return "	";
    case "v":
      read();
      return "\v";
    case "0":
      read();
      if (util.isDigit(peek())) {
        throw invalidChar(read());
      }
      return "\0";
    case "x":
      read();
      return hexEscape();
    case "u":
      read();
      return unicodeEscape();
    case "\n":
    case "\u2028":
    case "\u2029":
      read();
      return "";
    case "\r":
      read();
      if (peek() === "\n") {
        read();
      }
      return "";
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      throw invalidChar(read());
    case void 0:
      throw invalidChar(read());
  }
  return read();
}
function hexEscape() {
  let buffer2 = "";
  let c2 = peek();
  if (!util.isHexDigit(c2)) {
    throw invalidChar(read());
  }
  buffer2 += read();
  c2 = peek();
  if (!util.isHexDigit(c2)) {
    throw invalidChar(read());
  }
  buffer2 += read();
  return String.fromCodePoint(parseInt(buffer2, 16));
}
function unicodeEscape() {
  let buffer2 = "";
  let count = 4;
  while (count-- > 0) {
    const c2 = peek();
    if (!util.isHexDigit(c2)) {
      throw invalidChar(read());
    }
    buffer2 += read();
  }
  return String.fromCodePoint(parseInt(buffer2, 16));
}
var parseStates = {
  start() {
    if (token.type === "eof") {
      throw invalidEOF();
    }
    push();
  },
  beforePropertyName() {
    switch (token.type) {
      case "identifier":
      case "string":
        key = token.value;
        parseState = "afterPropertyName";
        return;
      case "punctuator":
        pop();
        return;
      case "eof":
        throw invalidEOF();
    }
  },
  afterPropertyName() {
    if (token.type === "eof") {
      throw invalidEOF();
    }
    parseState = "beforePropertyValue";
  },
  beforePropertyValue() {
    if (token.type === "eof") {
      throw invalidEOF();
    }
    push();
  },
  beforeArrayValue() {
    if (token.type === "eof") {
      throw invalidEOF();
    }
    if (token.type === "punctuator" && token.value === "]") {
      pop();
      return;
    }
    push();
  },
  afterPropertyValue() {
    if (token.type === "eof") {
      throw invalidEOF();
    }
    switch (token.value) {
      case ",":
        parseState = "beforePropertyName";
        return;
      case "}":
        pop();
    }
  },
  afterArrayValue() {
    if (token.type === "eof") {
      throw invalidEOF();
    }
    switch (token.value) {
      case ",":
        parseState = "beforeArrayValue";
        return;
      case "]":
        pop();
    }
  },
  end() {
  }
};
function push() {
  let value;
  switch (token.type) {
    case "punctuator":
      switch (token.value) {
        case "{":
          value = {};
          break;
        case "[":
          value = [];
          break;
      }
      break;
    case "null":
    case "boolean":
    case "numeric":
    case "string":
      value = token.value;
      break;
  }
  if (root === void 0) {
    root = value;
  } else {
    const parent = stack[stack.length - 1];
    if (Array.isArray(parent)) {
      parent.push(value);
    } else {
      Object.defineProperty(parent, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  }
  if (value !== null && typeof value === "object") {
    stack.push(value);
    if (Array.isArray(value)) {
      parseState = "beforeArrayValue";
    } else {
      parseState = "beforePropertyName";
    }
  } else {
    const current = stack[stack.length - 1];
    if (current == null) {
      parseState = "end";
    } else if (Array.isArray(current)) {
      parseState = "afterArrayValue";
    } else {
      parseState = "afterPropertyValue";
    }
  }
}
function pop() {
  stack.pop();
  const current = stack[stack.length - 1];
  if (current == null) {
    parseState = "end";
  } else if (Array.isArray(current)) {
    parseState = "afterArrayValue";
  } else {
    parseState = "afterPropertyValue";
  }
}
function invalidChar(c2) {
  if (c2 === void 0) {
    return syntaxError(`JSON5: invalid end of input at ${line}:${column}`);
  }
  return syntaxError(`JSON5: invalid character '${formatChar(c2)}' at ${line}:${column}`);
}
function invalidEOF() {
  return syntaxError(`JSON5: invalid end of input at ${line}:${column}`);
}
function invalidIdentifier() {
  column -= 5;
  return syntaxError(`JSON5: invalid identifier character at ${line}:${column}`);
}
function separatorChar(c2) {
  console.warn(`JSON5: '${formatChar(c2)}' in strings is not valid ECMAScript; consider escaping`);
}
function formatChar(c2) {
  const replacements = {
    "'": "\\'",
    '"': '\\"',
    "\\": "\\\\",
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "	": "\\t",
    "\v": "\\v",
    "\0": "\\0",
    "\u2028": "\\u2028",
    "\u2029": "\\u2029"
  };
  if (replacements[c2]) {
    return replacements[c2];
  }
  if (c2 < " ") {
    const hexString = c2.charCodeAt(0).toString(16);
    return "\\x" + ("00" + hexString).substring(hexString.length);
  }
  return c2;
}
function syntaxError(message) {
  const err = new SyntaxError(message);
  err.lineNumber = line;
  err.columnNumber = column;
  return err;
}
var dist_default = { parse: parse5 };

// node_modules/@babel/code-frame/lib/common-shared.js
var NEWLINE = /\r\n|[\n\r\u2028\u2029]/;
function getMarkerLines(loc, source2, opts2, startLineBaseZero) {
  const startLoc = {
    column: null,
    line: -1,
    ...loc.start
  };
  const endLoc = {
    ...startLoc,
    ...loc.end
  };
  const {
    linesAbove = 2,
    linesBelow = 3
  } = opts2 || {};
  const startLine = startLoc.line - startLineBaseZero;
  const startColumn = startLoc.column;
  const endLine = endLoc.line - startLineBaseZero;
  const endColumn = endLoc.column;
  let start = Math.max(startLine - (linesAbove + 1), 0);
  let end = Math.min(source2.length, endLine + linesBelow);
  if (startLine === -1) {
    start = 0;
  }
  if (endLine === -1) {
    end = source2.length;
  }
  const lineDiff2 = endLine - startLine;
  const markerLines = {};
  if (lineDiff2) {
    for (let i = 0; i <= lineDiff2; i++) {
      const lineNumber = i + startLine;
      if (startColumn == null) {
        markerLines[lineNumber] = true;
      } else if (i === 0) {
        const sourceLength = source2[lineNumber - 1].length;
        markerLines[lineNumber] = [startColumn, sourceLength - startColumn];
      } else if (i === lineDiff2) {
        markerLines[lineNumber] = [0, endColumn];
      } else {
        const sourceLength = source2[lineNumber - 1].length;
        markerLines[lineNumber] = [0, sourceLength];
      }
    }
  } else {
    if (startColumn === endColumn) {
      if (startColumn != null) {
        markerLines[startLine] = [startColumn, 0];
      } else {
        markerLines[startLine] = true;
      }
    } else {
      const safeStart = startColumn ?? 0;
      const safeEnd = endColumn ?? safeStart;
      markerLines[startLine] = [safeStart, safeEnd - safeStart];
    }
  }
  return {
    start,
    end,
    markerLines
  };
}
function _codeFrameColumns(rawLines, loc, opts2 = {}, colorOpts) {
  const {
    defs: defs2,
    highlight: highlight2
  } = colorOpts || {
    defs: {
      gutter: String,
      marker: String,
      message: String,
      reset: String
    },
    highlight: String
  };
  const startLineBaseZero = (opts2.startLine || 1) - 1;
  const lines = rawLines.split(NEWLINE);
  const {
    start,
    end,
    markerLines
  } = getMarkerLines(loc, lines, opts2, startLineBaseZero);
  const hasColumns = loc.start && typeof loc.start.column === "number";
  const numberMaxWidth = String(end + startLineBaseZero).length;
  const highlightedLines = highlight2(rawLines);
  let frame = highlightedLines.split(NEWLINE, end).slice(start, end).map((line3, index) => {
    const number = start + 1 + index;
    const paddedNumber = ` ${number + startLineBaseZero}`.slice(-numberMaxWidth);
    const gutter = ` ${paddedNumber} |`;
    const hasMarker = markerLines[number];
    const lastMarkerLine = !markerLines[number + 1];
    if (hasMarker) {
      let markerLine = "";
      if (Array.isArray(hasMarker)) {
        const markerSpacing = line3.slice(0, hasMarker[0]).replace(/[^\t]/g, " ");
        const numberOfMarkers = hasMarker[1] || 1;
        markerLine = ["\n ", defs2.gutter(gutter.replace(/\d/g, " ")), " ", markerSpacing, defs2.marker("^").repeat(numberOfMarkers)].join("");
        if (lastMarkerLine && opts2.message) {
          markerLine += " " + defs2.message(opts2.message);
        }
      }
      return [defs2.marker(">"), defs2.gutter(gutter), line3.length > 0 ? ` ${line3}` : "", markerLine].join("");
    } else {
      return ` ${defs2.gutter(gutter)}${line3.length > 0 ? ` ${line3}` : ""}`;
    }
  }).join("\n");
  if (opts2.message && !hasColumns) {
    frame = `${" ".repeat(numberMaxWidth + 1)}${opts2.message}
${frame}`;
  }
  return defs2.reset(frame);
}

// scripts/build/shims/node-util.js
import * as util2 from "util";
var styleText2 = util2.styleText ?? ((format3, text) => text);

// node_modules/@babel/code-frame/node_modules/js-tokens/index.js
var HashbangComment;
var Identifier;
var JSXIdentifier;
var JSXPunctuator;
var JSXString;
var JSXText;
var KeywordsWithExpressionAfter;
var KeywordsWithNoLineTerminatorAfter;
var LineTerminatorSequence;
var MultiLineComment;
var Newline;
var NumericLiteral;
var Punctuator;
var RegularExpressionLiteral;
var SingleLineComment;
var StringLiteral;
var Template;
var TokensNotPrecedingObjectLiteral;
var TokensPrecedingExpression;
var WhiteSpace;
var jsTokens;
RegularExpressionLiteral = /\/(?![*\/])(?:\[(?:[^\]\\\n\r\u2028\u2029]+|\\.)*\]?|[^\/[\\\n\r\u2028\u2029]+|\\.)*(\/[$_\u200C\u200D\p{ID_Continue}]*|\\)?/yu;
Punctuator = /--|\+\+|=>|\.{3}|\??\.(?!\d)|(?:&&|\|\||\?\?|[+\-%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2}|\/(?![\/*]))=?|[?~,:;[\](){}]/y;
Identifier = /(\x23?)(?=[$_\p{ID_Start}\\])(?:[$_\u200C\u200D\p{ID_Continue}]+|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+/yu;
StringLiteral = /(['"])(?:[^'"\\\n\r]+|(?!\1)['"]|\\(?:\r\n|[^]))*(\1)?/y;
NumericLiteral = /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*|0[oO][0-7](?:_?[0-7])*|0[bB][01](?:_?[01])*)n?|0n|[1-9](?:_?\d)*n|(?:(?:0(?!\d)|0\d*[89]\d*|[1-9](?:_?\d)*)(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?|0[0-7]+/y;
Template = /[`}](?:[^`\\$]+|\\[^]|\$(?!\{))*(`|\$\{)?/y;
WhiteSpace = /[\t\v\f\ufeff\p{Zs}]+/yu;
LineTerminatorSequence = /\r?\n|[\r\u2028\u2029]/y;
MultiLineComment = /\/\*(?:[^*]+|\*(?!\/))*(\*\/)?/y;
SingleLineComment = /\/\/.*/y;
HashbangComment = /^#!.*/;
JSXPunctuator = /[<>.:={}]|\/(?![\/*])/y;
JSXIdentifier = /[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}-]*/yu;
JSXString = /(['"])(?:[^'"]+|(?!\1)['"])*(\1)?/y;
JSXText = /[^<>{}]+/y;
TokensPrecedingExpression = /^(?:[\/+-]|\.{3}|\?(?:InterpolationIn(?:JSX|Template)|NoLineTerminatorHere|NonExpressionParenEnd|UnaryIncDec))?$|[{}([,;<>=*%&|^!~?:]$/;
TokensNotPrecedingObjectLiteral = /^(?:=>|[;\]){}]|else|\?(?:NoLineTerminatorHere|NonExpressionParenEnd))?$/;
KeywordsWithExpressionAfter = /^(?:await|case|default|delete|do|else|instanceof|new|return|throw|typeof|void|yield)$/;
KeywordsWithNoLineTerminatorAfter = /^(?:return|throw|yield)$/;
Newline = RegExp(LineTerminatorSequence.source);
jsTokens = function* (input, { jsx = false } = {}) {
  var braces, firstCodePoint, isExpression, lastIndex, lastSignificantToken, length, match2, mode, nextLastIndex, nextLastSignificantToken, parenNesting, postfixIncDec, punctuator, stack2;
  ({ length } = input);
  lastIndex = 0;
  lastSignificantToken = "";
  stack2 = [
    { tag: "JS" }
  ];
  braces = [];
  parenNesting = 0;
  postfixIncDec = false;
  if (match2 = HashbangComment.exec(input)) {
    yield {
      type: "HashbangComment",
      value: match2[0]
    };
    lastIndex = match2[0].length;
  }
  while (lastIndex < length) {
    mode = stack2[stack2.length - 1];
    switch (mode.tag) {
      case "JS":
      case "JSNonExpressionParen":
      case "InterpolationInTemplate":
      case "InterpolationInJSX":
        if (input[lastIndex] === "/" && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken))) {
          RegularExpressionLiteral.lastIndex = lastIndex;
          if (match2 = RegularExpressionLiteral.exec(input)) {
            lastIndex = RegularExpressionLiteral.lastIndex;
            lastSignificantToken = match2[0];
            postfixIncDec = true;
            yield {
              type: "RegularExpressionLiteral",
              value: match2[0],
              closed: match2[1] !== void 0 && match2[1] !== "\\"
            };
            continue;
          }
        }
        Punctuator.lastIndex = lastIndex;
        if (match2 = Punctuator.exec(input)) {
          punctuator = match2[0];
          nextLastIndex = Punctuator.lastIndex;
          nextLastSignificantToken = punctuator;
          switch (punctuator) {
            case "(":
              if (lastSignificantToken === "?NonExpressionParenKeyword") {
                stack2.push({
                  tag: "JSNonExpressionParen",
                  nesting: parenNesting
                });
              }
              parenNesting++;
              postfixIncDec = false;
              break;
            case ")":
              parenNesting--;
              postfixIncDec = true;
              if (mode.tag === "JSNonExpressionParen" && parenNesting === mode.nesting) {
                stack2.pop();
                nextLastSignificantToken = "?NonExpressionParenEnd";
                postfixIncDec = false;
              }
              break;
            case "{":
              Punctuator.lastIndex = 0;
              isExpression = !TokensNotPrecedingObjectLiteral.test(lastSignificantToken) && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken));
              braces.push(isExpression);
              postfixIncDec = false;
              break;
            case "}":
              switch (mode.tag) {
                case "InterpolationInTemplate":
                  if (braces.length === mode.nesting) {
                    Template.lastIndex = lastIndex;
                    match2 = Template.exec(input);
                    lastIndex = Template.lastIndex;
                    lastSignificantToken = match2[0];
                    if (match2[1] === "${") {
                      lastSignificantToken = "?InterpolationInTemplate";
                      postfixIncDec = false;
                      yield {
                        type: "TemplateMiddle",
                        value: match2[0]
                      };
                    } else {
                      stack2.pop();
                      postfixIncDec = true;
                      yield {
                        type: "TemplateTail",
                        value: match2[0],
                        closed: match2[1] === "`"
                      };
                    }
                    continue;
                  }
                  break;
                case "InterpolationInJSX":
                  if (braces.length === mode.nesting) {
                    stack2.pop();
                    lastIndex += 1;
                    lastSignificantToken = "}";
                    yield {
                      type: "JSXPunctuator",
                      value: "}"
                    };
                    continue;
                  }
              }
              postfixIncDec = braces.pop();
              nextLastSignificantToken = postfixIncDec ? "?ExpressionBraceEnd" : "}";
              break;
            case "]":
              postfixIncDec = true;
              break;
            case "++":
            case "--":
              nextLastSignificantToken = postfixIncDec ? "?PostfixIncDec" : "?UnaryIncDec";
              break;
            case "<":
              if (jsx && (TokensPrecedingExpression.test(lastSignificantToken) || KeywordsWithExpressionAfter.test(lastSignificantToken))) {
                stack2.push({ tag: "JSXTag" });
                lastIndex += 1;
                lastSignificantToken = "<";
                yield {
                  type: "JSXPunctuator",
                  value: punctuator
                };
                continue;
              }
              postfixIncDec = false;
              break;
            default:
              postfixIncDec = false;
          }
          lastIndex = nextLastIndex;
          lastSignificantToken = nextLastSignificantToken;
          yield {
            type: "Punctuator",
            value: punctuator
          };
          continue;
        }
        Identifier.lastIndex = lastIndex;
        if (match2 = Identifier.exec(input)) {
          lastIndex = Identifier.lastIndex;
          nextLastSignificantToken = match2[0];
          switch (match2[0]) {
            case "for":
            case "if":
            case "while":
            case "with":
              if (lastSignificantToken !== "." && lastSignificantToken !== "?.") {
                nextLastSignificantToken = "?NonExpressionParenKeyword";
              }
          }
          lastSignificantToken = nextLastSignificantToken;
          postfixIncDec = !KeywordsWithExpressionAfter.test(match2[0]);
          yield {
            type: match2[1] === "#" ? "PrivateIdentifier" : "IdentifierName",
            value: match2[0]
          };
          continue;
        }
        StringLiteral.lastIndex = lastIndex;
        if (match2 = StringLiteral.exec(input)) {
          lastIndex = StringLiteral.lastIndex;
          lastSignificantToken = match2[0];
          postfixIncDec = true;
          yield {
            type: "StringLiteral",
            value: match2[0],
            closed: match2[2] !== void 0
          };
          continue;
        }
        NumericLiteral.lastIndex = lastIndex;
        if (match2 = NumericLiteral.exec(input)) {
          lastIndex = NumericLiteral.lastIndex;
          lastSignificantToken = match2[0];
          postfixIncDec = true;
          yield {
            type: "NumericLiteral",
            value: match2[0]
          };
          continue;
        }
        Template.lastIndex = lastIndex;
        if (match2 = Template.exec(input)) {
          lastIndex = Template.lastIndex;
          lastSignificantToken = match2[0];
          if (match2[1] === "${") {
            lastSignificantToken = "?InterpolationInTemplate";
            stack2.push({
              tag: "InterpolationInTemplate",
              nesting: braces.length
            });
            postfixIncDec = false;
            yield {
              type: "TemplateHead",
              value: match2[0]
            };
          } else {
            postfixIncDec = true;
            yield {
              type: "NoSubstitutionTemplate",
              value: match2[0],
              closed: match2[1] === "`"
            };
          }
          continue;
        }
        break;
      case "JSXTag":
      case "JSXTagEnd":
        JSXPunctuator.lastIndex = lastIndex;
        if (match2 = JSXPunctuator.exec(input)) {
          lastIndex = JSXPunctuator.lastIndex;
          nextLastSignificantToken = match2[0];
          switch (match2[0]) {
            case "<":
              stack2.push({ tag: "JSXTag" });
              break;
            case ">":
              stack2.pop();
              if (lastSignificantToken === "/" || mode.tag === "JSXTagEnd") {
                nextLastSignificantToken = "?JSX";
                postfixIncDec = true;
              } else {
                stack2.push({ tag: "JSXChildren" });
              }
              break;
            case "{":
              stack2.push({
                tag: "InterpolationInJSX",
                nesting: braces.length
              });
              nextLastSignificantToken = "?InterpolationInJSX";
              postfixIncDec = false;
              break;
            case "/":
              if (lastSignificantToken === "<") {
                stack2.pop();
                if (stack2[stack2.length - 1].tag === "JSXChildren") {
                  stack2.pop();
                }
                stack2.push({ tag: "JSXTagEnd" });
              }
          }
          lastSignificantToken = nextLastSignificantToken;
          yield {
            type: "JSXPunctuator",
            value: match2[0]
          };
          continue;
        }
        JSXIdentifier.lastIndex = lastIndex;
        if (match2 = JSXIdentifier.exec(input)) {
          lastIndex = JSXIdentifier.lastIndex;
          lastSignificantToken = match2[0];
          yield {
            type: "JSXIdentifier",
            value: match2[0]
          };
          continue;
        }
        JSXString.lastIndex = lastIndex;
        if (match2 = JSXString.exec(input)) {
          lastIndex = JSXString.lastIndex;
          lastSignificantToken = match2[0];
          yield {
            type: "JSXString",
            value: match2[0],
            closed: match2[2] !== void 0
          };
          continue;
        }
        break;
      case "JSXChildren":
        JSXText.lastIndex = lastIndex;
        if (match2 = JSXText.exec(input)) {
          lastIndex = JSXText.lastIndex;
          lastSignificantToken = match2[0];
          yield {
            type: "JSXText",
            value: match2[0]
          };
          continue;
        }
        switch (input[lastIndex]) {
          case "<":
            stack2.push({ tag: "JSXTag" });
            lastIndex++;
            lastSignificantToken = "<";
            yield {
              type: "JSXPunctuator",
              value: "<"
            };
            continue;
          case "{":
            stack2.push({
              tag: "InterpolationInJSX",
              nesting: braces.length
            });
            lastIndex++;
            lastSignificantToken = "?InterpolationInJSX";
            postfixIncDec = false;
            yield {
              type: "JSXPunctuator",
              value: "{"
            };
            continue;
        }
    }
    WhiteSpace.lastIndex = lastIndex;
    if (match2 = WhiteSpace.exec(input)) {
      lastIndex = WhiteSpace.lastIndex;
      yield {
        type: "WhiteSpace",
        value: match2[0]
      };
      continue;
    }
    LineTerminatorSequence.lastIndex = lastIndex;
    if (match2 = LineTerminatorSequence.exec(input)) {
      lastIndex = LineTerminatorSequence.lastIndex;
      postfixIncDec = false;
      if (KeywordsWithNoLineTerminatorAfter.test(lastSignificantToken)) {
        lastSignificantToken = "?NoLineTerminatorHere";
      }
      yield {
        type: "LineTerminatorSequence",
        value: match2[0]
      };
      continue;
    }
    MultiLineComment.lastIndex = lastIndex;
    if (match2 = MultiLineComment.exec(input)) {
      lastIndex = MultiLineComment.lastIndex;
      if (Newline.test(match2[0])) {
        postfixIncDec = false;
        if (KeywordsWithNoLineTerminatorAfter.test(lastSignificantToken)) {
          lastSignificantToken = "?NoLineTerminatorHere";
        }
      }
      yield {
        type: "MultiLineComment",
        value: match2[0],
        closed: match2[1] !== void 0
      };
      continue;
    }
    SingleLineComment.lastIndex = lastIndex;
    if (match2 = SingleLineComment.exec(input)) {
      lastIndex = SingleLineComment.lastIndex;
      postfixIncDec = false;
      yield {
        type: "SingleLineComment",
        value: match2[0]
      };
      continue;
    }
    firstCodePoint = String.fromCodePoint(input.codePointAt(lastIndex));
    lastIndex += firstCodePoint.length;
    lastSignificantToken = firstCodePoint;
    postfixIncDec = false;
    yield {
      type: mode.tag.startsWith("JSX") ? "JSXInvalid" : "Invalid",
      value: firstCodePoint
    };
  }
  return void 0;
};
var js_tokens_default = jsTokens;

// node_modules/@babel/code-frame/node_modules/@babel/helper-validator-identifier/lib/index.js
var bmpIdentifierStartChars = "\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088F\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5C\u0C5D\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDC-\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C8A\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7DC\uA7F1-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
var bmpIdentifierChars = "\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u0897-\u089F\u08CA-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B55-\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3C\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0CF3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D81-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EBC\u0EC8-\u0ECE\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1715\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u180F-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1ABF-\u1ADD\u1AE0-\u1AEB\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\u30FB\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA82C\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F\uFF65";
var bmpIdentifierStart = new RegExp("[" + bmpIdentifierStartChars + "]");
var bmpIdentifier = new RegExp("[" + bmpIdentifierStartChars + bmpIdentifierChars + "]");
var reservedWords = {
  keyword: ["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete"],
  strict: ["implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"],
  strictBind: ["eval", "arguments"]
};
var keywords = new Set(reservedWords.keyword);
var reservedWordsStrictSet = new Set(reservedWords.strict);
var reservedWordsStrictBindSet = new Set(reservedWords.strictBind);
function isReservedWord(word, inModule) {
  return inModule && word === "await" || word === "enum";
}
function isStrictReservedWord(word, inModule) {
  return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
}
function isKeyword(word) {
  return keywords.has(word);
}

// node_modules/@babel/code-frame/lib/index.js
function isColorSupported() {
  return styleText2("red", "-") !== "-";
}
function createFormatter(format3) {
  return (input) => styleText2(format3, String(input ?? ""), {
    validateStream: false
  });
}
var defs = {
  keyword: createFormatter("cyan"),
  capitalized: createFormatter("yellow"),
  jsxIdentifier: createFormatter("yellow"),
  punctuator: createFormatter("yellow"),
  number: createFormatter("magenta"),
  string: createFormatter("green"),
  regex: createFormatter("magenta"),
  comment: createFormatter("gray"),
  invalid: createFormatter(["white", "bgRed", "bold"]),
  gutter: createFormatter("gray"),
  marker: createFormatter(["red", "bold"]),
  message: createFormatter(["red", "bold"]),
  reset: createFormatter("reset")
};
var sometimesKeywords = /* @__PURE__ */ new Set(["as", "async", "from", "get", "of", "set"]);
var NEWLINE2 = /\r\n|[\n\r\u2028\u2029]/;
var BRACKET = /^[()[\]{}]$/;
var getTokenType = function(token2) {
  if (token2.type === "IdentifierName") {
    const tokenValue = token2.value;
    if (isKeyword(tokenValue) || isStrictReservedWord(tokenValue, true) || sometimesKeywords.has(tokenValue)) {
      return "keyword";
    }
    const firstChar = tokenValue.charCodeAt(0);
    if (firstChar < 128) {
      if (firstChar >= 65 && firstChar <= 90) {
        return "capitalized";
      }
    } else {
      const firstChar2 = String.fromCodePoint(tokenValue.codePointAt(0));
      if (firstChar2 !== firstChar2.toLowerCase()) {
        return "capitalized";
      }
    }
  }
  if (token2.type === "Punctuator" && BRACKET.test(token2.value)) {
    return "uncolored";
  }
  if (token2.type === "Invalid" && token2.value === "@") {
    return "punctuator";
  }
  switch (token2.type) {
    case "NumericLiteral":
      return "number";
    case "StringLiteral":
    case "JSXString":
    case "NoSubstitutionTemplate":
      return "string";
    case "RegularExpressionLiteral":
      return "regex";
    case "Punctuator":
    case "JSXPunctuator":
      return "punctuator";
    case "MultiLineComment":
    case "SingleLineComment":
      return "comment";
    case "Invalid":
    case "JSXInvalid":
      return "invalid";
    case "JSXIdentifier":
      return "jsxIdentifier";
    default:
      return "uncolored";
  }
};
function* tokenize2(text) {
  for (const token2 of js_tokens_default(text, {
    jsx: true
  })) {
    switch (token2.type) {
      case "TemplateHead":
        yield {
          type: "string",
          value: token2.value.slice(0, -2)
        };
        yield {
          type: "punctuator",
          value: "${"
        };
        break;
      case "TemplateMiddle":
        yield {
          type: "punctuator",
          value: "}"
        };
        yield {
          type: "string",
          value: token2.value.slice(1, -2)
        };
        yield {
          type: "punctuator",
          value: "${"
        };
        break;
      case "TemplateTail":
        yield {
          type: "punctuator",
          value: "}"
        };
        yield {
          type: "string",
          value: token2.value.slice(1)
        };
        break;
      default:
        yield {
          type: getTokenType(token2),
          value: token2.value
        };
    }
  }
}
function highlight(text) {
  if (text === "") return "";
  let highlighted = "";
  for (const {
    type,
    value
  } of tokenize2(text)) {
    if (type in defs) {
      highlighted += value.split(NEWLINE2).map((str) => defs[type](str)).join("\n");
    } else {
      highlighted += value;
    }
  }
  return highlighted;
}
function codeFrameColumns(rawLines, loc, opts2 = {}) {
  const shouldHighlight = opts2.forceColor || isColorSupported() && opts2.highlightCode;
  return _codeFrameColumns(rawLines, loc, opts2, shouldHighlight ? {
    defs,
    highlight
  } : void 0);
}

// node_modules/index-to-position/index.js
var getOffsets = ({
  oneBased,
  oneBasedLine = oneBased,
  oneBasedColumn = oneBased
} = {}) => [oneBasedLine ? 1 : 0, oneBasedColumn ? 1 : 0];
function getPosition(text, textIndex, options7) {
  const lineBreakBefore = textIndex === 0 ? -1 : text.lastIndexOf("\n", textIndex - 1);
  const [lineOffset, columnOffset] = getOffsets(options7);
  return {
    line: lineBreakBefore === -1 ? lineOffset : text.slice(0, lineBreakBefore + 1).match(/\n/g).length + lineOffset,
    column: textIndex - lineBreakBefore - 1 + columnOffset
  };
}
function indexToPosition(text, textIndex, options7) {
  if (typeof text !== "string") {
    throw new TypeError("Text parameter should be a string");
  }
  if (!Number.isInteger(textIndex)) {
    throw new TypeError("Index parameter should be an integer");
  }
  if (textIndex < 0 || textIndex > text.length) {
    throw new RangeError("Index out of bounds");
  }
  return getPosition(text, textIndex, options7);
}

// node_modules/parse-json/index.js
var getCodePoint = (character) => `\\u{${character.codePointAt(0).toString(16)}}`;
var JSONError = class _JSONError extends Error {
  name = "JSONError";
  fileName;
  #input;
  #jsonParseError;
  #message;
  #codeFrame;
  #rawCodeFrame;
  constructor(messageOrOptions) {
    if (typeof messageOrOptions === "string") {
      super();
      this.#message = messageOrOptions;
    } else {
      const { jsonParseError, fileName, input } = messageOrOptions;
      super(void 0, { cause: jsonParseError });
      this.#input = input;
      this.#jsonParseError = jsonParseError;
      this.fileName = fileName;
    }
    Error.captureStackTrace?.(this, _JSONError);
  }
  get message() {
    this.#message ?? (this.#message = `${addCodePointToUnexpectedToken(this.#jsonParseError.message)}${this.#input === "" ? " while parsing empty string" : ""}`);
    const { codeFrame } = this;
    return `${this.#message}${this.fileName ? ` in ${this.fileName}` : ""}${codeFrame ? `

${codeFrame}
` : ""}`;
  }
  set message(message) {
    this.#message = message;
  }
  #getCodeFrame(highlightCode) {
    if (!this.#jsonParseError) {
      return;
    }
    const input = this.#input;
    const location = getErrorLocation(input, this.#jsonParseError.message);
    if (!location) {
      return;
    }
    return codeFrameColumns(input, { start: location }, { highlightCode });
  }
  get codeFrame() {
    this.#codeFrame ?? (this.#codeFrame = this.#getCodeFrame(
      /* highlightCode */
      true
    ));
    return this.#codeFrame;
  }
  get rawCodeFrame() {
    this.#rawCodeFrame ?? (this.#rawCodeFrame = this.#getCodeFrame(
      /* highlightCode */
      false
    ));
    return this.#rawCodeFrame;
  }
};
var getErrorLocation = (string, message) => {
  const match2 = message.match(/in JSON at position (?<index>\d+)(?: \(line (?<line>\d+) column (?<column>\d+)\))?$/);
  if (!match2) {
    return;
  }
  const { index, line: line3, column: column2 } = match2.groups;
  if (line3 && column2) {
    return { line: Number(line3), column: Number(column2) - 1 };
  }
  return indexToPosition(string, Number(index), { oneBasedLine: true });
};
var addCodePointToUnexpectedToken = (message) => message.replace(
  // TODO[engine:node@>=20]: The token always quoted after Node.js 20
  /(?<=^Unexpected token )(?<quote>')?(.)\k<quote>/,
  (_, _quote, token2) => `"${token2}"(${getCodePoint(token2)})`
);
function parseJson(string, reviver, fileName) {
  if (typeof reviver === "string") {
    fileName = reviver;
    reviver = void 0;
  }
  try {
    return JSON.parse(string, reviver);
  } catch (error) {
    throw new JSONError({
      jsonParseError: error,
      fileName,
      input: string
    });
  }
}

// node_modules/smol-toml/dist/date.js
var DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;
var TomlDate = class _TomlDate extends Date {
  #hasDate = false;
  #hasTime = false;
  #offset = null;
  constructor(date) {
    let hasDate = true;
    let hasTime = true;
    let offset = "Z";
    if (typeof date === "string") {
      let match2 = date.match(DATE_TIME_RE);
      if (match2) {
        if (!match2[1]) {
          hasDate = false;
          date = `0000-01-01T${date}`;
        }
        hasTime = !!match2[2];
        hasTime && date[10] === " " && (date = date.replace(" ", "T"));
        if (match2[2] && +match2[2] > 23) {
          date = "";
        } else {
          offset = match2[3] || null;
          date = date.toUpperCase();
          if (!offset && hasTime)
            date += "Z";
        }
      } else {
        date = "";
      }
    }
    super(date);
    if (!isNaN(this.getTime())) {
      this.#hasDate = hasDate;
      this.#hasTime = hasTime;
      this.#offset = offset;
    }
  }
  isDateTime() {
    return this.#hasDate && this.#hasTime;
  }
  isLocal() {
    return !this.#hasDate || !this.#hasTime || !this.#offset;
  }
  isDate() {
    return this.#hasDate && !this.#hasTime;
  }
  isTime() {
    return this.#hasTime && !this.#hasDate;
  }
  isValid() {
    return this.#hasDate || this.#hasTime;
  }
  toISOString() {
    let iso = super.toISOString();
    if (this.isDate())
      return iso.slice(0, 10);
    if (this.isTime())
      return iso.slice(11, 23);
    if (this.#offset === null)
      return iso.slice(0, -1);
    if (this.#offset === "Z")
      return iso;
    let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
    offset = this.#offset[0] === "-" ? offset : -offset;
    let offsetDate = new Date(this.getTime() - offset * 6e4);
    return offsetDate.toISOString().slice(0, -1) + this.#offset;
  }
  static wrapAsOffsetDateTime(jsDate, offset = "Z") {
    let date = new _TomlDate(jsDate);
    date.#offset = offset;
    return date;
  }
  static wrapAsLocalDateTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#offset = null;
    return date;
  }
  static wrapAsLocalDate(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasTime = false;
    date.#offset = null;
    return date;
  }
  static wrapAsLocalTime(jsDate) {
    let date = new _TomlDate(jsDate);
    date.#hasDate = false;
    date.#offset = null;
    return date;
  }
};

// node_modules/smol-toml/dist/error.js
function getLineColFromPtr(string, ptr) {
  let lines = string.slice(0, ptr).split(/\r\n|\n|\r/g);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line3, column2) {
  let lines = string.split(/\r\n|\n|\r/g);
  let codeblock = "";
  let numberLen = (Math.log10(line3 + 1) | 0) + 1;
  for (let i = line3 - 1; i <= line3 + 1; i++) {
    let l = lines[i - 1];
    if (!l)
      continue;
    codeblock += i.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l;
    codeblock += "\n";
    if (i === line3) {
      codeblock += " ".repeat(numberLen + column2 + 2);
      codeblock += "^\n";
    }
  }
  return codeblock;
}
var TomlError = class extends Error {
  line;
  column;
  codeblock;
  constructor(message, options7) {
    const [line3, column2] = getLineColFromPtr(options7.toml, options7.ptr);
    const codeblock = makeCodeBlock(options7.toml, line3, column2);
    super(`Invalid TOML document: ${message}

${codeblock}`, options7);
    this.line = line3;
    this.column = column2;
    this.codeblock = codeblock;
  }
};

// node_modules/smol-toml/dist/primitive.js
var INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
var FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
var LEADING_ZERO = /^[+-]?0[0-9_]/;
function parseString2(str, ptr) {
  let c2 = str[ptr++];
  let first = c2;
  let isLiteral = c2 === "'";
  let isMultiline = c2 === str[ptr] && c2 === str[ptr + 1];
  if (isMultiline) {
    if (str[ptr += 2] === "\n")
      ptr++;
    else if (str[ptr] === "\r" && str[ptr + 1] === "\n")
      ptr += 2;
  }
  let parsed = "";
  let sliceStart = ptr;
  let state = 0;
  for (let i = ptr; i < str.length; i++) {
    c2 = str[i];
    if (isMultiline && (c2 === "\n" || c2 === "\r" && str[i + 1] === "\n")) {
      state = state && 3;
    } else if (c2 < " " && c2 !== "	" || c2 === "\x7F") {
      throw new TomlError("control characters are not allowed in strings", {
        toml: str,
        ptr: i
      });
    } else if ((!state || state === 3) && c2 === first && (!isMultiline || str[i + 1] === first && str[i + 2] === first)) {
      if (isMultiline) {
        if (str[i + 3] === first)
          i++;
        if (str[i + 3] === first)
          i++;
      }
      return [
        // If we're in a newline escape still, then there's nothing to add.
        // Also try to avoid concat if there's nothing to add to parsed, or nothing has been added to parsed.
        state ? parsed : parsed + str.slice(sliceStart, i),
        i + (isMultiline ? 3 : 1)
      ];
    } else if (!state) {
      if (!isLiteral && c2 === "\\") {
        parsed += str.slice(sliceStart, sliceStart = i);
        state = 1;
      }
    } else if (state === 1) {
      if (c2 === "x" || c2 === "u" || c2 === "U") {
        let value = 0;
        let len = c2 === "x" ? 2 : c2 === "u" ? 4 : 8;
        for (let j = 0; j < len; j++, i++) {
          let hex = str.charCodeAt(i + 1);
          let digit = (
            /* 0-9 */
            hex >= 48 && hex <= 57 ? hex - 48 : (
              /* A-F */
              hex >= 65 && hex <= 70 ? hex - 65 + 10 : (
                /* a-f */
                hex >= 97 && hex <= 102 ? hex - 97 + 10 : -1
              )
            )
          );
          if (digit < 0)
            throw new TomlError("invalid non-hex character in unicode escape", { toml: str, ptr: i + 1 });
          value = value << 4 | digit;
        }
        if (value < 0 || value > 1114111 || value >= 55296 && value <= 57343) {
          throw new TomlError("invalid unicode escape", { toml: str, ptr: i });
        }
        parsed += String.fromCodePoint(value);
        sliceStart = i + 1;
        state = 0;
      } else if (c2 === " " || c2 === "	") {
        state = 2;
      } else {
        if (c2 === "b")
          parsed += "\b";
        else if (c2 === "t")
          parsed += "	";
        else if (c2 === "n")
          parsed += "\n";
        else if (c2 === "f")
          parsed += "\f";
        else if (c2 === "r")
          parsed += "\r";
        else if (c2 === "e")
          parsed += "\x1B";
        else if (c2 === '"')
          parsed += '"';
        else if (c2 === "\\")
          parsed += "\\";
        else
          throw new TomlError("unrecognized escape sequence", { toml: str, ptr: i });
        sliceStart = i + 1;
        state = 0;
      }
    } else if (c2 !== " " && c2 !== "	") {
      if (state === 2) {
        throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
          toml: str,
          ptr: sliceStart
        });
      }
      state = !isLiteral && c2 === "\\" ? 1 : 0;
      sliceStart = i;
    }
  }
  throw new TomlError("unfinished string", { toml: str, ptr });
}
function parseValue(value, toml, ptr, integersAsBigInt) {
  if (value === "true")
    return true;
  if (value === "false")
    return false;
  if (value === "-inf")
    return -Infinity;
  if (value === "inf" || value === "+inf")
    return Infinity;
  if (value === "nan" || value === "+nan" || value === "-nan")
    return NaN;
  if (value === "-0")
    return integersAsBigInt ? 0n : 0;
  let isInt2 = INT_REGEX.test(value);
  if (isInt2 || FLOAT_REGEX.test(value)) {
    if (LEADING_ZERO.test(value)) {
      throw new TomlError("leading zeroes are not allowed", {
        toml,
        ptr
      });
    }
    value = value.replace(/_/g, "");
    let numeric2 = +value;
    if (isNaN(numeric2)) {
      throw new TomlError("invalid number", {
        toml,
        ptr
      });
    }
    if (isInt2) {
      if ((isInt2 = !Number.isSafeInteger(numeric2)) && !integersAsBigInt) {
        throw new TomlError("integer value cannot be represented losslessly", {
          toml,
          ptr
        });
      }
      if (isInt2 || integersAsBigInt === true)
        numeric2 = BigInt(value);
    }
    return numeric2;
  }
  const date = new TomlDate(value);
  if (!date.isValid()) {
    throw new TomlError("invalid value", {
      toml,
      ptr
    });
  }
  return date;
}

// node_modules/smol-toml/dist/util.js
function indexOfNewline(str, start = 0, end = str.length) {
  let idx = str.indexOf("\n", start);
  if (str[idx - 1] === "\r")
    idx--;
  return idx <= end ? idx : -1;
}
function skipComment(str, ptr) {
  for (let i = ptr; i < str.length; i++) {
    let c2 = str[i];
    if (c2 === "\n")
      return i;
    if (c2 === "\r" && str[i + 1] === "\n")
      return i + 1;
    if (c2 < " " && c2 !== "	" || c2 === "\x7F") {
      throw new TomlError("control characters are not allowed in comments", {
        toml: str,
        ptr
      });
    }
  }
  return str.length;
}
function skipVoid(str, ptr, banNewLines, banComments) {
  let c2;
  while (1) {
    while ((c2 = str[ptr]) === " " || c2 === "	" || !banNewLines && (c2 === "\n" || c2 === "\r" && str[ptr + 1] === "\n"))
      ptr++;
    if (banComments || c2 !== "#")
      break;
    ptr = skipComment(str, ptr);
  }
  return ptr;
}
function skipUntil(str, ptr, sep3, end, banNewLines = false) {
  if (!end) {
    ptr = indexOfNewline(str, ptr);
    return ptr < 0 ? str.length : ptr;
  }
  for (let i = ptr; i < str.length; i++) {
    let c2 = str[i];
    if (c2 === "#") {
      i = indexOfNewline(str, i);
    } else if (c2 === sep3) {
      return i + 1;
    } else if (c2 === end || banNewLines && (c2 === "\n" || c2 === "\r" && str[i + 1] === "\n")) {
      return i;
    }
  }
  throw new TomlError("cannot find end of structure", {
    toml: str,
    ptr
  });
}

// node_modules/smol-toml/dist/extract.js
function sliceAndTrimEndOf(str, startPtr, endPtr) {
  let value = str.slice(startPtr, endPtr);
  let commentIdx = value.indexOf("#");
  if (commentIdx > -1) {
    skipComment(str, commentIdx);
    value = value.slice(0, commentIdx);
  }
  return [value.trimEnd(), commentIdx];
}
function extractValue(str, ptr, end, depth, integersAsBigInt) {
  if (depth === 0) {
    throw new TomlError("document contains excessively nested structures. aborting.", {
      toml: str,
      ptr
    });
  }
  let c2 = str[ptr];
  if (c2 === "[" || c2 === "{") {
    let [value, endPtr2] = c2 === "[" ? parseArray(str, ptr, depth, integersAsBigInt) : parseInlineTable(str, ptr, depth, integersAsBigInt);
    if (end) {
      endPtr2 = skipVoid(str, endPtr2);
      if (str[endPtr2] === ",")
        endPtr2++;
      else if (str[endPtr2] !== end) {
        throw new TomlError("expected comma or end of structure", {
          toml: str,
          ptr: endPtr2
        });
      }
    }
    return [value, endPtr2];
  }
  if (c2 === '"' || c2 === "'") {
    let [parsed, endPtr2] = parseString2(str, ptr);
    if (end) {
      endPtr2 = skipVoid(str, endPtr2);
      if (str[endPtr2] && str[endPtr2] !== "," && str[endPtr2] !== end && str[endPtr2] !== "\n" && str[endPtr2] !== "\r") {
        throw new TomlError("unexpected character encountered", {
          toml: str,
          ptr: endPtr2
        });
      }
      if (str[endPtr2] === ",")
        endPtr2++;
    }
    return [parsed, endPtr2];
  }
  let endPtr = skipUntil(str, ptr, ",", end);
  let slice = sliceAndTrimEndOf(str, ptr, endPtr - (str[endPtr - 1] === "," ? 1 : 0));
  if (!slice[0]) {
    throw new TomlError("incomplete key-value declaration: no value specified", {
      toml: str,
      ptr
    });
  }
  if (end && slice[1] > -1) {
    endPtr = skipVoid(str, ptr + slice[1]);
    if (str[endPtr] === ",")
      endPtr++;
  }
  return [
    parseValue(slice[0], str, ptr, integersAsBigInt),
    endPtr
  ];
}

// node_modules/smol-toml/dist/struct.js
var KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
function parseKey(str, ptr, end = "=") {
  let dot = ptr - 1;
  let parsed = [];
  let endPtr = str.indexOf(end, ptr);
  if (endPtr < 0) {
    throw new TomlError("incomplete key-value: cannot find end of key", {
      toml: str,
      ptr
    });
  }
  do {
    let c2 = str[ptr = ++dot];
    if (c2 !== " " && c2 !== "	") {
      if (c2 === '"' || c2 === "'") {
        if (c2 === str[ptr + 1] && c2 === str[ptr + 2]) {
          throw new TomlError("multiline strings are not allowed in keys", {
            toml: str,
            ptr
          });
        }
        let [part, eos] = parseString2(str, ptr);
        dot = str.indexOf(".", eos);
        let strEnd = str.slice(eos, dot < 0 || dot > endPtr ? endPtr : dot);
        let newLine = indexOfNewline(strEnd);
        if (newLine > -1) {
          throw new TomlError("newlines are not allowed in keys", {
            toml: str,
            ptr: ptr + dot + newLine
          });
        }
        if (strEnd.trimStart()) {
          throw new TomlError("found extra tokens after the string part", {
            toml: str,
            ptr: eos
          });
        }
        if (endPtr < eos) {
          endPtr = str.indexOf(end, eos);
          if (endPtr < 0) {
            throw new TomlError("incomplete key-value: cannot find end of key", {
              toml: str,
              ptr
            });
          }
        }
        parsed.push(part);
      } else {
        dot = str.indexOf(".", ptr);
        let part = str.slice(ptr, dot < 0 || dot > endPtr ? endPtr : dot);
        if (!KEY_PART_RE.test(part)) {
          throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: str,
            ptr
          });
        }
        parsed.push(part.trimEnd());
      }
    }
  } while (dot + 1 && dot < endPtr);
  return [parsed, skipVoid(str, endPtr + 1, true, true)];
}
function parseInlineTable(str, ptr, depth, integersAsBigInt) {
  let res = {};
  let seen = /* @__PURE__ */ new Set();
  let c2;
  ptr++;
  while ((c2 = str[ptr++]) !== "}" && c2) {
    if (c2 === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c2 === "#")
      ptr = skipComment(str, ptr);
    else if (c2 !== " " && c2 !== "	" && c2 !== "\n" && c2 !== "\r") {
      let k;
      let t = res;
      let hasOwn2 = false;
      let [key2, keyEndPtr] = parseKey(str, ptr - 1);
      for (let i = 0; i < key2.length; i++) {
        if (i)
          t = hasOwn2 ? t[k] : t[k] = {};
        k = key2[i];
        if ((hasOwn2 = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) {
          throw new TomlError("trying to redefine an already defined value", {
            toml: str,
            ptr
          });
        }
        if (!hasOwn2 && k === "__proto__") {
          Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        }
      }
      if (hasOwn2) {
        throw new TomlError("trying to redefine an already defined value", {
          toml: str,
          ptr
        });
      }
      let [value, valueEndPtr] = extractValue(str, keyEndPtr, "}", depth - 1, integersAsBigInt);
      seen.add(value);
      t[k] = value;
      ptr = valueEndPtr;
    }
  }
  if (!c2) {
    throw new TomlError("unfinished table encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}
function parseArray(str, ptr, depth, integersAsBigInt) {
  let res = [];
  let c2;
  ptr++;
  while ((c2 = str[ptr++]) !== "]" && c2) {
    if (c2 === ",") {
      throw new TomlError("expected value, found comma", {
        toml: str,
        ptr: ptr - 1
      });
    } else if (c2 === "#")
      ptr = skipComment(str, ptr);
    else if (c2 !== " " && c2 !== "	" && c2 !== "\n" && c2 !== "\r") {
      let e = extractValue(str, ptr - 1, "]", depth - 1, integersAsBigInt);
      res.push(e[0]);
      ptr = e[1];
    }
  }
  if (!c2) {
    throw new TomlError("unfinished array encountered", {
      toml: str,
      ptr
    });
  }
  return [res, ptr];
}

// node_modules/smol-toml/dist/parse.js
function peekTable(key2, table, meta, type) {
  let t = table;
  let m = meta;
  let k;
  let hasOwn2 = false;
  let state;
  for (let i = 0; i < key2.length; i++) {
    if (i) {
      t = hasOwn2 ? t[k] : t[k] = {};
      m = (state = m[k]).c;
      if (type === 0 && (state.t === 1 || state.t === 2)) {
        return null;
      }
      if (state.t === 2) {
        let l = t.length - 1;
        t = t[l];
        m = m[l].c;
      }
    }
    k = key2[i];
    if ((hasOwn2 = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) {
      return null;
    }
    if (!hasOwn2) {
      if (k === "__proto__") {
        Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        Object.defineProperty(m, k, { enumerable: true, configurable: true, writable: true });
      }
      m[k] = {
        t: i < key2.length - 1 && type === 2 ? 3 : type,
        d: false,
        i: 0,
        c: {}
      };
    }
  }
  state = m[k];
  if (state.t !== type && !(type === 1 && state.t === 3)) {
    return null;
  }
  if (type === 2) {
    if (!state.d) {
      state.d = true;
      t[k] = [];
    }
    t[k].push(t = {});
    state.c[state.i++] = state = { t: 1, d: false, i: 0, c: {} };
  }
  if (state.d) {
    return null;
  }
  state.d = true;
  if (type === 1) {
    t = hasOwn2 ? t[k] : t[k] = {};
  } else if (type === 0 && hasOwn2) {
    return null;
  }
  return [k, t, state.c];
}
function parse7(toml, { maxDepth = 1e3, integersAsBigInt } = {}) {
  let res = {};
  let meta = {};
  let tbl = res;
  let m = meta;
  for (let ptr = skipVoid(toml, 0); ptr < toml.length; ) {
    if (toml[ptr] === "[") {
      let isTableArray = toml[++ptr] === "[";
      let k = parseKey(toml, ptr += +isTableArray, "]");
      if (isTableArray) {
        if (toml[k[1] - 1] !== "]") {
          throw new TomlError("expected end of table declaration", {
            toml,
            ptr: k[1] - 1
          });
        }
        k[1]++;
      }
      let p = peekTable(
        k[0],
        res,
        meta,
        isTableArray ? 2 : 1
        /* Type.EXPLICIT */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      m = p[2];
      tbl = p[1];
      ptr = k[1];
    } else {
      let k = parseKey(toml, ptr);
      let p = peekTable(
        k[0],
        tbl,
        m,
        0
        /* Type.DOTTED */
      );
      if (!p) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr
        });
      }
      let v = extractValue(toml, k[1], void 0, maxDepth, integersAsBigInt);
      p[1][p[0]] = v[0];
      ptr = v[1];
    }
    ptr = skipVoid(toml, ptr, true);
    if (toml[ptr] && toml[ptr] !== "\n" && toml[ptr] !== "\r") {
      throw new TomlError("each key-value declaration must be followed by an end-of-line", {
        toml,
        ptr
      });
    }
    ptr = skipVoid(toml, ptr);
  }
  return res;
}

// src/utilities/read-file.js
import fs3 from "fs/promises";
async function readFile2(file) {
  if (isUrlString(file)) {
    file = new URL(file);
  }
  try {
    return await fs3.readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    throw new Error(`Unable to read '${file}': ${error.message}`, {
      cause: error
    });
  }
}
var read_file_default = readFile2;

// src/config/prettier-config/loaders.js
async function readJson(file) {
  const content = await read_file_default(file);
  try {
    return parseJson(content);
  } catch (error) {
    error.message = `JSON Error in ${file}:
${error.message}`;
    throw error;
  }
}
async function importModuleDefault(file) {
  const module = await import(pathToFileURL2(file).href);
  return module.default;
}
async function readBunPackageJson(file) {
  try {
    return await readJson(file);
  } catch (error) {
    try {
      return await importModuleDefault(file);
    } catch {
    }
    throw error;
  }
}
var loadConfigFromPackageJson = process.versions.bun ? async function loadConfigFromBunPackageJson(file) {
  const { prettier } = await readBunPackageJson(file);
  return prettier;
} : async function loadConfigFromPackageJson2(file) {
  const { prettier } = await readJson(file);
  return prettier;
};
async function loadConfigFromPackageYaml(file) {
  const { prettier } = await loadYaml(file);
  return prettier;
}
var parseYaml;
async function loadYaml(file) {
  const content = await read_file_default(file);
  if (!parseYaml) {
    ({ __parsePrettierYamlConfig: parseYaml } = await import("./plugins/yaml.mjs"));
  }
  try {
    return parseYaml(content);
  } catch (error) {
    error.message = `YAML Error in ${file}:
${error.message}`;
    throw error;
  }
}
async function loadToml(file) {
  const content = await read_file_default(file);
  try {
    return parse7(content);
  } catch (error) {
    error.message = `TOML Error in ${file}:
${error.message}`;
    throw error;
  }
}
async function loadJson5(file) {
  const content = await read_file_default(file);
  try {
    return dist_default.parse(content);
  } catch (error) {
    error.message = `JSON5 Error in ${file}:
${error.message}`;
    throw error;
  }
}
var loaders = {
  ".toml": loadToml,
  ".json5": loadJson5,
  ".json": readJson,
  ".js": importModuleDefault,
  ".mjs": importModuleDefault,
  ".cjs": importModuleDefault,
  ".ts": importModuleDefault,
  ".mts": importModuleDefault,
  ".cts": importModuleDefault,
  ".yaml": loadYaml,
  ".yml": loadYaml,
  // No extension
  "": loadYaml
};
var loaders_default = loaders;

// src/config/prettier-config/config-searcher.js
var CONFIG_FILES = [
  {
    name: "package.json",
    async filter({ path: file }) {
      try {
        return Boolean(await loadConfigFromPackageJson(file));
      } catch {
        return false;
      }
    }
  },
  {
    name: "package.yaml",
    async filter({ path: file }) {
      try {
        return Boolean(await loadConfigFromPackageYaml(file));
      } catch {
        return false;
      }
    }
  },
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yml",
  ".prettierrc.yaml",
  ".prettierrc.json5",
  ".prettierrc.js",
  "prettier.config.js",
  ".prettierrc.ts",
  "prettier.config.ts",
  ".prettierrc.mjs",
  "prettier.config.mjs",
  ".prettierrc.mts",
  "prettier.config.mts",
  ".prettierrc.cjs",
  "prettier.config.cjs",
  ".prettierrc.cts",
  "prettier.config.cts",
  ".prettierrc.toml"
];
function getSearcher(stopDirectory) {
  return new FileSearcher(CONFIG_FILES, { stopDirectory });
}
var config_searcher_default = getSearcher;

// src/config/prettier-config/load-config.js
import path10 from "path";

// src/utilities/import-from-file.js
import { pathToFileURL as pathToFileURL4 } from "url";

// node_modules/import-meta-resolve/lib/resolve.js
import assert3 from "assert";
import { statSync, realpathSync } from "fs";
import process4 from "process";
import { fileURLToPath as fileURLToPath4, pathToFileURL as pathToFileURL3 } from "url";
import path9 from "path";
import { builtinModules } from "module";

// node_modules/import-meta-resolve/lib/get-format.js
import { fileURLToPath as fileURLToPath3 } from "url";

// node_modules/import-meta-resolve/lib/package-json-reader.js
import fs4 from "fs";
import path8 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// node_modules/import-meta-resolve/lib/errors.js
import v8 from "v8";
import assert2 from "assert";
import { format, inspect } from "util";
var own = {}.hasOwnProperty;
var classRegExp = /^([A-Z][a-z\d]*)+$/;
var kTypes = /* @__PURE__ */ new Set([
  "string",
  "function",
  "number",
  "object",
  // Accept 'Function' and 'Object' as alternative to the lower cased version.
  "Function",
  "Object",
  "boolean",
  "bigint",
  "symbol"
]);
var codes = {};
function formatList(array2, type = "and") {
  return array2.length < 3 ? array2.join(` ${type} `) : `${array2.slice(0, -1).join(", ")}, ${type} ${array2[array2.length - 1]}`;
}
var messages = /* @__PURE__ */ new Map();
var nodeInternalPrefix = "__node_internal_";
var userStackTraceLimit;
codes.ERR_INVALID_ARG_TYPE = createError(
  "ERR_INVALID_ARG_TYPE",
  /**
   * @param {string} name
   * @param {Array<string> | string} expected
   * @param {unknown} actual
   */
  (name, expected, actual) => {
    assert2.ok(typeof name === "string", "'name' must be a string");
    if (!Array.isArray(expected)) {
      expected = [expected];
    }
    let message = "The ";
    if (name.endsWith(" argument")) {
      message += `${name} `;
    } else {
      const type = name.includes(".") ? "property" : "argument";
      message += `"${name}" ${type} `;
    }
    message += "must be ";
    const types2 = [];
    const instances = [];
    const other = [];
    for (const value of expected) {
      assert2.ok(
        typeof value === "string",
        "All expected entries have to be of type string"
      );
      if (kTypes.has(value)) {
        types2.push(value.toLowerCase());
      } else if (classRegExp.exec(value) === null) {
        assert2.ok(
          value !== "object",
          'The value "object" should be written as "Object"'
        );
        other.push(value);
      } else {
        instances.push(value);
      }
    }
    if (instances.length > 0) {
      const pos2 = types2.indexOf("object");
      if (pos2 !== -1) {
        types2.slice(pos2, 1);
        instances.push("Object");
      }
    }
    if (types2.length > 0) {
      message += `${types2.length > 1 ? "one of type" : "of type"} ${formatList(
        types2,
        "or"
      )}`;
      if (instances.length > 0 || other.length > 0) message += " or ";
    }
    if (instances.length > 0) {
      message += `an instance of ${formatList(instances, "or")}`;
      if (other.length > 0) message += " or ";
    }
    if (other.length > 0) {
      if (other.length > 1) {
        message += `one of ${formatList(other, "or")}`;
      } else {
        if (other[0].toLowerCase() !== other[0]) message += "an ";
        message += `${other[0]}`;
      }
    }
    message += `. Received ${determineSpecificType(actual)}`;
    return message;
  },
  TypeError
);
codes.ERR_INVALID_MODULE_SPECIFIER = createError(
  "ERR_INVALID_MODULE_SPECIFIER",
  /**
   * @param {string} request
   * @param {string} reason
   * @param {string} [base]
   */
  (request, reason, base = void 0) => {
    return `Invalid module "${request}" ${reason}${base ? ` imported from ${base}` : ""}`;
  },
  TypeError
);
codes.ERR_INVALID_PACKAGE_CONFIG = createError(
  "ERR_INVALID_PACKAGE_CONFIG",
  /**
   * @param {string} path
   * @param {string} [base]
   * @param {string} [message]
   */
  (path17, base, message) => {
    return `Invalid package config ${path17}${base ? ` while importing ${base}` : ""}${message ? `. ${message}` : ""}`;
  },
  Error
);
codes.ERR_INVALID_PACKAGE_TARGET = createError(
  "ERR_INVALID_PACKAGE_TARGET",
  /**
   * @param {string} packagePath
   * @param {string} key
   * @param {unknown} target
   * @param {boolean} [isImport=false]
   * @param {string} [base]
   */
  (packagePath, key2, target, isImport = false, base = void 0) => {
    const relatedError = typeof target === "string" && !isImport && target.length > 0 && !target.startsWith("./");
    if (key2 === ".") {
      assert2.ok(isImport === false);
      return `Invalid "exports" main target ${JSON.stringify(target)} defined in the package config ${packagePath}package.json${base ? ` imported from ${base}` : ""}${relatedError ? '; targets must start with "./"' : ""}`;
    }
    return `Invalid "${isImport ? "imports" : "exports"}" target ${JSON.stringify(
      target
    )} defined for '${key2}' in the package config ${packagePath}package.json${base ? ` imported from ${base}` : ""}${relatedError ? '; targets must start with "./"' : ""}`;
  },
  Error
);
codes.ERR_MODULE_NOT_FOUND = createError(
  "ERR_MODULE_NOT_FOUND",
  /**
   * @param {string} path
   * @param {string} base
   * @param {boolean} [exactUrl]
   */
  (path17, base, exactUrl = false) => {
    return `Cannot find ${exactUrl ? "module" : "package"} '${path17}' imported from ${base}`;
  },
  Error
);
codes.ERR_NETWORK_IMPORT_DISALLOWED = createError(
  "ERR_NETWORK_IMPORT_DISALLOWED",
  "import of '%s' by %s is not supported: %s",
  Error
);
codes.ERR_PACKAGE_IMPORT_NOT_DEFINED = createError(
  "ERR_PACKAGE_IMPORT_NOT_DEFINED",
  /**
   * @param {string} specifier
   * @param {string} packagePath
   * @param {string} base
   */
  (specifier, packagePath, base) => {
    return `Package import specifier "${specifier}" is not defined${packagePath ? ` in package ${packagePath}package.json` : ""} imported from ${base}`;
  },
  TypeError
);
codes.ERR_PACKAGE_PATH_NOT_EXPORTED = createError(
  "ERR_PACKAGE_PATH_NOT_EXPORTED",
  /**
   * @param {string} packagePath
   * @param {string} subpath
   * @param {string} [base]
   */
  (packagePath, subpath, base = void 0) => {
    if (subpath === ".")
      return `No "exports" main defined in ${packagePath}package.json${base ? ` imported from ${base}` : ""}`;
    return `Package subpath '${subpath}' is not defined by "exports" in ${packagePath}package.json${base ? ` imported from ${base}` : ""}`;
  },
  Error
);
codes.ERR_UNSUPPORTED_DIR_IMPORT = createError(
  "ERR_UNSUPPORTED_DIR_IMPORT",
  "Directory import '%s' is not supported resolving ES modules imported from %s",
  Error
);
codes.ERR_UNSUPPORTED_RESOLVE_REQUEST = createError(
  "ERR_UNSUPPORTED_RESOLVE_REQUEST",
  'Failed to resolve module specifier "%s" from "%s": Invalid relative URL or base scheme is not hierarchical.',
  TypeError
);
codes.ERR_UNKNOWN_FILE_EXTENSION = createError(
  "ERR_UNKNOWN_FILE_EXTENSION",
  /**
   * @param {string} extension
   * @param {string} path
   */
  (extension, path17) => {
    return `Unknown file extension "${extension}" for ${path17}`;
  },
  TypeError
);
codes.ERR_INVALID_ARG_VALUE = createError(
  "ERR_INVALID_ARG_VALUE",
  /**
   * @param {string} name
   * @param {unknown} value
   * @param {string} [reason='is invalid']
   */
  (name, value, reason = "is invalid") => {
    let inspected = inspect(value);
    if (inspected.length > 128) {
      inspected = `${inspected.slice(0, 128)}...`;
    }
    const type = name.includes(".") ? "property" : "argument";
    return `The ${type} '${name}' ${reason}. Received ${inspected}`;
  },
  TypeError
  // Note: extra classes have been shaken out.
  // , RangeError
);
function createError(sym, value, constructor) {
  messages.set(sym, value);
  return makeNodeErrorWithCode(constructor, sym);
}
function makeNodeErrorWithCode(Base, key2) {
  return NodeError;
  function NodeError(...parameters) {
    const limit = Error.stackTraceLimit;
    if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = 0;
    const error = new Base();
    if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = limit;
    const message = getMessage(key2, parameters, error);
    Object.defineProperties(error, {
      // Note: no need to implement `kIsNodeError` symbol, would be hard,
      // probably.
      message: {
        value: message,
        enumerable: false,
        writable: true,
        configurable: true
      },
      toString: {
        /** @this {Error} */
        value() {
          return `${this.name} [${key2}]: ${this.message}`;
        },
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    captureLargerStackTrace(error);
    error.code = key2;
    return error;
  }
}
function isErrorStackTraceLimitWritable() {
  try {
    if (v8.startupSnapshot.isBuildingSnapshot()) {
      return false;
    }
  } catch {
  }
  const desc = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
  if (desc === void 0) {
    return Object.isExtensible(Error);
  }
  return own.call(desc, "writable") && desc.writable !== void 0 ? desc.writable : desc.set !== void 0;
}
function hideStackFrames(wrappedFunction) {
  const hidden = nodeInternalPrefix + wrappedFunction.name;
  Object.defineProperty(wrappedFunction, "name", { value: hidden });
  return wrappedFunction;
}
var captureLargerStackTrace = hideStackFrames(
  /**
   * @param {Error} error
   * @returns {Error}
   */
  // @ts-expect-error: fine
  function(error) {
    const stackTraceLimitIsWritable = isErrorStackTraceLimitWritable();
    if (stackTraceLimitIsWritable) {
      userStackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = Number.POSITIVE_INFINITY;
    }
    Error.captureStackTrace(error);
    if (stackTraceLimitIsWritable) Error.stackTraceLimit = userStackTraceLimit;
    return error;
  }
);
function getMessage(key2, parameters, self) {
  const message = messages.get(key2);
  assert2.ok(message !== void 0, "expected `message` to be found");
  if (typeof message === "function") {
    assert2.ok(
      message.length <= parameters.length,
      // Default options do not count.
      `Code: ${key2}; The provided arguments length (${parameters.length}) does not match the required ones (${message.length}).`
    );
    return Reflect.apply(message, self, parameters);
  }
  const regex = /%[dfijoOs]/g;
  let expectedLength = 0;
  while (regex.exec(message) !== null) expectedLength++;
  assert2.ok(
    expectedLength === parameters.length,
    `Code: ${key2}; The provided arguments length (${parameters.length}) does not match the required ones (${expectedLength}).`
  );
  if (parameters.length === 0) return message;
  parameters.unshift(message);
  return Reflect.apply(format, null, parameters);
}
function determineSpecificType(value) {
  if (value === null || value === void 0) {
    return String(value);
  }
  if (typeof value === "function" && value.name) {
    return `function ${value.name}`;
  }
  if (typeof value === "object") {
    if (value.constructor && value.constructor.name) {
      return `an instance of ${value.constructor.name}`;
    }
    return `${inspect(value, { depth: -1 })}`;
  }
  let inspected = inspect(value, { colors: false });
  if (inspected.length > 28) {
    inspected = `${inspected.slice(0, 25)}...`;
  }
  return `type ${typeof value} (${inspected})`;
}

// node_modules/import-meta-resolve/lib/package-json-reader.js
var hasOwnProperty = {}.hasOwnProperty;
var { ERR_INVALID_PACKAGE_CONFIG } = codes;
var cache = /* @__PURE__ */ new Map();
function read2(jsonPath, { base, specifier }) {
  const existing = cache.get(jsonPath);
  if (existing) {
    return existing;
  }
  let string;
  try {
    string = fs4.readFileSync(path8.toNamespacedPath(jsonPath), "utf8");
  } catch (error) {
    const exception = (
      /** @type {ErrnoException} */
      error
    );
    if (exception.code !== "ENOENT") {
      throw exception;
    }
  }
  const result = {
    exists: false,
    pjsonPath: jsonPath,
    main: void 0,
    name: void 0,
    type: "none",
    // Ignore unknown types for forwards compatibility
    exports: void 0,
    imports: void 0
  };
  if (string !== void 0) {
    let parsed;
    try {
      parsed = JSON.parse(string);
    } catch (error_) {
      const cause = (
        /** @type {ErrnoException} */
        error_
      );
      const error = new ERR_INVALID_PACKAGE_CONFIG(
        jsonPath,
        (base ? `"${specifier}" from ` : "") + fileURLToPath2(base || specifier),
        cause.message
      );
      error.cause = cause;
      throw error;
    }
    result.exists = true;
    if (hasOwnProperty.call(parsed, "name") && typeof parsed.name === "string") {
      result.name = parsed.name;
    }
    if (hasOwnProperty.call(parsed, "main") && typeof parsed.main === "string") {
      result.main = parsed.main;
    }
    if (hasOwnProperty.call(parsed, "exports")) {
      result.exports = parsed.exports;
    }
    if (hasOwnProperty.call(parsed, "imports")) {
      result.imports = parsed.imports;
    }
    if (hasOwnProperty.call(parsed, "type") && (parsed.type === "commonjs" || parsed.type === "module")) {
      result.type = parsed.type;
    }
  }
  cache.set(jsonPath, result);
  return result;
}
function getPackageScopeConfig(resolved) {
  let packageJSONUrl = new URL("package.json", resolved);
  while (true) {
    const packageJSONPath2 = packageJSONUrl.pathname;
    if (packageJSONPath2.endsWith("node_modules/package.json")) {
      break;
    }
    const packageConfig = read2(fileURLToPath2(packageJSONUrl), {
      specifier: resolved
    });
    if (packageConfig.exists) {
      return packageConfig;
    }
    const lastPackageJSONUrl = packageJSONUrl;
    packageJSONUrl = new URL("../package.json", packageJSONUrl);
    if (packageJSONUrl.pathname === lastPackageJSONUrl.pathname) {
      break;
    }
  }
  const packageJSONPath = fileURLToPath2(packageJSONUrl);
  return {
    pjsonPath: packageJSONPath,
    exists: false,
    type: "none"
  };
}
function getPackageType(url3) {
  return getPackageScopeConfig(url3).type;
}

// node_modules/import-meta-resolve/lib/get-format.js
var { ERR_UNKNOWN_FILE_EXTENSION } = codes;
var hasOwnProperty2 = {}.hasOwnProperty;
var extensionFormatMap = {
  // @ts-expect-error: hush.
  __proto__: null,
  ".cjs": "commonjs",
  ".js": "module",
  ".json": "json",
  ".mjs": "module"
};
function mimeToFormat(mime) {
  if (mime && /\s*(text|application)\/javascript\s*(;\s*charset=utf-?8\s*)?/i.test(mime))
    return "module";
  if (mime === "application/json") return "json";
  return null;
}
var protocolHandlers = {
  // @ts-expect-error: hush.
  __proto__: null,
  "data:": getDataProtocolModuleFormat,
  "file:": getFileProtocolModuleFormat,
  "http:": getHttpProtocolModuleFormat,
  "https:": getHttpProtocolModuleFormat,
  "node:"() {
    return "builtin";
  }
};
function getDataProtocolModuleFormat(parsed) {
  const { 1: mime } = /^([^/]+\/[^;,]+)[^,]*?(;base64)?,/.exec(
    parsed.pathname
  ) || [null, null, null];
  return mimeToFormat(mime);
}
function extname(url3) {
  const pathname = url3.pathname;
  let index = pathname.length;
  while (index--) {
    const code = pathname.codePointAt(index);
    if (code === 47) {
      return "";
    }
    if (code === 46) {
      return pathname.codePointAt(index - 1) === 47 ? "" : pathname.slice(index);
    }
  }
  return "";
}
function getFileProtocolModuleFormat(url3, _context, ignoreErrors) {
  const value = extname(url3);
  if (value === ".js") {
    const packageType = getPackageType(url3);
    if (packageType !== "none") {
      return packageType;
    }
    return "commonjs";
  }
  if (value === "") {
    const packageType = getPackageType(url3);
    if (packageType === "none" || packageType === "commonjs") {
      return "commonjs";
    }
    return "module";
  }
  const format3 = extensionFormatMap[value];
  if (format3) return format3;
  if (ignoreErrors) {
    return void 0;
  }
  const filepath = fileURLToPath3(url3);
  throw new ERR_UNKNOWN_FILE_EXTENSION(value, filepath);
}
function getHttpProtocolModuleFormat() {
}
function defaultGetFormatWithoutErrors(url3, context) {
  const protocol = url3.protocol;
  if (!hasOwnProperty2.call(protocolHandlers, protocol)) {
    return null;
  }
  return protocolHandlers[protocol](url3, context, true) || null;
}

// node_modules/import-meta-resolve/lib/utils.js
var { ERR_INVALID_ARG_VALUE } = codes;
var DEFAULT_CONDITIONS = Object.freeze(["node", "import"]);
var DEFAULT_CONDITIONS_SET = new Set(DEFAULT_CONDITIONS);
function getDefaultConditions() {
  return DEFAULT_CONDITIONS;
}
function getDefaultConditionsSet() {
  return DEFAULT_CONDITIONS_SET;
}
function getConditionsSet(conditions) {
  if (conditions !== void 0 && conditions !== getDefaultConditions()) {
    if (!Array.isArray(conditions)) {
      throw new ERR_INVALID_ARG_VALUE(
        "conditions",
        conditions,
        "expected an array"
      );
    }
    return new Set(conditions);
  }
  return getDefaultConditionsSet();
}

// node_modules/import-meta-resolve/lib/resolve.js
var RegExpPrototypeSymbolReplace = RegExp.prototype[Symbol.replace];
var {
  ERR_NETWORK_IMPORT_DISALLOWED,
  ERR_INVALID_MODULE_SPECIFIER,
  ERR_INVALID_PACKAGE_CONFIG: ERR_INVALID_PACKAGE_CONFIG2,
  ERR_INVALID_PACKAGE_TARGET,
  ERR_MODULE_NOT_FOUND,
  ERR_PACKAGE_IMPORT_NOT_DEFINED,
  ERR_PACKAGE_PATH_NOT_EXPORTED,
  ERR_UNSUPPORTED_DIR_IMPORT,
  ERR_UNSUPPORTED_RESOLVE_REQUEST
} = codes;
var own2 = {}.hasOwnProperty;
var invalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i;
var deprecatedInvalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
var invalidPackageNameRegEx = /^\.|%|\\/;
var patternRegEx = /\*/g;
var encodedSeparatorRegEx = /%2f|%5c/i;
var emittedPackageWarnings = /* @__PURE__ */ new Set();
var doubleSlashRegEx = /[/\\]{2}/;
function emitInvalidSegmentDeprecation(target, request, match2, packageJsonUrl, internal, base, isTarget) {
  if (process4.noDeprecation) {
    return;
  }
  const pjsonPath = fileURLToPath4(packageJsonUrl);
  const double = doubleSlashRegEx.exec(isTarget ? target : request) !== null;
  process4.emitWarning(
    `Use of deprecated ${double ? "double slash" : "leading or trailing slash matching"} resolving "${target}" for module request "${request}" ${request === match2 ? "" : `matched to "${match2}" `}in the "${internal ? "imports" : "exports"}" field module resolution of the package at ${pjsonPath}${base ? ` imported from ${fileURLToPath4(base)}` : ""}.`,
    "DeprecationWarning",
    "DEP0166"
  );
}
function emitLegacyIndexDeprecation(url3, packageJsonUrl, base, main) {
  if (process4.noDeprecation) {
    return;
  }
  const format3 = defaultGetFormatWithoutErrors(url3, { parentURL: base.href });
  if (format3 !== "module") return;
  const urlPath = fileURLToPath4(url3.href);
  const packagePath = fileURLToPath4(new URL(".", packageJsonUrl));
  const basePath = fileURLToPath4(base);
  if (!main) {
    process4.emitWarning(
      `No "main" or "exports" field defined in the package.json for ${packagePath} resolving the main entry point "${urlPath.slice(
        packagePath.length
      )}", imported from ${basePath}.
Default "index" lookups for the main are deprecated for ES modules.`,
      "DeprecationWarning",
      "DEP0151"
    );
  } else if (path9.resolve(packagePath, main) !== urlPath) {
    process4.emitWarning(
      `Package ${packagePath} has a "main" field set to "${main}", excluding the full filename and extension to the resolved file at "${urlPath.slice(
        packagePath.length
      )}", imported from ${basePath}.
 Automatic extension resolution of the "main" field is deprecated for ES modules.`,
      "DeprecationWarning",
      "DEP0151"
    );
  }
}
function tryStatSync(path17) {
  try {
    return statSync(path17);
  } catch {
  }
}
function fileExists(url3) {
  const stats = statSync(url3, { throwIfNoEntry: false });
  const isFile = stats ? stats.isFile() : void 0;
  return isFile === null || isFile === void 0 ? false : isFile;
}
function legacyMainResolve(packageJsonUrl, packageConfig, base) {
  let guess;
  if (packageConfig.main !== void 0) {
    guess = new URL(packageConfig.main, packageJsonUrl);
    if (fileExists(guess)) return guess;
    const tries2 = [
      `./${packageConfig.main}.js`,
      `./${packageConfig.main}.json`,
      `./${packageConfig.main}.node`,
      `./${packageConfig.main}/index.js`,
      `./${packageConfig.main}/index.json`,
      `./${packageConfig.main}/index.node`
    ];
    let i2 = -1;
    while (++i2 < tries2.length) {
      guess = new URL(tries2[i2], packageJsonUrl);
      if (fileExists(guess)) break;
      guess = void 0;
    }
    if (guess) {
      emitLegacyIndexDeprecation(
        guess,
        packageJsonUrl,
        base,
        packageConfig.main
      );
      return guess;
    }
  }
  const tries = ["./index.js", "./index.json", "./index.node"];
  let i = -1;
  while (++i < tries.length) {
    guess = new URL(tries[i], packageJsonUrl);
    if (fileExists(guess)) break;
    guess = void 0;
  }
  if (guess) {
    emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
    return guess;
  }
  throw new ERR_MODULE_NOT_FOUND(
    fileURLToPath4(new URL(".", packageJsonUrl)),
    fileURLToPath4(base)
  );
}
function finalizeResolution(resolved, base, preserveSymlinks) {
  if (encodedSeparatorRegEx.exec(resolved.pathname) !== null) {
    throw new ERR_INVALID_MODULE_SPECIFIER(
      resolved.pathname,
      'must not include encoded "/" or "\\" characters',
      fileURLToPath4(base)
    );
  }
  let filePath;
  try {
    filePath = fileURLToPath4(resolved);
  } catch (error) {
    const cause = (
      /** @type {ErrnoException} */
      error
    );
    Object.defineProperty(cause, "input", { value: String(resolved) });
    Object.defineProperty(cause, "module", { value: String(base) });
    throw cause;
  }
  const stats = tryStatSync(
    filePath.endsWith("/") ? filePath.slice(-1) : filePath
  );
  if (stats && stats.isDirectory()) {
    const error = new ERR_UNSUPPORTED_DIR_IMPORT(filePath, fileURLToPath4(base));
    error.url = String(resolved);
    throw error;
  }
  if (!stats || !stats.isFile()) {
    const error = new ERR_MODULE_NOT_FOUND(
      filePath || resolved.pathname,
      base && fileURLToPath4(base),
      true
    );
    error.url = String(resolved);
    throw error;
  }
  if (!preserveSymlinks) {
    const real = realpathSync(filePath);
    const { search, hash } = resolved;
    resolved = pathToFileURL3(real + (filePath.endsWith(path9.sep) ? "/" : ""));
    resolved.search = search;
    resolved.hash = hash;
  }
  return resolved;
}
function importNotDefined(specifier, packageJsonUrl, base) {
  return new ERR_PACKAGE_IMPORT_NOT_DEFINED(
    specifier,
    packageJsonUrl && fileURLToPath4(new URL(".", packageJsonUrl)),
    fileURLToPath4(base)
  );
}
function exportsNotFound(subpath, packageJsonUrl, base) {
  return new ERR_PACKAGE_PATH_NOT_EXPORTED(
    fileURLToPath4(new URL(".", packageJsonUrl)),
    subpath,
    base && fileURLToPath4(base)
  );
}
function throwInvalidSubpath(request, match2, packageJsonUrl, internal, base) {
  const reason = `request is not a valid match in pattern "${match2}" for the "${internal ? "imports" : "exports"}" resolution of ${fileURLToPath4(packageJsonUrl)}`;
  throw new ERR_INVALID_MODULE_SPECIFIER(
    request,
    reason,
    base && fileURLToPath4(base)
  );
}
function invalidPackageTarget(subpath, target, packageJsonUrl, internal, base) {
  target = typeof target === "object" && target !== null ? JSON.stringify(target, null, "") : `${target}`;
  return new ERR_INVALID_PACKAGE_TARGET(
    fileURLToPath4(new URL(".", packageJsonUrl)),
    subpath,
    target,
    internal,
    base && fileURLToPath4(base)
  );
}
function resolvePackageTargetString(target, subpath, match2, packageJsonUrl, base, pattern, internal, isPathMap, conditions) {
  if (subpath !== "" && !pattern && target[target.length - 1] !== "/")
    throw invalidPackageTarget(match2, target, packageJsonUrl, internal, base);
  if (!target.startsWith("./")) {
    if (internal && !target.startsWith("../") && !target.startsWith("/")) {
      let isURL2 = false;
      try {
        new URL(target);
        isURL2 = true;
      } catch {
      }
      if (!isURL2) {
        const exportTarget = pattern ? RegExpPrototypeSymbolReplace.call(
          patternRegEx,
          target,
          () => subpath
        ) : target + subpath;
        return packageResolve(exportTarget, packageJsonUrl, conditions);
      }
    }
    throw invalidPackageTarget(match2, target, packageJsonUrl, internal, base);
  }
  if (invalidSegmentRegEx.exec(target.slice(2)) !== null) {
    if (deprecatedInvalidSegmentRegEx.exec(target.slice(2)) === null) {
      if (!isPathMap) {
        const request = pattern ? match2.replace("*", () => subpath) : match2 + subpath;
        const resolvedTarget = pattern ? RegExpPrototypeSymbolReplace.call(
          patternRegEx,
          target,
          () => subpath
        ) : target;
        emitInvalidSegmentDeprecation(
          resolvedTarget,
          request,
          match2,
          packageJsonUrl,
          internal,
          base,
          true
        );
      }
    } else {
      throw invalidPackageTarget(match2, target, packageJsonUrl, internal, base);
    }
  }
  const resolved = new URL(target, packageJsonUrl);
  const resolvedPath = resolved.pathname;
  const packagePath = new URL(".", packageJsonUrl).pathname;
  if (!resolvedPath.startsWith(packagePath))
    throw invalidPackageTarget(match2, target, packageJsonUrl, internal, base);
  if (subpath === "") return resolved;
  if (invalidSegmentRegEx.exec(subpath) !== null) {
    const request = pattern ? match2.replace("*", () => subpath) : match2 + subpath;
    if (deprecatedInvalidSegmentRegEx.exec(subpath) === null) {
      if (!isPathMap) {
        const resolvedTarget = pattern ? RegExpPrototypeSymbolReplace.call(
          patternRegEx,
          target,
          () => subpath
        ) : target;
        emitInvalidSegmentDeprecation(
          resolvedTarget,
          request,
          match2,
          packageJsonUrl,
          internal,
          base,
          false
        );
      }
    } else {
      throwInvalidSubpath(request, match2, packageJsonUrl, internal, base);
    }
  }
  if (pattern) {
    return new URL(
      RegExpPrototypeSymbolReplace.call(
        patternRegEx,
        resolved.href,
        () => subpath
      )
    );
  }
  return new URL(subpath, resolved);
}
function isArrayIndex(key2) {
  const keyNumber = Number(key2);
  if (`${keyNumber}` !== key2) return false;
  return keyNumber >= 0 && keyNumber < 4294967295;
}
function resolvePackageTarget(packageJsonUrl, target, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions) {
  if (typeof target === "string") {
    return resolvePackageTargetString(
      target,
      subpath,
      packageSubpath,
      packageJsonUrl,
      base,
      pattern,
      internal,
      isPathMap,
      conditions
    );
  }
  if (Array.isArray(target)) {
    const targetList = target;
    if (targetList.length === 0) return null;
    let lastException;
    let i = -1;
    while (++i < targetList.length) {
      const targetItem = targetList[i];
      let resolveResult;
      try {
        resolveResult = resolvePackageTarget(
          packageJsonUrl,
          targetItem,
          subpath,
          packageSubpath,
          base,
          pattern,
          internal,
          isPathMap,
          conditions
        );
      } catch (error) {
        const exception = (
          /** @type {ErrnoException} */
          error
        );
        lastException = exception;
        if (exception.code === "ERR_INVALID_PACKAGE_TARGET") continue;
        throw error;
      }
      if (resolveResult === void 0) continue;
      if (resolveResult === null) {
        lastException = null;
        continue;
      }
      return resolveResult;
    }
    if (lastException === void 0 || lastException === null) {
      return null;
    }
    throw lastException;
  }
  if (typeof target === "object" && target !== null) {
    const keys = Object.getOwnPropertyNames(target);
    let i = -1;
    while (++i < keys.length) {
      const key2 = keys[i];
      if (isArrayIndex(key2)) {
        throw new ERR_INVALID_PACKAGE_CONFIG2(
          fileURLToPath4(packageJsonUrl),
          base,
          '"exports" cannot contain numeric property keys.'
        );
      }
    }
    i = -1;
    while (++i < keys.length) {
      const key2 = keys[i];
      if (key2 === "default" || conditions && conditions.has(key2)) {
        const conditionalTarget = (
          /** @type {unknown} */
          target[key2]
        );
        const resolveResult = resolvePackageTarget(
          packageJsonUrl,
          conditionalTarget,
          subpath,
          packageSubpath,
          base,
          pattern,
          internal,
          isPathMap,
          conditions
        );
        if (resolveResult === void 0) continue;
        return resolveResult;
      }
    }
    return null;
  }
  if (target === null) {
    return null;
  }
  throw invalidPackageTarget(
    packageSubpath,
    target,
    packageJsonUrl,
    internal,
    base
  );
}
function isConditionalExportsMainSugar(exports, packageJsonUrl, base) {
  if (typeof exports === "string" || Array.isArray(exports)) return true;
  if (typeof exports !== "object" || exports === null) return false;
  const keys = Object.getOwnPropertyNames(exports);
  let isConditionalSugar = false;
  let i = 0;
  let keyIndex = -1;
  while (++keyIndex < keys.length) {
    const key2 = keys[keyIndex];
    const currentIsConditionalSugar = key2 === "" || key2[0] !== ".";
    if (i++ === 0) {
      isConditionalSugar = currentIsConditionalSugar;
    } else if (isConditionalSugar !== currentIsConditionalSugar) {
      throw new ERR_INVALID_PACKAGE_CONFIG2(
        fileURLToPath4(packageJsonUrl),
        base,
        `"exports" cannot contain some keys starting with '.' and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only.`
      );
    }
  }
  return isConditionalSugar;
}
function emitTrailingSlashPatternDeprecation(match2, pjsonUrl, base) {
  if (process4.noDeprecation) {
    return;
  }
  const pjsonPath = fileURLToPath4(pjsonUrl);
  if (emittedPackageWarnings.has(pjsonPath + "|" + match2)) return;
  emittedPackageWarnings.add(pjsonPath + "|" + match2);
  process4.emitWarning(
    `Use of deprecated trailing slash pattern mapping "${match2}" in the "exports" field module resolution of the package at ${pjsonPath}${base ? ` imported from ${fileURLToPath4(base)}` : ""}. Mapping specifiers ending in "/" is no longer supported.`,
    "DeprecationWarning",
    "DEP0155"
  );
}
function packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions) {
  let exports = packageConfig.exports;
  if (isConditionalExportsMainSugar(exports, packageJsonUrl, base)) {
    exports = { ".": exports };
  }
  if (own2.call(exports, packageSubpath) && !packageSubpath.includes("*") && !packageSubpath.endsWith("/")) {
    const target = exports[packageSubpath];
    const resolveResult = resolvePackageTarget(
      packageJsonUrl,
      target,
      "",
      packageSubpath,
      base,
      false,
      false,
      false,
      conditions
    );
    if (resolveResult === null || resolveResult === void 0) {
      throw exportsNotFound(packageSubpath, packageJsonUrl, base);
    }
    return resolveResult;
  }
  let bestMatch = "";
  let bestMatchSubpath = "";
  const keys = Object.getOwnPropertyNames(exports);
  let i = -1;
  while (++i < keys.length) {
    const key2 = keys[i];
    const patternIndex = key2.indexOf("*");
    if (patternIndex !== -1 && packageSubpath.startsWith(key2.slice(0, patternIndex))) {
      if (packageSubpath.endsWith("/")) {
        emitTrailingSlashPatternDeprecation(
          packageSubpath,
          packageJsonUrl,
          base
        );
      }
      const patternTrailer = key2.slice(patternIndex + 1);
      if (packageSubpath.length >= key2.length && packageSubpath.endsWith(patternTrailer) && patternKeyCompare(bestMatch, key2) === 1 && key2.lastIndexOf("*") === patternIndex) {
        bestMatch = key2;
        bestMatchSubpath = packageSubpath.slice(
          patternIndex,
          packageSubpath.length - patternTrailer.length
        );
      }
    }
  }
  if (bestMatch) {
    const target = (
      /** @type {unknown} */
      exports[bestMatch]
    );
    const resolveResult = resolvePackageTarget(
      packageJsonUrl,
      target,
      bestMatchSubpath,
      bestMatch,
      base,
      true,
      false,
      packageSubpath.endsWith("/"),
      conditions
    );
    if (resolveResult === null || resolveResult === void 0) {
      throw exportsNotFound(packageSubpath, packageJsonUrl, base);
    }
    return resolveResult;
  }
  throw exportsNotFound(packageSubpath, packageJsonUrl, base);
}
function patternKeyCompare(a, b) {
  const aPatternIndex = a.indexOf("*");
  const bPatternIndex = b.indexOf("*");
  const baseLengthA = aPatternIndex === -1 ? a.length : aPatternIndex + 1;
  const baseLengthB = bPatternIndex === -1 ? b.length : bPatternIndex + 1;
  if (baseLengthA > baseLengthB) return -1;
  if (baseLengthB > baseLengthA) return 1;
  if (aPatternIndex === -1) return 1;
  if (bPatternIndex === -1) return -1;
  if (a.length > b.length) return -1;
  if (b.length > a.length) return 1;
  return 0;
}
function packageImportsResolve(name, base, conditions) {
  if (name === "#" || name.startsWith("#/") || name.endsWith("/")) {
    const reason = "is not a valid internal imports specifier name";
    throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, fileURLToPath4(base));
  }
  let packageJsonUrl;
  const packageConfig = getPackageScopeConfig(base);
  if (packageConfig.exists) {
    packageJsonUrl = pathToFileURL3(packageConfig.pjsonPath);
    const imports = packageConfig.imports;
    if (imports) {
      if (own2.call(imports, name) && !name.includes("*")) {
        const resolveResult = resolvePackageTarget(
          packageJsonUrl,
          imports[name],
          "",
          name,
          base,
          false,
          true,
          false,
          conditions
        );
        if (resolveResult !== null && resolveResult !== void 0) {
          return resolveResult;
        }
      } else {
        let bestMatch = "";
        let bestMatchSubpath = "";
        const keys = Object.getOwnPropertyNames(imports);
        let i = -1;
        while (++i < keys.length) {
          const key2 = keys[i];
          const patternIndex = key2.indexOf("*");
          if (patternIndex !== -1 && name.startsWith(key2.slice(0, -1))) {
            const patternTrailer = key2.slice(patternIndex + 1);
            if (name.length >= key2.length && name.endsWith(patternTrailer) && patternKeyCompare(bestMatch, key2) === 1 && key2.lastIndexOf("*") === patternIndex) {
              bestMatch = key2;
              bestMatchSubpath = name.slice(
                patternIndex,
                name.length - patternTrailer.length
              );
            }
          }
        }
        if (bestMatch) {
          const target = imports[bestMatch];
          const resolveResult = resolvePackageTarget(
            packageJsonUrl,
            target,
            bestMatchSubpath,
            bestMatch,
            base,
            true,
            true,
            false,
            conditions
          );
          if (resolveResult !== null && resolveResult !== void 0) {
            return resolveResult;
          }
        }
      }
    }
  }
  throw importNotDefined(name, packageJsonUrl, base);
}
function parsePackageName(specifier, base) {
  let separatorIndex = specifier.indexOf("/");
  let validPackageName = true;
  let isScoped = false;
  if (specifier[0] === "@") {
    isScoped = true;
    if (separatorIndex === -1 || specifier.length === 0) {
      validPackageName = false;
    } else {
      separatorIndex = specifier.indexOf("/", separatorIndex + 1);
    }
  }
  const packageName = separatorIndex === -1 ? specifier : specifier.slice(0, separatorIndex);
  if (invalidPackageNameRegEx.exec(packageName) !== null) {
    validPackageName = false;
  }
  if (!validPackageName) {
    throw new ERR_INVALID_MODULE_SPECIFIER(
      specifier,
      "is not a valid package name",
      fileURLToPath4(base)
    );
  }
  const packageSubpath = "." + (separatorIndex === -1 ? "" : specifier.slice(separatorIndex));
  return { packageName, packageSubpath, isScoped };
}
function packageResolve(specifier, base, conditions) {
  if (builtinModules.includes(specifier)) {
    return new URL("node:" + specifier);
  }
  const { packageName, packageSubpath, isScoped } = parsePackageName(
    specifier,
    base
  );
  const packageConfig = getPackageScopeConfig(base);
  if (packageConfig.exists) {
    const packageJsonUrl2 = pathToFileURL3(packageConfig.pjsonPath);
    if (packageConfig.name === packageName && packageConfig.exports !== void 0 && packageConfig.exports !== null) {
      return packageExportsResolve(
        packageJsonUrl2,
        packageSubpath,
        packageConfig,
        base,
        conditions
      );
    }
  }
  let packageJsonUrl = new URL(
    "./node_modules/" + packageName + "/package.json",
    base
  );
  let packageJsonPath = fileURLToPath4(packageJsonUrl);
  let lastPath;
  do {
    const stat2 = tryStatSync(packageJsonPath.slice(0, -13));
    if (!stat2 || !stat2.isDirectory()) {
      lastPath = packageJsonPath;
      packageJsonUrl = new URL(
        (isScoped ? "../../../../node_modules/" : "../../../node_modules/") + packageName + "/package.json",
        packageJsonUrl
      );
      packageJsonPath = fileURLToPath4(packageJsonUrl);
      continue;
    }
    const packageConfig2 = read2(packageJsonPath, { base, specifier });
    if (packageConfig2.exports !== void 0 && packageConfig2.exports !== null) {
      return packageExportsResolve(
        packageJsonUrl,
        packageSubpath,
        packageConfig2,
        base,
        conditions
      );
    }
    if (packageSubpath === ".") {
      return legacyMainResolve(packageJsonUrl, packageConfig2, base);
    }
    return new URL(packageSubpath, packageJsonUrl);
  } while (packageJsonPath.length !== lastPath.length);
  throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath4(base), false);
}
function isRelativeSpecifier(specifier) {
  if (specifier[0] === ".") {
    if (specifier.length === 1 || specifier[1] === "/") return true;
    if (specifier[1] === "." && (specifier.length === 2 || specifier[2] === "/")) {
      return true;
    }
  }
  return false;
}
function shouldBeTreatedAsRelativeOrAbsolutePath(specifier) {
  if (specifier === "") return false;
  if (specifier[0] === "/") return true;
  return isRelativeSpecifier(specifier);
}
function moduleResolve(specifier, base, conditions, preserveSymlinks) {
  if (conditions === void 0) {
    conditions = getConditionsSet();
  }
  const protocol = base.protocol;
  const isData = protocol === "data:";
  const isRemote = isData || protocol === "http:" || protocol === "https:";
  let resolved;
  if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
    try {
      resolved = new URL(specifier, base);
    } catch (error_) {
      const error = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
      error.cause = error_;
      throw error;
    }
  } else if (protocol === "file:" && specifier[0] === "#") {
    resolved = packageImportsResolve(specifier, base, conditions);
  } else {
    try {
      resolved = new URL(specifier);
    } catch (error_) {
      if (isRemote && !builtinModules.includes(specifier)) {
        const error = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
        error.cause = error_;
        throw error;
      }
      resolved = packageResolve(specifier, base, conditions);
    }
  }
  assert3.ok(resolved !== void 0, "expected to be defined");
  if (resolved.protocol !== "file:") {
    return resolved;
  }
  return finalizeResolution(resolved, base, preserveSymlinks);
}
function checkIfDisallowedImport(specifier, parsed, parsedParentURL) {
  if (parsedParentURL) {
    const parentProtocol = parsedParentURL.protocol;
    if (parentProtocol === "http:" || parentProtocol === "https:") {
      if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
        const parsedProtocol = parsed?.protocol;
        if (parsedProtocol && parsedProtocol !== "https:" && parsedProtocol !== "http:") {
          throw new ERR_NETWORK_IMPORT_DISALLOWED(
            specifier,
            parsedParentURL,
            "remote imports cannot import from a local location."
          );
        }
        return { url: parsed?.href || "" };
      }
      if (builtinModules.includes(specifier)) {
        throw new ERR_NETWORK_IMPORT_DISALLOWED(
          specifier,
          parsedParentURL,
          "remote imports cannot import from a local location."
        );
      }
      throw new ERR_NETWORK_IMPORT_DISALLOWED(
        specifier,
        parsedParentURL,
        "only relative and absolute specifiers are supported."
      );
    }
  }
}
function isURL(self) {
  return Boolean(
    self && typeof self === "object" && "href" in self && typeof self.href === "string" && "protocol" in self && typeof self.protocol === "string" && self.href && self.protocol
  );
}
function throwIfInvalidParentURL(parentURL) {
  if (parentURL === void 0) {
    return;
  }
  if (typeof parentURL !== "string" && !isURL(parentURL)) {
    throw new codes.ERR_INVALID_ARG_TYPE(
      "parentURL",
      ["string", "URL"],
      parentURL
    );
  }
}
function defaultResolve(specifier, context = {}) {
  const { parentURL } = context;
  assert3.ok(parentURL !== void 0, "expected `parentURL` to be defined");
  throwIfInvalidParentURL(parentURL);
  let parsedParentURL;
  if (parentURL) {
    try {
      parsedParentURL = new URL(parentURL);
    } catch {
    }
  }
  let parsed;
  let protocol;
  try {
    parsed = shouldBeTreatedAsRelativeOrAbsolutePath(specifier) ? new URL(specifier, parsedParentURL) : new URL(specifier);
    protocol = parsed.protocol;
    if (protocol === "data:") {
      return { url: parsed.href, format: null };
    }
  } catch {
  }
  const maybeReturn = checkIfDisallowedImport(
    specifier,
    parsed,
    parsedParentURL
  );
  if (maybeReturn) return maybeReturn;
  if (protocol === void 0 && parsed) {
    protocol = parsed.protocol;
  }
  if (protocol === "node:") {
    return { url: specifier };
  }
  if (parsed && parsed.protocol === "node:") return { url: specifier };
  const conditions = getConditionsSet(context.conditions);
  const url3 = moduleResolve(specifier, new URL(parentURL), conditions, false);
  return {
    // Do NOT cast `url` to a string: that will work even when there are real
    // problems, silencing them
    url: url3.href,
    format: defaultGetFormatWithoutErrors(url3, { parentURL })
  };
}

// node_modules/import-meta-resolve/index.js
function resolve3(specifier, parent) {
  if (!parent) {
    throw new Error(
      "Please pass `parent`: `import-meta-resolve` cannot ponyfill that"
    );
  }
  try {
    return defaultResolve(specifier, { parentURL: parent }).url;
  } catch (error) {
    const exception = (
      /** @type {ErrnoException} */
      error
    );
    if ((exception.code === "ERR_UNSUPPORTED_DIR_IMPORT" || exception.code === "ERR_MODULE_NOT_FOUND") && typeof exception.url === "string") {
      return exception.url;
    }
    throw error;
  }
}

// src/utilities/import-from-file.js
function importFromFile(specifier, parent) {
  const url3 = resolve3(specifier, pathToFileURL4(parent).href);
  return import(url3);
}
var import_from_file_default = importFromFile;

// src/utilities/require-from-file.js
import { createRequire } from "module";
function requireFromFile(id, parent) {
  const require2 = createRequire(parent);
  return require2(id);
}
var require_from_file_default = requireFromFile;

// src/config/prettier-config/load-external-config.js
var requireErrorCodesShouldBeIgnored = /* @__PURE__ */ new Set([
  "MODULE_NOT_FOUND",
  "ERR_REQUIRE_ESM",
  "ERR_PACKAGE_PATH_NOT_EXPORTED",
  "ERR_REQUIRE_ASYNC_MODULE"
]);
async function loadExternalConfig(externalConfig, configFile) {
  try {
    const required = require_from_file_default(externalConfig, configFile);
    if (process.features.require_module && required.__esModule) {
      return required.default;
    }
    return required;
  } catch (error) {
    if (!requireErrorCodesShouldBeIgnored.has(error?.code)) {
      throw error;
    }
  }
  const module = await import_from_file_default(externalConfig, configFile);
  return module.default;
}
var load_external_config_default = loadExternalConfig;

// src/config/prettier-config/load-config.js
async function loadConfig(configFile) {
  const { base: fileName, ext: extension } = path10.parse(configFile);
  const load = fileName === "package.json" ? loadConfigFromPackageJson : fileName === "package.yaml" ? loadConfigFromPackageYaml : loaders_default[extension];
  if (!load) {
    throw new Error(
      `No loader specified for extension "${extension || "noExt"}"`
    );
  }
  let config = await load(configFile);
  if (!config) {
    return;
  }
  if (typeof config === "string") {
    config = await load_external_config_default(config, configFile);
  }
  if (typeof config !== "object") {
    throw new TypeError(
      `Config is only allowed to be an object, but received ${typeof config} in "${configFile}"`
    );
  }
  delete config.$schema;
  return config;
}
var load_config_default = loadConfig;

// src/config/prettier-config/index.js
var loadCache = /* @__PURE__ */ new Map();
var searchCache = /* @__PURE__ */ new Map();
function clearPrettierConfigCache() {
  loadCache.clear();
  searchCache.clear();
}
function loadPrettierConfig(configFile, { shouldCache }) {
  configFile = path11.resolve(configFile);
  if (!shouldCache || !loadCache.has(configFile)) {
    loadCache.set(configFile, load_config_default(configFile));
  }
  return loadCache.get(configFile);
}
function getSearchFunction(stopDirectory) {
  stopDirectory = stopDirectory ? path11.resolve(stopDirectory) : void 0;
  return getOrInsertComputed(searchCache, stopDirectory, (stopDirectory2) => {
    const searcher2 = config_searcher_default(stopDirectory2);
    return searcher2.search.bind(searcher2);
  });
}
function searchPrettierConfig(startDirectory, options7 = {}) {
  startDirectory = startDirectory ? path11.resolve(startDirectory) : process.cwd();
  const stopDirectory = mockable_default.getPrettierConfigSearchStopDirectory();
  const search = getSearchFunction(stopDirectory);
  return search(startDirectory, { cache: options7.shouldCache });
}

// src/config/resolve-config.js
function clearCache() {
  clearPrettierConfigCache();
  clearEditorconfigCache();
}
function loadEditorconfig2(file, options7) {
  if (!file || !options7.editorconfig) {
    return;
  }
  const shouldCache = options7.useCache;
  return loadEditorconfig(file, {
    shouldCache
  });
}
async function loadPrettierConfig2(file, options7) {
  const shouldCache = options7.useCache;
  let configFile = options7.config;
  if (!configFile) {
    const directory = file ? path12.dirname(path12.resolve(file)) : void 0;
    configFile = await searchPrettierConfig(directory, {
      shouldCache
    });
  }
  if (!configFile) {
    return;
  }
  configFile = toPath(configFile);
  const config = await loadPrettierConfig(configFile, {
    shouldCache
  });
  return {
    config,
    configFile
  };
}
async function resolveConfig(fileUrlOrPath, options7) {
  options7 = {
    useCache: true,
    ...options7
  };
  const filePath = toPath(fileUrlOrPath);
  const [result, editorConfigured] = await Promise.all([loadPrettierConfig2(filePath, options7), loadEditorconfig2(filePath, options7)]);
  if (!result && !editorConfigured) {
    return null;
  }
  const merged = {
    ...editorConfigured,
    ...mergeOverrides(result, filePath)
  };
  if (Array.isArray(merged.plugins)) {
    merged.plugins = merged.plugins.map((value) => typeof value === "string" && value.startsWith(".") ? path12.resolve(path12.dirname(result.configFile), value) : value);
  }
  return merged;
}
async function resolveConfigFile(fileUrlOrPath) {
  const directory = fileUrlOrPath ? path12.dirname(path12.resolve(toPath(fileUrlOrPath))) : void 0;
  const result = await searchPrettierConfig(directory, {
    shouldCache: false
  });
  return result ?? null;
}
function mergeOverrides(configResult, filePath) {
  const {
    config,
    configFile
  } = configResult || {};
  const {
    overrides,
    ...options7
  } = config || {};
  if (filePath && overrides) {
    const relativeFilePath = path12.relative(path12.dirname(configFile), filePath);
    for (const override of overrides) {
      if (pathMatchesGlobs(relativeFilePath, override.files, override.excludeFiles)) {
        Object.assign(options7, override.options);
      }
    }
  }
  return options7;
}
function pathMatchesGlobs(filePath, patterns, excludedPatterns) {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];
  const {
    withSlashes = [],
    withoutSlashes = []
  } = function_object_group_by_default(patternList, (pattern) => pattern.includes("/") ? "withSlashes" : "withoutSlashes");
  return import_micromatch.default.isMatch(filePath, withoutSlashes, {
    ignore: excludedPatterns,
    basename: true,
    dot: true
  }) || import_micromatch.default.isMatch(filePath, withSlashes, {
    ignore: excludedPatterns,
    basename: false,
    dot: true
  });
}

// scripts/build/shims/shared.js
var OPTIONAL_OBJECT = 1;
var createMethodShim = (methodName, getImplementation) => (flags, object, ...arguments_) => {
  if (flags | OPTIONAL_OBJECT && (object === void 0 || object === null)) {
    return;
  }
  const implementation = getImplementation.call(object) ?? object[methodName];
  return implementation.apply(object, arguments_);
};

// scripts/build/shims/method-replace-all.js
var stringReplaceAll = String.prototype.replaceAll ?? function(pattern, replacement) {
  if (pattern.global) {
    return this.replace(pattern, replacement);
  }
  return this.split(pattern).join(replacement);
};
var replaceAll = /* @__PURE__ */ createMethodShim("replaceAll", function() {
  if (typeof this === "string") {
    return stringReplaceAll;
  }
});
var method_replace_all_default = replaceAll;

// src/main/core.js
import { builders as __doc_builders4, printer as __doc_printer } from "./doc.mjs";

// src/universal/assert.js
import { equal, ok, strictEqual } from "assert";

// src/common/end-of-line.js
var OPTION_CR = "cr";
var OPTION_CRLF = "crlf";
var OPTION_LF = "lf";
var DEFAULT_OPTION = OPTION_LF;
var CHARACTER_CR = "\r";
var CHARACTER_CRLF = "\r\n";
var CHARACTER_LF = "\n";
var DEFAULT_EOL = CHARACTER_LF;
function guessEndOfLine(text) {
  const index = text.indexOf(CHARACTER_CR);
  if (index !== -1) {
    return text.charAt(index + 1) === CHARACTER_LF ? OPTION_CRLF : OPTION_CR;
  }
  return DEFAULT_OPTION;
}
function convertEndOfLineOptionToCharacter(endOfLineOption) {
  return endOfLineOption === OPTION_CR ? CHARACTER_CR : endOfLineOption === OPTION_CRLF ? CHARACTER_CRLF : DEFAULT_EOL;
}
var regexps = /* @__PURE__ */ new Map([[CHARACTER_LF, /\n/g], [CHARACTER_CR, /\r/g], [CHARACTER_CRLF, /\r\n/g]]);
function countEndOfLineCharacters(text, endOfLineCharacter) {
  const regex = regexps.get(endOfLineCharacter);
  if (false) {
    ok(regex, `Unexpected 'endOfLineCharacter': ${JSON.stringify(endOfLineCharacter)}.`);
  }
  return text.match(regex)?.length ?? 0;
}
var END_OF_LINE_REGEXP = /\r\n?/g;
function normalizeEndOfLine(text) {
  return method_replace_all_default(
    /* OPTIONAL_OBJECT: false */
    0,
    text,
    END_OF_LINE_REGEXP,
    CHARACTER_LF
  );
}

// src/constants.js
var commentsPropertyInOptions = /* @__PURE__ */ Symbol.for("comments");

// scripts/build/shims/method-at.js
function stringOrArrayAt(index) {
  return this[index < 0 ? this.length + index : index];
}
var at = /* @__PURE__ */ createMethodShim("at", function() {
  if (Array.isArray(this) || typeof this === "string") {
    return stringOrArrayAt;
  }
});
var method_at_default = at;

// src/utilities/noop.js
var noop = () => {
};
var noop_default = noop;

// src/document/builders/types.js
var DOC_TYPE_CURSOR = (
  /** @type {const} */
  "cursor"
);
var DOC_TYPE_INDENT = (
  /** @type {const} */
  "indent"
);
var DOC_TYPE_ALIGN = (
  /** @type {const} */
  "align"
);
var DOC_TYPE_TRIM = (
  /** @type {const} */
  "trim"
);
var DOC_TYPE_GROUP = (
  /** @type {const} */
  "group"
);
var DOC_TYPE_FILL = (
  /** @type {const} */
  "fill"
);
var DOC_TYPE_IF_BREAK = (
  /** @type {const} */
  "if-break"
);
var DOC_TYPE_INDENT_IF_BREAK = (
  /** @type {const} */
  "indent-if-break"
);
var DOC_TYPE_LINE_SUFFIX = (
  /** @type {const} */
  "line-suffix"
);
var DOC_TYPE_LINE_SUFFIX_BOUNDARY = (
  /** @type {const} */
  "line-suffix-boundary"
);
var DOC_TYPE_LINE = (
  /** @type {const} */
  "line"
);
var DOC_TYPE_LABEL = (
  /** @type {const} */
  "label"
);
var DOC_TYPE_BREAK_PARENT = (
  /** @type {const} */
  "break-parent"
);

// src/document/utilities/index.js
function inheritLabel(doc2, fn) {
  return doc2.type === DOC_TYPE_LABEL ? {
    ...doc2,
    contents: fn(doc2.contents)
  } : fn(doc2);
}

// src/document/debug.js
function flattenDoc(doc2) {
  if (!doc2) {
    return "";
  }
  if (Array.isArray(doc2)) {
    const res = [];
    for (const part of doc2) {
      if (Array.isArray(part)) {
        res.push(...flattenDoc(part));
      } else {
        const flattened = flattenDoc(part);
        if (flattened !== "") {
          res.push(flattened);
        }
      }
    }
    return res;
  }
  if (doc2.type === DOC_TYPE_IF_BREAK) {
    return {
      ...doc2,
      breakContents: flattenDoc(doc2.breakContents),
      flatContents: flattenDoc(doc2.flatContents)
    };
  }
  if (doc2.type === DOC_TYPE_GROUP) {
    return {
      ...doc2,
      contents: flattenDoc(doc2.contents),
      expandedStates: doc2.expandedStates?.map(flattenDoc)
    };
  }
  if (doc2.type === DOC_TYPE_FILL) {
    return { type: "fill", parts: doc2.parts.map(flattenDoc) };
  }
  if (doc2.contents) {
    return { ...doc2, contents: flattenDoc(doc2.contents) };
  }
  return doc2;
}
function printDocToDebug(doc2) {
  const printedSymbols = /* @__PURE__ */ Object.create(null);
  const usedKeysForSymbols = /* @__PURE__ */ new Set();
  return printDoc(flattenDoc(doc2));
  function printDoc(doc3, index, parentParts) {
    if (typeof doc3 === "string") {
      return JSON.stringify(doc3);
    }
    if (Array.isArray(doc3)) {
      const printed = doc3.map(printDoc).filter(Boolean);
      return printed.length === 1 ? printed[0] : `[${printed.join(", ")}]`;
    }
    if (doc3.type === DOC_TYPE_LINE) {
      const withBreakParent = parentParts?.[index + 1]?.type === DOC_TYPE_BREAK_PARENT;
      if (doc3.literal) {
        return withBreakParent ? "literalline" : "literallineWithoutBreakParent";
      }
      if (doc3.hard) {
        return withBreakParent ? "hardline" : "hardlineWithoutBreakParent";
      }
      if (doc3.soft) {
        return "softline";
      }
      return "line";
    }
    if (doc3.type === DOC_TYPE_BREAK_PARENT) {
      const afterHardline = parentParts?.[index - 1]?.type === DOC_TYPE_LINE && parentParts[index - 1].hard;
      return afterHardline ? void 0 : "breakParent";
    }
    if (doc3.type === DOC_TYPE_TRIM) {
      return "trim";
    }
    if (doc3.type === DOC_TYPE_INDENT) {
      return "indent(" + printDoc(doc3.contents) + ")";
    }
    if (doc3.type === DOC_TYPE_ALIGN) {
      return doc3.n === Number.NEGATIVE_INFINITY ? "dedentToRoot(" + printDoc(doc3.contents) + ")" : doc3.n < 0 ? "dedent(" + printDoc(doc3.contents) + ")" : doc3.n.type === "root" ? "markAsRoot(" + printDoc(doc3.contents) + ")" : "align(" + JSON.stringify(doc3.n) + ", " + printDoc(doc3.contents) + ")";
    }
    if (doc3.type === DOC_TYPE_IF_BREAK) {
      return "ifBreak(" + printDoc(doc3.breakContents) + (doc3.flatContents ? ", " + printDoc(doc3.flatContents) : "") + (doc3.groupId ? (!doc3.flatContents ? ', ""' : "") + `, { groupId: ${printGroupId(doc3.groupId)} }` : "") + ")";
    }
    if (doc3.type === DOC_TYPE_INDENT_IF_BREAK) {
      const optionsParts = [];
      if (doc3.negate) {
        optionsParts.push("negate: true");
      }
      if (doc3.groupId) {
        optionsParts.push(`groupId: ${printGroupId(doc3.groupId)}`);
      }
      const options7 = optionsParts.length > 0 ? `, { ${optionsParts.join(", ")} }` : "";
      return `indentIfBreak(${printDoc(doc3.contents)}${options7})`;
    }
    if (doc3.type === DOC_TYPE_GROUP) {
      const optionsParts = [];
      if (doc3.break && doc3.break !== "propagated") {
        optionsParts.push("shouldBreak: true");
      }
      if (doc3.id) {
        optionsParts.push(`id: ${printGroupId(doc3.id)}`);
      }
      const options7 = optionsParts.length > 0 ? `, { ${optionsParts.join(", ")} }` : "";
      if (doc3.expandedStates) {
        return `conditionalGroup([${doc3.expandedStates.map((part) => printDoc(part)).join(",")}]${options7})`;
      }
      return `group(${printDoc(doc3.contents)}${options7})`;
    }
    if (doc3.type === DOC_TYPE_FILL) {
      return `fill([${doc3.parts.map((part) => printDoc(part)).join(", ")}])`;
    }
    if (doc3.type === DOC_TYPE_LINE_SUFFIX) {
      return "lineSuffix(" + printDoc(doc3.contents) + ")";
    }
    if (doc3.type === DOC_TYPE_LINE_SUFFIX_BOUNDARY) {
      return "lineSuffixBoundary";
    }
    if (doc3.type === DOC_TYPE_LABEL) {
      return `label(${JSON.stringify(doc3.label)}, ${printDoc(doc3.contents)})`;
    }
    if (doc3.type === DOC_TYPE_CURSOR) {
      return "cursor";
    }
    throw new Error("Unknown doc type " + doc3.type);
  }
  function printGroupId(id) {
    if (typeof id !== "symbol") {
      return JSON.stringify(String(id));
    }
    if (id in printedSymbols) {
      return printedSymbols[id];
    }
    const prefix = id.description || "symbol";
    for (let counter = 0; ; counter++) {
      const key2 = prefix + (counter > 0 ? ` #${counter}` : "");
      if (!usedKeysForSymbols.has(key2)) {
        usedKeysForSymbols.add(key2);
        return printedSymbols[id] = `Symbol.for(${JSON.stringify(key2)})`;
      }
    }
  }
}

// node_modules/emoji-regex/index.mjs
var emoji_regex_default = () => {
  return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};

// node_modules/get-east-asian-width/lookup-data.js
var fullwidthMinimalCodePoint = 12288;
var fullwidthMaximumCodePoint = 65510;
var fullwidthRanges = [12288, 12288, 65281, 65376, 65504, 65510];
var wideMinimalCodePoint = 4352;
var wideMaximumCodePoint = 262141;
var wideRanges = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101589, 101631, 101662, 101760, 101874, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110882, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110951, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128728, 128732, 128735, 128747, 128748, 128756, 128764, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129674, 129678, 129734, 129736, 129736, 129741, 129756, 129759, 129770, 129775, 129784, 131072, 196605, 196608, 262141];

// node_modules/get-east-asian-width/utilities.js
var isInRange = (ranges, codePoint) => {
  let low = 0;
  let high = Math.floor(ranges.length / 2) - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const i = mid * 2;
    if (codePoint < ranges[i]) {
      high = mid - 1;
    } else if (codePoint > ranges[i + 1]) {
      low = mid + 1;
    } else {
      return true;
    }
  }
  return false;
};

// node_modules/get-east-asian-width/lookup.js
var commonCjkCodePoint = 19968;
var [wideFastPathStart, wideFastPathEnd] = /* @__PURE__ */ findWideFastPathRange(wideRanges);
function findWideFastPathRange(ranges) {
  let fastPathStart = ranges[0];
  let fastPathEnd = ranges[1];
  for (let index = 0; index < ranges.length; index += 2) {
    const start = ranges[index];
    const end = ranges[index + 1];
    if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) {
      return [start, end];
    }
    if (end - start > fastPathEnd - fastPathStart) {
      fastPathStart = start;
      fastPathEnd = end;
    }
  }
  return [fastPathStart, fastPathEnd];
}
var isFullWidth = (codePoint) => {
  if (codePoint < fullwidthMinimalCodePoint || codePoint > fullwidthMaximumCodePoint) {
    return false;
  }
  return isInRange(fullwidthRanges, codePoint);
};
var isWide = (codePoint) => {
  if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) {
    return true;
  }
  if (codePoint < wideMinimalCodePoint || codePoint > wideMaximumCodePoint) {
    return false;
  }
  return isInRange(wideRanges, codePoint);
};

// node_modules/narrow-emojis/index.js
var narrowEmojiRegexp = /^(?:[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u2764\u27A1\u2934\u2935\u2B05-\u2B07]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF3\uDFF5\uDFF7]|\uD83D[\uDC3F\uDC41\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])$/;
var isNarrowEmojiCharacter = (character) => narrowEmojiRegexp.test(character);

// src/utilities/get-string-width.js
var notAsciiRegex = /[^\x20-\x7F]/;
function getStringWidth(text) {
  if (!text) {
    return 0;
  }
  if (!notAsciiRegex.test(text)) {
    return text.length;
  }
  let width = 0;
  text = text.replace(emoji_regex_default(), (character) => {
    width += isNarrowEmojiCharacter(character) ? 1 : 2;
    return "";
  });
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) {
      continue;
    }
    if (codePoint >= 768 && codePoint <= 879) {
      continue;
    }
    if (codePoint >= 65024 && codePoint <= 65039) {
      continue;
    }
    width += isFullWidth(codePoint) || isWide(codePoint) ? 2 : 1;
  }
  return width;
}
var get_string_width_default = getStringWidth;

// src/utilities/get-alignment-size.js
function getAlignmentSize(text, tabWidth, startIndex = 0) {
  let size = 0;
  for (let i = startIndex; i < text.length; ++i) {
    if (text[i] === "	") {
      size = size + tabWidth - size % tabWidth;
    } else {
      size++;
    }
  }
  return size;
}
var get_alignment_size_default = getAlignmentSize;

// src/main/ast-to-doc.js
import { builders as __doc_builders3 } from "./doc.mjs";

// src/common/ast-path.js
var AstPath = class {
  constructor(value) {
    this.stack = [value];
  }
  /** @type {string | null} */
  get key() {
    const {
      stack: stack2,
      siblings
    } = this;
    return method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      stack2,
      siblings === null ? -2 : -4
    ) ?? null;
  }
  /** @type {number | null} */
  get index() {
    return this.siblings === null ? null : method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      this.stack,
      -2
    );
  }
  /** @type {object} */
  get node() {
    return method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      this.stack,
      -1
    );
  }
  /** @type {object | null} */
  get parent() {
    return this.getNode(1);
  }
  /** @type {object | null} */
  get grandparent() {
    return this.getNode(2);
  }
  /** @type {boolean} */
  get isInArray() {
    return this.siblings !== null;
  }
  /** @type {object[] | null} */
  get siblings() {
    const {
      stack: stack2
    } = this;
    const maybeArray = method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      stack2,
      -3
    );
    return Array.isArray(maybeArray) ? maybeArray : null;
  }
  /** @type {object | null} */
  get next() {
    const {
      siblings
    } = this;
    return siblings === null ? null : siblings[this.index + 1];
  }
  /** @type {object | null} */
  get previous() {
    const {
      siblings
    } = this;
    return siblings === null ? null : siblings[this.index - 1];
  }
  /** @type {boolean} */
  get isFirst() {
    return this.index === 0;
  }
  /** @type {boolean} */
  get isLast() {
    const {
      siblings,
      index
    } = this;
    return siblings !== null && index === siblings.length - 1;
  }
  /** @type {boolean} */
  get isRoot() {
    return this.stack.length === 1;
  }
  /** @type {object} */
  get root() {
    return this.stack[0];
  }
  /** @type {object[]} */
  get ancestors() {
    return [...this.#getAncestors()];
  }
  // The name of the current property is always the penultimate element of
  // this.stack, and always a string/number/symbol.
  getName() {
    const {
      stack: stack2
    } = this;
    const {
      length
    } = stack2;
    if (length > 1) {
      return method_at_default(
        /* OPTIONAL_OBJECT: false */
        0,
        stack2,
        -2
      );
    }
    return null;
  }
  // The value of the current property is always the final element of
  // this.stack.
  getValue() {
    return method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      this.stack,
      -1
    );
  }
  getNode(count = 0) {
    const stackIndex = this.#getNodeStackIndex(count);
    return stackIndex === -1 ? null : this.stack[stackIndex];
  }
  getParentNode(count = 0) {
    return this.getNode(count + 1);
  }
  #getNodeStackIndex(count) {
    const {
      stack: stack2
    } = this;
    for (let i = stack2.length - 1; i >= 0; i -= 2) {
      if (!Array.isArray(stack2[i]) && --count < 0) {
        return i;
      }
    }
    return -1;
  }
  // Temporarily push properties named by string arguments given after the
  // callback function onto this.stack, then call the callback with a
  // reference to this (modified) AstPath object. Note that the stack will
  // be restored to its original state after the callback is finished, so it
  // is probably a mistake to retain a reference to the path.
  call(callback, ...names) {
    const {
      stack: stack2
    } = this;
    const {
      length
    } = stack2;
    let value = method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      stack2,
      -1
    );
    for (const name of names) {
      value = value?.[name];
      stack2.push(name, value);
    }
    try {
      return callback(this);
    } finally {
      stack2.length = length;
    }
  }
  /**
   * @template {(path: AstPath) => any} T
   * @param {T} callback
   * @param {number} [count=0]
   * @returns {ReturnType<T>}
   */
  callParent(callback, count = 0) {
    const stackIndex = this.#getNodeStackIndex(count + 1);
    const parentValues = this.stack.splice(stackIndex + 1);
    try {
      return callback(this);
    } finally {
      this.stack.push(...parentValues);
    }
  }
  // Similar to AstPath.prototype.call, except that the value obtained by
  // accessing this.getValue()[name1][name2]... should be array. The
  // callback will be called with a reference to this path object for each
  // element of the array.
  each(callback, ...names) {
    const {
      stack: stack2
    } = this;
    const {
      length
    } = stack2;
    let value = method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      stack2,
      -1
    );
    for (const name of names) {
      value = value[name];
      stack2.push(name, value);
    }
    try {
      for (let i = 0; i < value.length; ++i) {
        stack2.push(i, value[i]);
        callback(this, i, value);
        stack2.length -= 2;
      }
    } finally {
      stack2.length = length;
    }
  }
  // Similar to AstPath.prototype.each, except that the results of the
  // callback function invocations are stored in an array and returned at
  // the end of the iteration.
  map(callback, ...names) {
    const result = [];
    this.each((path17, index, value) => {
      result[index] = callback(path17, index, value);
    }, ...names);
    return result;
  }
  /**
   * @param {...(
   *   | ((node: any, name: string | null, number: number | null) => boolean)
   *   | undefined
   * )} predicates
   */
  match(...predicates) {
    let stackPointer = this.stack.length - 1;
    let name = null;
    let node = this.stack[stackPointer--];
    for (const predicate of predicates) {
      if (node === void 0) {
        return false;
      }
      let number = null;
      if (typeof name === "number") {
        number = name;
        name = this.stack[stackPointer--];
        node = this.stack[stackPointer--];
      }
      if (predicate && !predicate(node, name, number)) {
        return false;
      }
      name = this.stack[stackPointer--];
      node = this.stack[stackPointer--];
    }
    return true;
  }
  /**
   * Traverses the ancestors of the current node heading toward the tree root
   * until it finds a node that matches the provided predicate function. Will
   * return the first matching ancestor. If no such node exists, returns undefined.
   * @param {(node: any) => boolean} predicate
   * @internal Unstable API. Don't use in plugins for now.
   */
  findAncestor(predicate) {
    for (const node of this.#getAncestors()) {
      if (predicate(node)) {
        return node;
      }
    }
  }
  /**
   * Traverses the ancestors of the current node heading toward the tree root
   * until it finds a node that matches the provided predicate function.
   * returns true if matched node found.
   * @param {(node: any) => boolean} predicate
   * @returns {boolean}
   * @internal Unstable API. Don't use in plugins for now.
   */
  hasAncestor(predicate) {
    for (const node of this.#getAncestors()) {
      if (predicate(node)) {
        return true;
      }
    }
    return false;
  }
  *#getAncestors() {
    const {
      stack: stack2
    } = this;
    for (let index = stack2.length - 3; index >= 0; index -= 2) {
      const value = stack2[index];
      if (!Array.isArray(value)) {
        yield value;
      }
    }
  }
};
var ast_path_default = AstPath;

// src/utilities/is-non-empty-array.js
function isNonEmptyArray(object) {
  return Array.isArray(object) && object.length > 0;
}
var is_non_empty_array_default = isNonEmptyArray;

// src/utilities/is-object.js
function isObject(object) {
  return object !== null && typeof object === "object";
}
var is_object_default = isObject;

// src/utilities/skip.js
function skip(characters) {
  return (text, startIndex, options7) => {
    if (startIndex === false) {
      return false;
    }
    const backwards = Boolean(options7?.backwards);
    const { length } = text;
    let cursor2 = startIndex;
    while (cursor2 >= 0 && cursor2 < length) {
      const character = text.charAt(cursor2);
      if (characters instanceof RegExp) {
        if (!characters.test(character)) {
          return cursor2;
        }
      } else if (!characters.includes(character)) {
        return cursor2;
      }
      backwards ? cursor2-- : cursor2++;
    }
    if (cursor2 === -1 || cursor2 === length) {
      return cursor2;
    }
    return false;
  };
}
var skipWhitespace = skip(/\s/);
var skipSpaces = skip(" 	");
var skipToLineEnd = skip(",; 	");
var skipEverythingButNewLine = skip(/[^\n\r]/);

// src/utilities/skip-newline.js
var isNewlineCharacter = (character) => character === "\n" || character === "\r" || character === "\u2028" || character === "\u2029";
function skipNewline(text, startIndex, options7) {
  if (startIndex === false) {
    return false;
  }
  const backwards = Boolean(options7?.backwards);
  const character = text.charAt(startIndex);
  if (backwards) {
    if (text.charAt(startIndex - 1) === "\r" && character === "\n") {
      return startIndex - 2;
    }
    if (isNewlineCharacter(character)) {
      return startIndex - 1;
    }
  } else {
    if (character === "\r" && text.charAt(startIndex + 1) === "\n") {
      return startIndex + 2;
    }
    if (isNewlineCharacter(character)) {
      return startIndex + 1;
    }
  }
  return startIndex;
}
var skip_newline_default = skipNewline;

// src/utilities/has-newline.js
function hasNewline(text, startIndex, options7 = {}) {
  const idx = skipSpaces(
    text,
    options7.backwards ? startIndex - 1 : startIndex,
    options7
  );
  const idx2 = skip_newline_default(text, idx, options7);
  return idx !== idx2;
}
var has_newline_default = hasNewline;

// src/utilities/ast.js
function* getChildren(node, options7) {
  const { getVisitorKeys, filter: filter2 = () => true } = options7;
  const isMatchedNode = (node2) => is_object_default(node2) && filter2(node2);
  for (const key2 of getVisitorKeys(node)) {
    const value = node[key2];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isMatchedNode(child)) {
          yield child;
        }
      }
    } else if (isMatchedNode(value)) {
      yield value;
    }
  }
}
function* getDescendants(node, options7) {
  const queue = [node];
  for (let index = 0; index < queue.length; index++) {
    const node2 = queue[index];
    for (const child of getChildren(node2, options7)) {
      yield child;
      queue.push(child);
    }
  }
}
function isLeaf(node, options7) {
  return getChildren(node, options7).next().done;
}

// src/main/utilities/get-sorted-child-nodes.js
function getSortedChildNodesWithoutCache(node, ancestors, options7) {
  const { filter: filter2 } = options7;
  if (!filter2) {
    return [];
  }
  let childAncestors;
  const childNodes = (options7.getChildren?.(node, options7) ?? [
    ...getChildren(node, { getVisitorKeys: options7.getVisitorKeys })
  ]).flatMap((child) => {
    childAncestors ?? (childAncestors = [node, ...ancestors]);
    return filter2(child, childAncestors) ? [child] : getSortedChildNodes(child, childAncestors, options7);
  });
  const { locStart, locEnd } = options7;
  childNodes.sort(
    (nodeA, nodeB) => locStart(nodeA) - locStart(nodeB) || locEnd(nodeA) - locEnd(nodeB)
  );
  return childNodes;
}
function getSortedChildNodes(node, ancestors, options7) {
  return getOrInsertComputed(
    options7.cache,
    node,
    (node2) => getSortedChildNodesWithoutCache(node2, ancestors, options7)
  );
}
var get_sorted_child_nodes_default = getSortedChildNodes;

// src/main/comments/utilities.js
function describeNodeForDebugging(node) {
  const nodeType = node.type || node.kind || "(unknown type)";
  let nodeName = String(
    node.name || node.id && (typeof node.id === "object" ? node.id.name : node.id) || node.key && (typeof node.key === "object" ? node.key.name : node.key) || node.value && (typeof node.value === "object" ? "" : String(node.value)) || node.operator || ""
  );
  if (nodeName.length > 20) {
    nodeName = nodeName.slice(0, 19) + "\u2026";
  }
  return nodeType + (nodeName ? " " + nodeName : "");
}
function addCommentHelper(node, comment) {
  const comments = node.comments ?? (node.comments = []);
  comments.push(comment);
  comment.printed = false;
  comment.nodeDescription = describeNodeForDebugging(node);
}
function addLeadingComment(node, comment) {
  comment.leading = true;
  comment.trailing = false;
  addCommentHelper(node, comment);
}
function addDanglingComment(node, comment, marker) {
  comment.leading = false;
  comment.trailing = false;
  if (marker) {
    comment.marker = marker;
  }
  addCommentHelper(node, comment);
}
function addTrailingComment(node, comment) {
  comment.leading = false;
  comment.trailing = true;
  addCommentHelper(node, comment);
}

// src/main/comments/attach.js
var childNodesCache = /* @__PURE__ */ new WeakMap();
function decorateComment(node, comment, options7, enclosingNode, ancestors = []) {
  const { locStart, locEnd } = options7;
  const commentStart = locStart(comment);
  const commentEnd = locEnd(comment);
  const childNodes = get_sorted_child_nodes_default(node, ancestors, {
    cache: childNodesCache,
    locStart,
    locEnd,
    getVisitorKeys: options7.getVisitorKeys,
    filter: options7.printer.canAttachComment,
    getChildren: options7.printer.getCommentChildNodes
  });
  let precedingNode;
  let followingNode;
  let left = 0;
  let right = childNodes.length;
  while (left < right) {
    const middle = left + right >> 1;
    const child = childNodes[middle];
    const start = locStart(child);
    const end = locEnd(child);
    if (start <= commentStart && commentEnd <= end) {
      return decorateComment(child, comment, options7, child, [
        child,
        ...ancestors
      ]);
    }
    if (end <= commentStart) {
      precedingNode = child;
      left = middle + 1;
      continue;
    }
    if (commentEnd <= start) {
      followingNode = child;
      right = middle;
      continue;
    }
    throw new Error("Comment location overlaps with node location");
  }
  if (enclosingNode?.type === "TemplateLiteral") {
    const { quasis } = enclosingNode;
    const commentIndex = findExpressionIndexForComment(
      quasis,
      comment,
      options7
    );
    if (precedingNode && findExpressionIndexForComment(quasis, precedingNode, options7) !== commentIndex) {
      precedingNode = null;
    }
    if (followingNode && findExpressionIndexForComment(quasis, followingNode, options7) !== commentIndex) {
      followingNode = null;
    }
  }
  return { enclosingNode, precedingNode, followingNode };
}
var returnFalse = () => false;
function attachComments(ast, options7) {
  const { comments } = ast;
  delete ast.comments;
  if (!is_non_empty_array_default(comments) || !options7.printer.canAttachComment) {
    return;
  }
  const tiesToBreak = [];
  const {
    printer: {
      features: { experimental_avoidAstMutation: avoidAstMutation },
      handleComments = {}
    },
    originalText: text
  } = options7;
  const {
    ownLine: handleOwnLineComment = returnFalse,
    endOfLine: handleEndOfLineComment = returnFalse,
    remaining: handleRemainingComment = returnFalse
  } = handleComments;
  const decoratedComments = comments.map((comment, index) => ({
    ...decorateComment(ast, comment, options7),
    comment,
    text,
    options: options7,
    ast,
    isLastComment: comments.length - 1 === index,
    // TODO: Move placement here
    placement: void 0
  }));
  const attachPropertiesToComment = !avoidAstMutation;
  for (const [index, context] of decoratedComments.entries()) {
    const {
      comment,
      precedingNode,
      enclosingNode,
      followingNode,
      text: text2,
      options: options8,
      ast: ast2,
      isLastComment
    } = context;
    const placement = isOwnLineComment(text2, options8, decoratedComments, index) ? "ownLine" : isEndOfLineComment(text2, options8, decoratedComments, index) ? "endOfLine" : "remaining";
    let args;
    if (avoidAstMutation) {
      context.placement = placement;
      args = [context];
    } else {
      args = [comment, text2, options8, ast2, isLastComment];
    }
    if (attachPropertiesToComment) {
      comment.enclosingNode = enclosingNode;
      comment.precedingNode = precedingNode;
      comment.followingNode = followingNode;
    }
    comment.placement = placement;
    if (placement === "ownLine") {
      if (handleOwnLineComment(...args)) {
      } else if (followingNode) {
        addLeadingComment(followingNode, comment);
      } else if (precedingNode) {
        addTrailingComment(precedingNode, comment);
      } else if (enclosingNode) {
        addDanglingComment(enclosingNode, comment);
      } else {
        addDanglingComment(ast2, comment);
      }
    } else if (placement === "endOfLine") {
      if (handleEndOfLineComment(...args)) {
      } else if (precedingNode) {
        addTrailingComment(precedingNode, comment);
      } else if (followingNode) {
        addLeadingComment(followingNode, comment);
      } else if (enclosingNode) {
        addDanglingComment(enclosingNode, comment);
      } else {
        addDanglingComment(ast2, comment);
      }
    } else {
      if (handleRemainingComment(...args)) {
      } else if (precedingNode && followingNode) {
        const tieCount = tiesToBreak.length;
        if (tieCount > 0) {
          const lastTie = tiesToBreak[tieCount - 1];
          if (lastTie.followingNode !== followingNode) {
            breakTies(tiesToBreak, options8);
          }
        }
        tiesToBreak.push(context);
      } else if (precedingNode) {
        addTrailingComment(precedingNode, comment);
      } else if (followingNode) {
        addLeadingComment(followingNode, comment);
      } else if (enclosingNode) {
        addDanglingComment(enclosingNode, comment);
      } else {
        addDanglingComment(ast2, comment);
      }
    }
  }
  breakTies(tiesToBreak, options7);
  if (attachPropertiesToComment) {
    for (const comment of comments) {
      delete comment.precedingNode;
      delete comment.enclosingNode;
      delete comment.followingNode;
    }
  }
}
var isAllEmptyAndNoLineBreak = (text) => !/[\S\n\u2028\u2029]/.test(text);
function isOwnLineComment(text, options7, decoratedComments, commentIndex) {
  const { comment, precedingNode } = decoratedComments[commentIndex];
  const { locStart, locEnd } = options7;
  let start = locStart(comment);
  if (precedingNode) {
    for (let index = commentIndex - 1; index >= 0; index--) {
      const { comment: comment2, precedingNode: currentCommentPrecedingNode } = decoratedComments[index];
      if (currentCommentPrecedingNode !== precedingNode || !isAllEmptyAndNoLineBreak(text.slice(locEnd(comment2), start))) {
        break;
      }
      start = locStart(comment2);
    }
  }
  return has_newline_default(text, start, { backwards: true });
}
function isEndOfLineComment(text, options7, decoratedComments, commentIndex) {
  const { comment, followingNode } = decoratedComments[commentIndex];
  const { locStart, locEnd } = options7;
  let end = locEnd(comment);
  if (followingNode) {
    for (let index = commentIndex + 1; index < decoratedComments.length; index++) {
      const { comment: comment2, followingNode: currentCommentFollowingNode } = decoratedComments[index];
      if (currentCommentFollowingNode !== followingNode || !isAllEmptyAndNoLineBreak(text.slice(end, locStart(comment2)))) {
        break;
      }
      end = locEnd(comment2);
    }
  }
  return has_newline_default(text, end);
}
function breakTies(tiesToBreak, options7) {
  const tieCount = tiesToBreak.length;
  if (tieCount === 0) {
    return;
  }
  const { precedingNode, followingNode } = tiesToBreak[0];
  let gapEndPos = options7.locStart(followingNode);
  let indexOfFirstLeadingComment;
  for (indexOfFirstLeadingComment = tieCount; indexOfFirstLeadingComment > 0; --indexOfFirstLeadingComment) {
    const {
      comment,
      precedingNode: currentCommentPrecedingNode,
      followingNode: currentCommentFollowingNode
    } = tiesToBreak[indexOfFirstLeadingComment - 1];
    strictEqual(currentCommentPrecedingNode, precedingNode);
    strictEqual(currentCommentFollowingNode, followingNode);
    const gap = options7.originalText.slice(options7.locEnd(comment), gapEndPos);
    if (options7.printer.isGap?.(gap, options7) ?? /^[\s(]*$/.test(gap)) {
      gapEndPos = options7.locStart(comment);
    } else {
      break;
    }
  }
  for (const [i, { comment }] of tiesToBreak.entries()) {
    if (i < indexOfFirstLeadingComment) {
      addTrailingComment(precedingNode, comment);
    } else {
      addLeadingComment(followingNode, comment);
    }
  }
  for (const node of [precedingNode, followingNode]) {
    if (node.comments && node.comments.length > 1) {
      node.comments.sort((a, b) => options7.locStart(a) - options7.locStart(b));
    }
  }
  tiesToBreak.length = 0;
}
function findExpressionIndexForComment(quasis, comment, options7) {
  const startPos = options7.locStart(comment) - 1;
  for (let i = 1; i < quasis.length; ++i) {
    if (startPos < options7.locStart(quasis[i])) {
      return i - 1;
    }
  }
  return 0;
}

// src/main/comments/print.js
import { builders as __doc_builders } from "./doc.mjs";

// src/utilities/is-previous-line-empty.js
function isPreviousLineEmpty(text, startIndex) {
  let idx = startIndex - 1;
  idx = skipSpaces(text, idx, { backwards: true });
  idx = skip_newline_default(text, idx, { backwards: true });
  idx = skipSpaces(text, idx, { backwards: true });
  const idx2 = skip_newline_default(text, idx, { backwards: true });
  return idx !== idx2;
}
var is_previous_line_empty_default = isPreviousLineEmpty;

// src/main/comments/print.js
var {
  breakParent,
  hardline,
  indent,
  join: join4,
  line: line2,
  lineSuffix
} = __doc_builders;
var returnTrue = () => true;
function printComment(path17, options7) {
  const comment = path17.node;
  comment.printed = true;
  return options7.printer.printComment(path17, options7);
}
function printLeadingComment(path17, options7) {
  const comment = path17.node;
  const parts = [printComment(path17, options7)];
  const {
    printer,
    originalText,
    locStart,
    locEnd
  } = options7;
  const isBlock = printer.isBlockComment?.(comment);
  if (isBlock) {
    let lineBreak = " ";
    if (has_newline_default(originalText, locEnd(comment))) {
      if (has_newline_default(originalText, locStart(comment), {
        backwards: true
      })) {
        lineBreak = hardline;
      } else {
        lineBreak = line2;
      }
    }
    parts.push(lineBreak);
  } else {
    parts.push(hardline);
  }
  const index = skip_newline_default(originalText, skipSpaces(originalText, locEnd(comment)));
  if (index !== false && has_newline_default(originalText, index)) {
    parts.push(hardline);
  }
  return parts;
}
function printTrailingComment(path17, options7, previousComment) {
  const comment = path17.node;
  const printed = printComment(path17, options7);
  const {
    printer,
    originalText,
    locStart
  } = options7;
  const isBlock = printer.isBlockComment?.(comment);
  if (previousComment?.hasLineSuffix && !previousComment?.isBlock || has_newline_default(originalText, locStart(comment), {
    backwards: true
  })) {
    const isLineBeforeEmpty = is_previous_line_empty_default(originalText, locStart(comment));
    return {
      doc: lineSuffix([hardline, isLineBeforeEmpty ? hardline : "", printed]),
      isBlock,
      hasLineSuffix: true
    };
  }
  if (!isBlock || previousComment?.hasLineSuffix) {
    return {
      doc: [lineSuffix([" ", printed]), breakParent],
      isBlock,
      hasLineSuffix: true
    };
  }
  return {
    doc: [" ", printed],
    isBlock,
    hasLineSuffix: false
  };
}
function printLeadingComments(path17, options7, printOptions) {
  const printed = options7[/* @__PURE__ */ Symbol.for("printedComments")];
  const filter2 = printOptions?.filter ?? returnTrue;
  const leadingComments = new Set(path17.node?.comments?.filter((comment) => !printed?.has(comment) && comment.leading && filter2(comment)));
  if (leadingComments.size === 0) {
    return "";
  }
  return path17.map(({
    node: comment
  }) => leadingComments.has(comment) ? printLeadingComment(path17, options7) : "", "comments").filter(Boolean);
}
function printTrailingComments(path17, options7, printOptions) {
  const comments = path17.node?.comments;
  const trailingComments = new Set(comments?.filter((comment) => comment.trailing));
  const printed = options7[/* @__PURE__ */ Symbol.for("printedComments")];
  const filter2 = printOptions?.filter ?? returnTrue;
  const commentsShouldPrint = new Set(comments?.filter((comment) => trailingComments.has(comment) && !printed?.has(comment) && filter2(comment)));
  if (commentsShouldPrint.size === 0) {
    return "";
  }
  const docs = [];
  let printedTrailingComment;
  path17.each(({
    node: comment
  }) => {
    if (!trailingComments.has(comment)) {
      return;
    }
    printedTrailingComment = printTrailingComment(path17, options7, printedTrailingComment);
    if (commentsShouldPrint.has(comment)) {
      docs.push(printedTrailingComment.doc);
    }
  }, "comments");
  return docs;
}
function printComments(path17, doc2, options7, printOptions) {
  const leading = printLeadingComments(path17, options7, printOptions);
  const trailing = printTrailingComments(path17, options7, printOptions);
  return leading || trailing ? inheritLabel(doc2, (doc3) => [leading, doc3, trailing]) : doc2;
}
function ensureAllCommentsPrinted(options7) {
  const {
    [commentsPropertyInOptions]: comments,
    [/* @__PURE__ */ Symbol.for("printedComments")]: printedComments
  } = options7;
  for (const comment of comments) {
    if (!comment.printed && !printedComments.has(comment)) {
      throw new Error('Comment "' + comment.value.trim() + '" was not printed. Please report this error!');
    }
    delete comment.printed;
  }
}

// src/main/create-print-pre-check-function.js
var create_print_pre_check_function_default = true ? () => noop_default : createPrintPreCheckFunction;

// src/main/multiparser.js
import { utils as __doc_utils } from "./doc.mjs";

// src/main/core-options.evaluate.js
var core_options_evaluate_default = {
  "checkIgnorePragma": {
    "category": "Special",
    "type": "boolean",
    "default": false,
    "description": "Check whether the file's first docblock comment contains '@noprettier' or '@noformat' to determine if it should be formatted.",
    "cliCategory": "Other"
  },
  "cursorOffset": {
    "category": "Special",
    "type": "int",
    "default": -1,
    "range": {
      "start": -1,
      "end": Infinity,
      "step": 1
    },
    "description": "Print (to stderr) where a cursor at the given position would move to after formatting.",
    "cliCategory": "Editor"
  },
  "endOfLine": {
    "category": "Global",
    "type": "choice",
    "default": "lf",
    "description": "Which end of line characters to apply.",
    "choices": [
      {
        "value": "lf",
        "description": "Line Feed only (\\n), common on Linux and macOS as well as inside git repos"
      },
      {
        "value": "crlf",
        "description": "Carriage Return + Line Feed characters (\\r\\n), common on Windows"
      },
      {
        "value": "cr",
        "description": "Carriage Return character only (\\r), used very rarely"
      },
      {
        "value": "auto",
        "description": "Maintain existing\n(mixed values within one file are normalised by looking at what's used after the first line)"
      }
    ]
  },
  "filepath": {
    "category": "Special",
    "type": "path",
    "description": "Specify the input filepath. This will be used to do parser inference.",
    "cliName": "stdin-filepath",
    "cliCategory": "Other",
    "cliDescription": "Path to the file to pretend that stdin comes from."
  },
  "insertPragma": {
    "category": "Special",
    "type": "boolean",
    "default": false,
    "description": "Insert @format pragma into file's first docblock comment.",
    "cliCategory": "Other"
  },
  "parser": {
    "category": "Global",
    "type": "choice",
    "default": void 0,
    "description": "Which parser to use.",
    "exception": (value) => typeof value === "string" || typeof value === "function",
    "choices": [
      {
        "value": "flow",
        "description": "Flow"
      },
      {
        "value": "babel",
        "description": "JavaScript"
      },
      {
        "value": "babel-flow",
        "description": "Flow"
      },
      {
        "value": "babel-ts",
        "description": "TypeScript"
      },
      {
        "value": "typescript",
        "description": "TypeScript"
      },
      {
        "value": "acorn",
        "description": "JavaScript"
      },
      {
        "value": "espree",
        "description": "JavaScript"
      },
      {
        "value": "meriyah",
        "description": "JavaScript"
      },
      {
        "value": "css",
        "description": "CSS"
      },
      {
        "value": "less",
        "description": "Less"
      },
      {
        "value": "scss",
        "description": "SCSS"
      },
      {
        "value": "json",
        "description": "JSON"
      },
      {
        "value": "json5",
        "description": "JSON5"
      },
      {
        "value": "jsonc",
        "description": "JSON with Comments"
      },
      {
        "value": "json-stringify",
        "description": "JSON.stringify"
      },
      {
        "value": "graphql",
        "description": "GraphQL"
      },
      {
        "value": "markdown",
        "description": "Markdown"
      },
      {
        "value": "mdx",
        "description": "MDX"
      },
      {
        "value": "vue",
        "description": "Vue"
      },
      {
        "value": "yaml",
        "description": "YAML"
      },
      {
        "value": "glimmer",
        "description": "Ember / Handlebars"
      },
      {
        "value": "html",
        "description": "HTML"
      },
      {
        "value": "angular",
        "description": "Angular"
      },
      {
        "value": "lwc",
        "description": "Lightning Web Components"
      },
      {
        "value": "mjml",
        "description": "MJML"
      }
    ]
  },
  "plugins": {
    "type": "path",
    "array": true,
    "default": [
      {
        "value": []
      }
    ],
    "category": "Global",
    "description": "Add a plugin. Multiple plugins can be passed as separate `--plugin`s.",
    "exception": (value) => typeof value === "string" || typeof value === "object",
    "cliName": "plugin",
    "cliCategory": "Config"
  },
  "printWidth": {
    "category": "Global",
    "type": "int",
    "default": 80,
    "description": "The line length where Prettier will try wrap.",
    "range": {
      "start": 0,
      "end": Infinity,
      "step": 1
    }
  },
  "rangeEnd": {
    "category": "Special",
    "type": "int",
    "default": Infinity,
    "range": {
      "start": 0,
      "end": Infinity,
      "step": 1
    },
    "description": "Format code ending at a given character offset (exclusive).\nThe range will extend forwards to the end of the selected statement.",
    "cliCategory": "Editor"
  },
  "rangeStart": {
    "category": "Special",
    "type": "int",
    "default": 0,
    "range": {
      "start": 0,
      "end": Infinity,
      "step": 1
    },
    "description": "Format code starting at a given character offset.\nThe range will extend backwards to the start of the first line containing the selected statement.",
    "cliCategory": "Editor"
  },
  "requirePragma": {
    "category": "Special",
    "type": "boolean",
    "default": false,
    "description": "Require either '@prettier' or '@format' to be present in the file's first docblock comment in order for it to be formatted.",
    "cliCategory": "Other"
  },
  "tabWidth": {
    "type": "int",
    "category": "Global",
    "default": 2,
    "description": "Number of spaces per indentation level.",
    "range": {
      "start": 0,
      "end": Infinity,
      "step": 1
    }
  },
  "useTabs": {
    "category": "Global",
    "type": "boolean",
    "default": false,
    "description": "Indent with tabs instead of spaces."
  },
  "embeddedLanguageFormatting": {
    "category": "Global",
    "type": "choice",
    "default": "auto",
    "description": "Control how Prettier formats quoted code embedded in the file.",
    "choices": [
      {
        "value": "auto",
        "description": "Format embedded code if Prettier can automatically identify it."
      },
      {
        "value": "off",
        "description": "Never automatically format embedded code."
      }
    ]
  }
};

// src/main/support.js
function getSupportInfo({
  plugins: plugins2 = [],
  showDeprecated = false
} = {}) {
  const languages = plugins2.flatMap((plugin) => plugin.languages ?? []);
  const options7 = [];
  for (const option of normalizeOptionSettings(Object.assign({}, ...plugins2.map(({
    options: options8
  }) => options8), core_options_evaluate_default))) {
    if (!showDeprecated && option.deprecated) {
      continue;
    }
    if (Array.isArray(option.choices)) {
      if (!showDeprecated) {
        option.choices = option.choices.filter((choice) => !choice.deprecated);
      }
      if (option.name === "parser") {
        option.choices = [...option.choices, ...collectParsersFromLanguages(option.choices, languages, plugins2)];
      }
    }
    option.pluginDefaults = Object.fromEntries(plugins2.filter((plugin) => plugin.defaultOptions?.[option.name] !== void 0).map((plugin) => [plugin.name, plugin.defaultOptions[option.name]]));
    options7.push(option);
  }
  return {
    languages,
    options: options7
  };
}
function* collectParsersFromLanguages(parserChoices, languages, plugins2) {
  const existingParsers = new Set(parserChoices.map((choice) => choice.value));
  for (const language of languages) {
    if (language.parsers) {
      for (const parserName of language.parsers) {
        if (!existingParsers.has(parserName)) {
          existingParsers.add(parserName);
          const plugin = plugins2.find((plugin2) => plugin2.parsers && function_object_has_own_default(plugin2.parsers, parserName));
          let description = language.name;
          if (plugin?.name) {
            description += ` (plugin: ${plugin.name})`;
          }
          yield {
            value: parserName,
            description
          };
        }
      }
    }
  }
}
function normalizeOptionSettings(settings) {
  const options7 = [];
  for (const [name, originalOption] of Object.entries(settings)) {
    const option = {
      name,
      ...originalOption
    };
    if (Array.isArray(option.default)) {
      option.default = method_at_default(
        /* OPTIONAL_OBJECT: false */
        0,
        option.default,
        -1
      ).value;
    }
    options7.push(option);
  }
  return options7;
}

// scripts/build/shims/method-to-reversed.js
var arrayToReversed = Array.prototype.toReversed ?? function() {
  return [...this].reverse();
};
var toReversed = /* @__PURE__ */ createMethodShim("toReversed", function() {
  if (Array.isArray(this)) {
    return arrayToReversed;
  }
});
var method_to_reversed_default = toReversed;

// src/universal/index.js
import path13 from "path";

// node_modules/n-readlines/readlines.js
import fs5 from "fs";
var LF = 10;
var CR = 13;
var STDIN_FD = 0;
var LineByLine = class {
  constructor(file, options7) {
    options7 = options7 || {};
    if (!options7.readChunk) options7.readChunk = 1024;
    if (typeof file === "number") {
      this.fd = file;
    } else {
      this.fd = fs5.openSync(file, "r");
    }
    this.options = options7;
    this.isStdin = this.fd === STDIN_FD;
    this.reset();
  }
  _searchInBuffer(buffer2) {
    for (let i = 0; i < buffer2.length; i++) {
      const byte = buffer2[i];
      if (byte === LF || byte === CR) {
        return i;
      }
    }
    return -1;
  }
  reset() {
    this.eofReached = false;
    this.linesCache = [];
    this.fdPosition = 0;
    this.lastChunkEndedWithCR = false;
    this.lineIsComplete = false;
  }
  close() {
    if (!this.isStdin) {
      fs5.closeSync(this.fd);
    }
    this.fd = null;
  }
  _extractLines(buffer2, isEof) {
    const lines = [];
    let lineStart = 0;
    if (this.lastChunkEndedWithCR && buffer2.length > 0 && buffer2[0] === LF) {
      lineStart = 1;
    }
    this.lastChunkEndedWithCR = false;
    this.lineIsComplete = false;
    for (let i = lineStart; i < buffer2.length; i++) {
      const byte = buffer2[i];
      if (byte === LF) {
        lines.push(buffer2.slice(lineStart, i));
        lineStart = i + 1;
      } else if (byte === CR) {
        const lineEnd = i;
        if (i + 1 >= buffer2.length) {
          if (!isEof) {
            this.lastChunkEndedWithCR = true;
          }
          lines.push(buffer2.slice(lineStart, lineEnd));
          lineStart = i + 1;
        } else if (buffer2[i + 1] === LF) {
          lines.push(buffer2.slice(lineStart, lineEnd));
          i++;
          lineStart = i + 1;
        } else {
          lines.push(buffer2.slice(lineStart, lineEnd));
          lineStart = i + 1;
        }
      }
    }
    if (lineStart < buffer2.length) {
      lines.push(buffer2.slice(lineStart));
    } else if (lineStart === buffer2.length) {
      this.lineIsComplete = true;
    }
    return lines;
  }
  _readChunk(lineLeftovers) {
    let totalBytesRead = 0;
    let bytesRead;
    const buffers = [];
    do {
      const readBuffer = Buffer.alloc(this.options.readChunk);
      const position = this.isStdin ? null : this.fdPosition;
      bytesRead = fs5.readSync(this.fd, readBuffer, 0, this.options.readChunk, position);
      totalBytesRead = totalBytesRead + bytesRead;
      this.fdPosition = this.fdPosition + bytesRead;
      buffers.push(readBuffer);
    } while (bytesRead && this._searchInBuffer(buffers[buffers.length - 1]) === -1);
    let bufferData = Buffer.concat(buffers);
    if (bytesRead < this.options.readChunk) {
      this.eofReached = true;
      bufferData = bufferData.slice(0, totalBytesRead);
    }
    if (totalBytesRead) {
      this.linesCache = this._extractLines(bufferData, this.eofReached);
      if (lineLeftovers) {
        if (this.linesCache.length > 0) {
          this.linesCache[0] = Buffer.concat([lineLeftovers, this.linesCache[0]]);
        } else {
          this.linesCache.push(lineLeftovers);
        }
      }
    }
    return totalBytesRead;
  }
  next() {
    if (this.fd === null) return null;
    let line3 = null;
    if (this.eofReached && this.linesCache.length === 0) {
      return line3;
    }
    let bytesRead;
    if (!this.linesCache.length) {
      bytesRead = this._readChunk();
    }
    if (this.linesCache.length) {
      line3 = this.linesCache.shift();
      if (!this.eofReached && !this.lineIsComplete && this.linesCache.length === 0) {
        bytesRead = this._readChunk(line3);
        if (bytesRead && this.linesCache.length) {
          line3 = this.linesCache.shift();
        }
      }
    }
    if (this.eofReached && this.linesCache.length === 0) {
      this.close();
    }
    return line3;
  }
  /**
   * Returns true if the last line has been read and there are no more lines.
   * @returns {boolean}
   */
  isLast() {
    return this.fd === null || this.eofReached && this.linesCache.length === 0;
  }
};
var readlines_default = LineByLine;

// src/utilities/get-interpreter.js
function readFileFirstLine(file) {
  const liner = new readlines_default(toPath(file));
  const firstLineBuffer = liner.next();
  if (typeof liner.fd === "number") {
    liner.close();
  }
  return firstLineBuffer?.toString("utf8");
}
function getInterpreter(file) {
  let firstLine;
  try {
    firstLine = readFileFirstLine(file);
  } catch {
  }
  if (!firstLine) {
    return;
  }
  const m1 = firstLine.match(/^#!\/(?:usr\/)?bin\/env\s+(\S+)/);
  if (m1) {
    return m1[1];
  }
  const m2 = firstLine.match(/^#!\/(?:usr\/(?:local\/)?)?bin\/(\S+)/);
  if (m2) {
    return m2[1];
  }
}
var get_interpreter_default = getInterpreter;

// src/universal/index.js
import { fileURLToPath as fileURLToPath5 } from "url";
var getFileBasename = (file) => {
  try {
    return path13.basename(toPath(file));
  } catch {
    return "";
  }
};

// src/utilities/infer-parser.js
function getLanguageByFileName(languages, file) {
  if (!file) {
    return;
  }
  const basename = getFileBasename(file).toLowerCase();
  return languages.find(({
    filenames
  }) => filenames?.some((name) => name.toLowerCase() === basename)) ?? languages.find(({
    extensions
  }) => extensions?.some((extension) => basename.endsWith(extension)));
}
function getLanguageByLanguageName(languages, languageName) {
  if (!languageName) {
    return;
  }
  return languages.find(({
    name
  }) => name.toLowerCase() === languageName) ?? languages.find(({
    aliases
  }) => aliases?.includes(languageName)) ?? languages.find(({
    extensions
  }) => extensions?.includes(`.${languageName}`));
}
function getLanguageByInterpreterNodejs(languages, file) {
  if (!file || getFileBasename(file).includes(".")) {
    return;
  }
  const languagesWithInterpreters = languages.filter(({
    interpreters
  }) => is_non_empty_array_default(interpreters));
  if (languagesWithInterpreters.length === 0) {
    return;
  }
  const interpreter = get_interpreter_default(file);
  if (!interpreter) {
    return;
  }
  return languagesWithInterpreters.find(({
    interpreters
  }) => interpreters.includes(interpreter));
}
var getLanguageByInterpreter = false ? void 0 : getLanguageByInterpreterNodejs;
function getLanguageByIsSupported(languages, file) {
  if (!file) {
    return;
  }
  if (isUrl(file)) {
    try {
      file = fileURLToPath5(file);
    } catch {
      return;
    }
  }
  if (typeof file !== "string") {
    return;
  }
  return languages.find(({
    isSupported
  }) => isSupported?.({
    filepath: file
  }));
}
function inferParser(options7, fileInfo) {
  const languages = method_to_reversed_default(
    /* OPTIONAL_OBJECT: false */
    0,
    options7.plugins
  ).flatMap((plugin) => (
    // @ts-expect-error -- Safe
    plugin.languages ?? []
  ));
  const language = getLanguageByLanguageName(languages, fileInfo.language) ?? getLanguageByFileName(languages, fileInfo.physicalFile) ?? getLanguageByFileName(languages, fileInfo.file) ?? getLanguageByIsSupported(languages, fileInfo.physicalFile) ?? getLanguageByIsSupported(languages, fileInfo.file) ?? getLanguageByInterpreter?.(languages, fileInfo.physicalFile);
  return language?.parsers[0];
}
var infer_parser_default = inferParser;

// src/main/normalize-options.js
var hasDeprecationWarned;
function normalizeOptions(options7, optionInfos, {
  logger = false,
  isCLI = false,
  passThrough = false,
  FlagSchema,
  descriptor
} = {}) {
  if (isCLI) {
    if (!FlagSchema) {
      throw new Error("'FlagSchema' option is required.");
    }
    if (!descriptor) {
      throw new Error("'descriptor' option is required.");
    }
  } else {
    descriptor = apiDescriptor;
  }
  const unknown = !passThrough ? (key2, value, options8) => {
    const {
      _,
      ...schemas2
    } = options8.schemas;
    return levenUnknownHandler(key2, value, {
      ...options8,
      schemas: schemas2
    });
  } : Array.isArray(passThrough) ? (key2, value) => !passThrough.includes(key2) ? void 0 : {
    [key2]: value
  } : (key2, value) => ({
    [key2]: value
  });
  const schemas = optionInfosToSchemas(optionInfos, {
    isCLI,
    FlagSchema
  });
  const normalizer = new Normalizer(schemas, {
    logger,
    unknown,
    descriptor
  });
  const shouldSuppressDuplicateDeprecationWarnings = logger !== false;
  if (shouldSuppressDuplicateDeprecationWarnings && hasDeprecationWarned) {
    normalizer._hasDeprecationWarned = hasDeprecationWarned;
  }
  const normalized = normalizer.normalize(options7);
  if (shouldSuppressDuplicateDeprecationWarnings) {
    hasDeprecationWarned = normalizer._hasDeprecationWarned;
  }
  return normalized;
}
function optionInfosToSchemas(optionInfos, {
  isCLI,
  FlagSchema
}) {
  const schemas = [];
  if (isCLI) {
    schemas.push(AnySchema.create({
      name: "_"
    }));
  }
  for (const optionInfo of optionInfos) {
    schemas.push(optionInfoToSchema(optionInfo, {
      isCLI,
      optionInfos,
      FlagSchema
    }));
    if (optionInfo.alias && isCLI) {
      schemas.push(AliasSchema.create({
        // @ts-expect-error
        name: optionInfo.alias,
        sourceName: optionInfo.name
      }));
    }
  }
  return schemas;
}
function optionInfoToSchema(optionInfo, {
  isCLI,
  optionInfos,
  FlagSchema
}) {
  const {
    name
  } = optionInfo;
  const parameters = {
    name
  };
  let SchemaConstructor;
  const handlers = {};
  switch (optionInfo.type) {
    case "int":
      SchemaConstructor = IntegerSchema;
      if (isCLI) {
        parameters.preprocess = Number;
      }
      break;
    case "string":
      SchemaConstructor = StringSchema;
      break;
    case "choice":
      SchemaConstructor = ChoiceSchema;
      parameters.choices = optionInfo.choices.map((choiceInfo) => choiceInfo?.redirect ? {
        ...choiceInfo,
        redirect: {
          to: {
            key: optionInfo.name,
            value: choiceInfo.redirect
          }
        }
      } : choiceInfo);
      break;
    case "boolean":
      SchemaConstructor = BooleanSchema;
      break;
    case "flag":
      SchemaConstructor = FlagSchema;
      parameters.flags = optionInfos.flatMap((optionInfo2) => [optionInfo2.alias, optionInfo2.description && optionInfo2.name, optionInfo2.oppositeDescription && `no-${optionInfo2.name}`].filter(Boolean));
      break;
    case "path":
      SchemaConstructor = StringSchema;
      break;
    default:
      throw new Error(`Unexpected type ${optionInfo.type}`);
  }
  if (optionInfo.exception) {
    parameters.validate = (value, schema, utils) => optionInfo.exception(value) || schema.validate(value, utils);
  } else {
    parameters.validate = (value, schema, utils) => value === void 0 || schema.validate(value, utils);
  }
  if (optionInfo.redirect) {
    handlers.redirect = (value) => !value ? void 0 : {
      to: typeof optionInfo.redirect === "string" ? optionInfo.redirect : {
        key: optionInfo.redirect.option,
        value: optionInfo.redirect.value
      }
    };
  }
  if (optionInfo.deprecated) {
    handlers.deprecated = true;
  }
  if (isCLI && !optionInfo.array) {
    const originalPreprocess = parameters.preprocess || ((x) => x);
    parameters.preprocess = (value, schema, utils) => schema.preprocess(originalPreprocess(Array.isArray(value) ? method_at_default(
      /* OPTIONAL_OBJECT: false */
      0,
      value,
      -1
    ) : value), utils);
  }
  return optionInfo.array ? ArraySchema.create({
    ...isCLI ? {
      preprocess: (v) => Array.isArray(v) ? v : [v]
    } : {},
    ...handlers,
    // @ts-expect-error
    valueSchema: SchemaConstructor.create(parameters)
  }) : SchemaConstructor.create({
    ...parameters,
    ...handlers
  });
}
var normalize_options_default = normalizeOptions;

// scripts/build/shims/method-find-last.js
var arrayFindLast = Array.prototype.findLast ?? function(callback) {
  for (let index = this.length - 1; index >= 0; index--) {
    const element = this[index];
    if (callback(element, index, this)) {
      return element;
    }
  }
};
var findLast = /* @__PURE__ */ createMethodShim("findLast", function() {
  if (Array.isArray(this)) {
    return arrayFindLast;
  }
});
var method_find_last_default = findLast;

// src/main/front-matter/embed.js
import { builders as __doc_builders2 } from "./doc.mjs";

// src/main/front-matter/constants.js
var FRONT_MATTER_MARK = /* @__PURE__ */ Symbol.for("PRETTIER_IS_FRONT_MATTER");
var FRONT_MATTER_VISITOR_KEYS = [];

// src/main/front-matter/is-front-matter.js
function isFrontMatter(node) {
  return Boolean(node?.[FRONT_MATTER_MARK]);
}
var is_front_matter_default = isFrontMatter;

// src/main/front-matter/embed.js
var {
  hardline: hardline2,
  markAsRoot
} = __doc_builders2;
var SUPPORTED_EMBED_LANGUAGES = /* @__PURE__ */ new Set(["yaml", "toml"]);
var isEmbedFrontMatter = ({
  node
}) => is_front_matter_default(node) && SUPPORTED_EMBED_LANGUAGES.has(node.language);
async function printEmbedFrontMatter(textToDoc2, print, path17, options7) {
  const {
    node
  } = path17;
  const {
    language
  } = node;
  if (!SUPPORTED_EMBED_LANGUAGES.has(language)) {
    return;
  }
  const value = node.value.trim();
  let doc2;
  if (value) {
    const parser = language === "yaml" ? language : infer_parser_default(options7, {
      language
    });
    if (!parser) {
      return;
    }
    doc2 = value ? await textToDoc2(value, {
      parser
    }) : "";
  } else {
    doc2 = value;
  }
  return markAsRoot([node.startDelimiter, node.explicitLanguage ?? "", hardline2, doc2, doc2 ? hardline2 : "", node.endDelimiter]);
}

// src/main/front-matter/clean.js
function clean(original, cloned) {
  if (isEmbedFrontMatter({ node: original })) {
    delete cloned.end;
    delete cloned.raw;
    delete cloned.value;
  }
  return cloned;
}
var clean_default = clean;

// src/main/front-matter/print.js
function printFrontMatter({ node }) {
  return node.raw;
}
var print_default = printFrontMatter;

// src/main/create-get-visitor-keys-function.js
var nonTraversableKeys = /* @__PURE__ */ new Set([
  "tokens",
  "comments",
  "parent",
  "enclosingNode",
  "precedingNode",
  "followingNode"
]);
var defaultGetVisitorKeys = (node) => Object.keys(node).filter((key2) => !nonTraversableKeys.has(key2));
function createGetVisitorKeysFunction(printerGetVisitorKeys, supportFrontMatter) {
  const getVisitorKeys = printerGetVisitorKeys ? (node) => printerGetVisitorKeys(node, nonTraversableKeys) : defaultGetVisitorKeys;
  if (!supportFrontMatter) {
    return getVisitorKeys;
  }
  return new Proxy(getVisitorKeys, {
    apply: (target, thisArgument, argumentsList) => is_front_matter_default(argumentsList[0]) ? FRONT_MATTER_VISITOR_KEYS : Reflect.apply(target, thisArgument, argumentsList)
  });
}
var create_get_visitor_keys_function_default = createGetVisitorKeysFunction;

// src/main/parser-and-printer.js
function getParserPluginByParserName(plugins2, parserName) {
  if (!parserName) {
    throw new Error("parserName is required.");
  }
  const plugin = method_find_last_default(
    /* OPTIONAL_OBJECT: false */
    0,
    plugins2,
    (plugin2) => plugin2.parsers && function_object_has_own_default(plugin2.parsers, parserName)
  );
  if (plugin) {
    return plugin;
  }
  let message = `Couldn't resolve parser "${parserName}".`;
  if (false) {
    message += " Plugins must be explicitly added to the standalone bundle.";
  }
  throw new ConfigError(message);
}
function getPrinterPluginByAstFormat(plugins2, astFormat) {
  if (!astFormat) {
    throw new Error("astFormat is required.");
  }
  const plugin = method_find_last_default(
    /* OPTIONAL_OBJECT: false */
    0,
    plugins2,
    (plugin2) => plugin2.printers && function_object_has_own_default(plugin2.printers, astFormat)
  );
  if (plugin) {
    return plugin;
  }
  let message = `Couldn't find plugin for AST format "${astFormat}".`;
  if (false) {
    message += " Plugins must be explicitly added to the standalone bundle.";
  }
  throw new ConfigError(message);
}
function resolveParser({
  plugins: plugins2,
  parser
}) {
  const plugin = getParserPluginByParserName(plugins2, parser);
  return initParser(plugin, parser);
}
function initParser(plugin, parserName) {
  const parserOrParserInitFunction = plugin.parsers[parserName];
  return typeof parserOrParserInitFunction === "function" ? parserOrParserInitFunction() : parserOrParserInitFunction;
}
async function initPrinter(plugin, astFormat) {
  const printerOrPrinterInitFunction = plugin.printers[astFormat];
  const printer = typeof printerOrPrinterInitFunction === "function" ? await printerOrPrinterInitFunction() : printerOrPrinterInitFunction;
  return normalizePrinter(printer);
}
function normalizePrinterWithoutCache(printer) {
  if (false) {
    ok(!printer[PRINTER_NORMALIZED_MARK], "Unexpected printer normalization");
  }
  let {
    features,
    getVisitorKeys,
    embed: originalEmbed,
    massageAstNode: originalCleanFunction,
    print: originalPrint,
    ...printerRestProperties
  } = printer;
  features = normalizePrinterFeatures(features);
  const frontMatterSupport = features.experimental_frontMatterSupport;
  getVisitorKeys = create_get_visitor_keys_function_default(
    getVisitorKeys,
    /** frontMatterVisitorKeys */
    frontMatterSupport.massageAstNode || frontMatterSupport.embed || frontMatterSupport.print
  );
  let massageAstNode = originalCleanFunction;
  if (originalCleanFunction && frontMatterSupport.massageAstNode) {
    massageAstNode = new Proxy(originalCleanFunction, {
      apply(target, thisArgument, argumentsList) {
        clean_default(...argumentsList);
        return Reflect.apply(target, thisArgument, argumentsList);
      }
    });
  }
  let embed = originalEmbed;
  if (originalEmbed) {
    let embedGetVisitorKeys;
    embed = new Proxy(originalEmbed, {
      get(target, property, receiver) {
        if (property === "getVisitorKeys") {
          embedGetVisitorKeys ?? (embedGetVisitorKeys = originalEmbed.getVisitorKeys ? create_get_visitor_keys_function_default(
            originalEmbed.getVisitorKeys,
            /** frontMatterVisitorKeys */
            frontMatterSupport.massageAstNode || frontMatterSupport.embed
          ) : getVisitorKeys);
          return embedGetVisitorKeys;
        }
        return Reflect.get(target, property, receiver);
      },
      apply: (target, thisArgument, argumentsList) => frontMatterSupport.embed && isEmbedFrontMatter(...argumentsList) ? printEmbedFrontMatter : Reflect.apply(target, thisArgument, argumentsList)
    });
  }
  let print = originalPrint;
  if (frontMatterSupport.print) {
    print = new Proxy(originalPrint, {
      apply(target, thisArgument, argumentsList) {
        const [path17] = argumentsList;
        if (is_front_matter_default(path17.node)) {
          return print_default(path17);
        }
        return Reflect.apply(target, thisArgument, argumentsList);
      }
    });
  }
  const normalizedPrinter = {
    features,
    getVisitorKeys,
    embed,
    massageAstNode,
    print,
    ...printerRestProperties
  };
  if (false) {
    normalizedPrinter[PRINTER_NORMALIZED_MARK] = true;
  }
  return normalizedPrinter;
}
var normalizedPrinters = /* @__PURE__ */ new WeakMap();
function normalizePrinter(printer) {
  return getOrInsertComputed(normalizedPrinters, printer, normalizePrinterWithoutCache);
}
var PRINTER_FRONT_MATTER_SUPPORT_FEATURES = ["clean", "embed", "print"];
var PRINTER_FRONT_MATTER_SUPPORT_OFF = Object.fromEntries(PRINTER_FRONT_MATTER_SUPPORT_FEATURES.map((feature) => [feature, false]));
function normalizePrinterFrontMatterSupport(frontMatterSupport) {
  return {
    ...PRINTER_FRONT_MATTER_SUPPORT_OFF,
    ...frontMatterSupport
  };
}
function normalizePrinterFeatures(features) {
  return {
    experimental_avoidAstMutation: false,
    ...features,
    experimental_frontMatterSupport: normalizePrinterFrontMatterSupport(features?.experimental_frontMatterSupport)
  };
}

// src/main/normalize-format-options.js
var formatOptionsHiddenDefaults = {
  astFormat: "estree",
  printer: {},
  originalText: void 0,
  locStart: null,
  locEnd: null,
  getVisitorKeys: null
};
async function normalizeFormatOptions(options7, opts2 = {}) {
  const rawOptions = { ...options7 };
  if (!rawOptions.parser) {
    if (!rawOptions.filepath) {
      throw new UndefinedParserError(
        "No parser and no file path given, couldn't infer a parser."
      );
    }
    rawOptions.parser = infer_parser_default(rawOptions, {
      physicalFile: rawOptions.filepath
    });
    if (!rawOptions.parser) {
      throw new UndefinedParserError(
        `No parser could be inferred for file "${rawOptions.filepath}".`
      );
    }
  }
  const supportOptions = getSupportInfo({
    plugins: options7.plugins,
    showDeprecated: true
  }).options;
  const defaults2 = {
    ...formatOptionsHiddenDefaults,
    ...Object.fromEntries(
      supportOptions.filter((optionInfo) => optionInfo.default !== void 0).map((option) => [option.name, option.default])
    )
  };
  const parserPlugin = getParserPluginByParserName(
    rawOptions.plugins,
    rawOptions.parser
  );
  const parser = await initParser(parserPlugin, rawOptions.parser);
  rawOptions.astFormat = parser.astFormat;
  rawOptions.locEnd = parser.locEnd;
  rawOptions.locStart = parser.locStart;
  const printerPlugin = parserPlugin.printers?.[parser.astFormat] ? parserPlugin : getPrinterPluginByAstFormat(rawOptions.plugins, parser.astFormat);
  const printer = await initPrinter(printerPlugin, parser.astFormat);
  rawOptions.printer = printer;
  rawOptions.getVisitorKeys = printer.getVisitorKeys;
  const pluginDefaults = printerPlugin.defaultOptions ? Object.fromEntries(
    Object.entries(printerPlugin.defaultOptions).filter(
      ([, value]) => value !== void 0
    )
  ) : {};
  const mixedDefaults = { ...defaults2, ...pluginDefaults };
  for (const [k, value] of Object.entries(mixedDefaults)) {
    rawOptions[k] ?? (rawOptions[k] = value);
  }
  if (rawOptions.parser === "json") {
    rawOptions.trailingComma = "none";
  }
  return normalize_options_default(rawOptions, supportOptions, {
    passThrough: Object.keys(formatOptionsHiddenDefaults),
    ...opts2
  });
}
var normalize_format_options_default = normalizeFormatOptions;

// src/main/parse.js
async function parse8(originalText, options7) {
  const parser = await resolveParser(options7);
  const text = parser.preprocess ? await parser.preprocess(originalText, options7) : originalText;
  options7.originalText = text;
  let ast;
  try {
    ast = await parser.parse(
      text,
      options7,
      // TODO: remove the third argument in v4
      // The duplicated argument is passed as intended, see #10156
      options7
    );
  } catch (error) {
    handleParseError(error, originalText);
  }
  return { text, ast };
}
function handleParseError(error, text) {
  const { loc } = error;
  if (loc) {
    let { start, end } = loc;
    start && (start = { line: start.line, column: start.column - 1 });
    end && (end = { line: end.line, column: end.column - 1 });
    const codeFrame = codeFrameColumns(
      text,
      { start, end },
      { highlightCode: true }
    );
    error.message += "\n" + codeFrame;
    error.codeFrame = codeFrame;
  }
  throw error;
}
var parse_default = parse8;

// src/main/multiparser.js
var {
  stripTrailingHardline
} = __doc_utils;
async function printEmbeddedLanguages(path17, genericPrint, options7, printAstToDoc2, embeds) {
  if (options7.embeddedLanguageFormatting !== "auto") {
    return;
  }
  const {
    printer
  } = options7;
  const {
    embed
  } = printer;
  if (!embed) {
    return;
  }
  if (embed.length > 2) {
    throw new Error("printer.embed has too many parameters. The API changed in Prettier v3. Please update your plugin. See https://prettier.io/docs/plugins#optional-embed");
  }
  const {
    hasPrettierIgnore
  } = printer;
  const {
    getVisitorKeys
  } = embed;
  const embedCallResults = [];
  recurse();
  const originalPathStack = path17.stack;
  for (const {
    print,
    node,
    pathStack
  } of embedCallResults) {
    try {
      path17.stack = pathStack;
      const doc2 = await print(textToDocForEmbed, genericPrint, path17, options7);
      if (doc2) {
        embeds.set(node, doc2);
      }
    } catch (error) {
      if (process.env.PRETTIER_DEBUG) {
        throw error;
      }
    }
  }
  path17.stack = originalPathStack;
  function textToDocForEmbed(text, partialNextOptions) {
    return textToDoc(text, partialNextOptions, options7, printAstToDoc2);
  }
  function recurse() {
    const {
      node
    } = path17;
    if (node === null || typeof node !== "object" || hasPrettierIgnore?.(path17)) {
      return;
    }
    for (const key2 of getVisitorKeys(node)) {
      if (Array.isArray(node[key2])) {
        path17.each(recurse, key2);
      } else {
        path17.call(recurse, key2);
      }
    }
    const result = embed(path17, options7);
    if (!result) {
      return;
    }
    if (typeof result === "function") {
      embedCallResults.push({
        print: result,
        node,
        pathStack: [...path17.stack]
      });
      return;
    }
    if (false) {
      throw new Error("`embed` should return an async function instead of Promise.");
    }
    embeds.set(node, result);
  }
}
async function textToDoc(text, partialNextOptions, parentOptions, printAstToDoc2) {
  const options7 = await normalize_format_options_default({
    ...parentOptions,
    ...partialNextOptions,
    parentParser: parentOptions.parser,
    originalText: text,
    // Improve this if we calculate the relative index
    cursorOffset: void 0,
    rangeStart: void 0,
    rangeEnd: void 0
  }, {
    passThrough: true
  });
  const {
    ast
  } = await parse_default(text, options7);
  const doc2 = await printAstToDoc2(ast, options7);
  return stripTrailingHardline(doc2);
}

// src/main/print-ignored.js
function printIgnored(path17, options7, printPath, args) {
  const {
    originalText,
    [commentsPropertyInOptions]: comments,
    locStart,
    locEnd,
    [/* @__PURE__ */ Symbol.for("printedComments")]: printedComments
  } = options7;
  const { node } = path17;
  const start = locStart(node);
  const end = locEnd(node);
  for (const comment of comments) {
    if (locStart(comment) >= start && locEnd(comment) <= end) {
      printedComments.add(comment);
    }
  }
  const { printPrettierIgnored } = options7.printer;
  return printPrettierIgnored ? printPrettierIgnored(path17, options7, printPath, args) : originalText.slice(start, end);
}
var print_ignored_default = printIgnored;

// src/main/ast-to-doc.js
var {
  cursor
} = __doc_builders3;
async function printAstToDoc(ast, options7) {
  ({
    ast
  } = await prepareToPrint(ast, options7));
  const cache4 = /* @__PURE__ */ new Map();
  const path17 = new ast_path_default(ast);
  const ensurePrintingNode = create_print_pre_check_function_default(options7);
  const embeds = /* @__PURE__ */ new Map();
  await printEmbeddedLanguages(path17, mainPrint, options7, printAstToDoc, embeds);
  const doc2 = await callPluginPrintFunction(path17, options7, mainPrint, void 0, embeds);
  ensureAllCommentsPrinted(options7);
  if (options7.cursorOffset >= 0) {
    if (options7.nodeAfterCursor && !options7.nodeBeforeCursor) {
      return [cursor, doc2];
    }
    if (options7.nodeBeforeCursor && !options7.nodeAfterCursor) {
      return [doc2, cursor];
    }
  }
  return doc2;
  function mainPrint(selector, args) {
    if (selector === void 0 || selector === path17) {
      return mainPrintInternal(args);
    }
    if (Array.isArray(selector)) {
      return path17.call(() => mainPrintInternal(args), ...selector);
    }
    return path17.call(() => mainPrintInternal(args), selector);
  }
  function mainPrintInternal(args) {
    ensurePrintingNode(path17);
    const value = path17.node;
    if (value === void 0 || value === null) {
      return "";
    }
    const shouldCache = is_object_default(value) && args === void 0;
    if (shouldCache && cache4.has(value)) {
      return cache4.get(value);
    }
    const doc3 = callPluginPrintFunction(path17, options7, mainPrint, args, embeds);
    if (shouldCache) {
      cache4.set(value, doc3);
    }
    return doc3;
  }
}
function callPluginPrintFunction(path17, options7, printPath, args, embeds) {
  const {
    node
  } = path17;
  const {
    printer
  } = options7;
  let doc2;
  if (printer.hasPrettierIgnore?.(path17)) {
    doc2 = print_ignored_default(path17, options7, printPath, args);
  } else if (embeds.has(node)) {
    doc2 = embeds.get(node);
  } else {
    doc2 = printer.print(path17, options7, printPath, args);
  }
  switch (node) {
    case options7.cursorNode:
      doc2 = inheritLabel(doc2, (doc3) => [cursor, doc3, cursor]);
      break;
    case options7.nodeBeforeCursor:
      doc2 = inheritLabel(doc2, (doc3) => [doc3, cursor]);
      break;
    case options7.nodeAfterCursor:
      doc2 = inheritLabel(doc2, (doc3) => [cursor, doc3]);
      break;
  }
  if (printer.printComment && is_non_empty_array_default(node.comments) && !printer.willPrintOwnComments?.(path17, options7)) {
    doc2 = printComments(path17, doc2, options7);
  }
  return doc2;
}
async function prepareToPrint(ast, options7) {
  const comments = ast.comments ?? [];
  options7[commentsPropertyInOptions] = comments;
  options7[/* @__PURE__ */ Symbol.for("printedComments")] = /* @__PURE__ */ new Set();
  attachComments(ast, options7);
  const {
    printer: {
      preprocess
    }
  } = options7;
  ast = preprocess ? await preprocess(ast, options7) : ast;
  return {
    ast,
    comments
  };
}

// src/main/get-cursor-node.js
function getCursorLocation(ast, options7) {
  const { cursorOffset, locStart, locEnd, getVisitorKeys } = options7;
  const nodeContainsCursor = (node) => locStart(node) <= cursorOffset && locEnd(node) >= cursorOffset;
  let cursorNode = ast;
  const nodesContainingCursor = [ast];
  for (const node of getDescendants(ast, {
    getVisitorKeys,
    filter: nodeContainsCursor
  })) {
    nodesContainingCursor.push(node);
    cursorNode = node;
  }
  if (isLeaf(cursorNode, { getVisitorKeys })) {
    return { cursorNode };
  }
  let nodeBeforeCursor;
  let nodeAfterCursor;
  let nodeBeforeCursorEndIndex = -1;
  let nodeAfterCursorStartIndex = Number.POSITIVE_INFINITY;
  while (nodesContainingCursor.length > 0 && (nodeBeforeCursor === void 0 || nodeAfterCursor === void 0)) {
    cursorNode = nodesContainingCursor.pop();
    const foundBeforeNode = nodeBeforeCursor !== void 0;
    const foundAfterNode = nodeAfterCursor !== void 0;
    for (const node of getChildren(cursorNode, { getVisitorKeys })) {
      if (!foundBeforeNode) {
        const nodeEnd = locEnd(node);
        if (nodeEnd <= cursorOffset && nodeEnd > nodeBeforeCursorEndIndex) {
          nodeBeforeCursor = node;
          nodeBeforeCursorEndIndex = nodeEnd;
        }
      }
      if (!foundAfterNode) {
        const nodeStart = locStart(node);
        if (nodeStart >= cursorOffset && nodeStart < nodeAfterCursorStartIndex) {
          nodeAfterCursor = node;
          nodeAfterCursorStartIndex = nodeStart;
        }
      }
    }
  }
  return {
    nodeBeforeCursor,
    nodeAfterCursor
  };
}
var get_cursor_node_default = getCursorLocation;

// src/main/massage-ast.js
function massageAst(ast, options7) {
  const {
    printer
  } = options7;
  const clean2 = printer.massageAstNode;
  if (!clean2) {
    return ast;
  }
  const {
    getVisitorKeys
  } = printer;
  const {
    ignoredProperties
  } = clean2;
  return recurse(ast);
  function recurse(original, parent) {
    if (!is_object_default(original)) {
      return original;
    }
    if (Array.isArray(original)) {
      return original.map((child) => recurse(child, parent)).filter(Boolean);
    }
    const cloned = {};
    const childrenKeys = new Set(getVisitorKeys(original));
    for (const key2 in original) {
      if (!function_object_has_own_default(original, key2) || ignoredProperties?.has(key2)) {
        continue;
      }
      if (childrenKeys.has(key2)) {
        cloned[key2] = recurse(original[key2], original);
      } else {
        cloned[key2] = original[key2];
      }
    }
    const result = clean2(original, cloned, parent);
    if (result === null) {
      return;
    }
    return result ?? cloned;
  }
}
var massage_ast_default = massageAst;

// scripts/build/shims/method-find-last-index.js
var arrayFindLastIndex = Array.prototype.findLastIndex ?? function(callback) {
  for (let index = this.length - 1; index >= 0; index--) {
    const element = this[index];
    if (callback(element, index, this)) {
      return index;
    }
  }
  return -1;
};
var findLastIndex = /* @__PURE__ */ createMethodShim(
  "findLastIndex",
  function() {
    if (Array.isArray(this)) {
      return arrayFindLastIndex;
    }
  }
);
var method_find_last_index_default = findLastIndex;

// src/main/range.js
function findCommonAncestor(startNodeAndAncestors, endNodeAndAncestors) {
  endNodeAndAncestors = new Set(endNodeAndAncestors);
  return startNodeAndAncestors.find((node) => jsonSourceElements.has(node.type) && endNodeAndAncestors.has(node));
}
function dropRootParents(parents) {
  const index = method_find_last_index_default(
    /* OPTIONAL_OBJECT: false */
    0,
    parents,
    (node) => node.type !== "Program" && node.type !== "File"
  );
  if (index === -1) {
    return parents;
  }
  return parents.slice(0, index + 1);
}
function findSiblingAncestors(startNodeAndAncestors, endNodeAndAncestors, {
  locStart,
  locEnd
}) {
  let [resultStartNode, ...startNodeAncestors] = startNodeAndAncestors;
  let [resultEndNode, ...endNodeAncestors] = endNodeAndAncestors;
  if (resultStartNode === resultEndNode) {
    return [resultStartNode, resultEndNode];
  }
  const startNodeStart = locStart(resultStartNode);
  for (const endAncestor of dropRootParents(endNodeAncestors)) {
    if (locStart(endAncestor) >= startNodeStart) {
      resultEndNode = endAncestor;
    } else {
      break;
    }
  }
  const endNodeEnd = locEnd(resultEndNode);
  for (const startAncestor of dropRootParents(startNodeAncestors)) {
    if (locEnd(startAncestor) <= endNodeEnd) {
      resultStartNode = startAncestor;
    } else {
      break;
    }
    if (resultStartNode === resultEndNode) {
      break;
    }
  }
  return [resultStartNode, resultEndNode];
}
function findNodeAtOffset(node, offset, options7, predicate, ancestors = [], type, locFunctions) {
  const {
    locStart,
    locEnd
  } = locFunctions;
  const start = locStart(node);
  const end = locEnd(node);
  if (offset > end || offset < start || type === "rangeEnd" && offset === start || type === "rangeStart" && offset === end) {
    return;
  }
  const nodeAndAncestors = [node, ...ancestors];
  const childNodes = get_sorted_child_nodes_default(node, nodeAndAncestors, {
    cache: childNodesCache,
    locStart,
    locEnd,
    getVisitorKeys: options7.getVisitorKeys,
    // These two property should be removed, since we don't care if it can attach comment
    filter: options7.printer.canAttachComment,
    getChildren: options7.printer.getCommentChildNodes
  });
  for (const child of childNodes) {
    const childAndAncestors = findNodeAtOffset(child, offset, options7, predicate, nodeAndAncestors, type, locFunctions);
    if (childAndAncestors) {
      return childAndAncestors;
    }
  }
  if (predicate(node, ancestors[0])) {
    return nodeAndAncestors;
  }
}
function isJsSourceElement(type, parentType) {
  return parentType !== "DeclareExportDeclaration" && type !== "TypeParameterDeclaration" && (type === "Directive" || type === "TypeAlias" || type === "TSExportAssignment" || type.startsWith("Declare") || type.startsWith("TSDeclare") || type.endsWith("Statement") || type.endsWith("Declaration"));
}
var jsonSourceElements = /* @__PURE__ */ new Set(["JsonRoot", "ObjectExpression", "ArrayExpression", "StringLiteral", "NumericLiteral", "BooleanLiteral", "NullLiteral", "UnaryExpression", "TemplateLiteral"]);
var graphqlSourceElements = /* @__PURE__ */ new Set(["OperationDefinition", "FragmentDefinition", "VariableDefinition", "TypeExtensionDefinition", "ObjectTypeDefinition", "FieldDefinition", "DirectiveDefinition", "EnumTypeDefinition", "EnumValueDefinition", "InputValueDefinition", "InputObjectTypeDefinition", "SchemaDefinition", "OperationTypeDefinition", "InterfaceTypeDefinition", "UnionTypeDefinition", "ScalarTypeDefinition"]);
function isSourceElement(opts2, node, parentNode) {
  if (!node) {
    return false;
  }
  switch (opts2.parser) {
    case "flow":
    case "hermes":
    case "babel":
    case "babel-flow":
    case "babel-ts":
    case "typescript":
    case "acorn":
    case "espree":
    case "meriyah":
    case "oxc":
    case "oxc-ts":
    case "yuku":
    case "yuku-ts":
    case "__babel_estree":
      return isJsSourceElement(node.type, parentNode?.type);
    case "json":
    case "json5":
    case "jsonc":
    case "json-stringify":
      return jsonSourceElements.has(node.type);
    case "graphql":
      return graphqlSourceElements.has(node.kind);
    case "vue":
      return node.tag !== "root";
  }
  return false;
}
function calculateRange(text, opts2, ast) {
  let {
    rangeStart: start,
    rangeEnd: end
  } = opts2;
  ok(end > start);
  const firstNonWhitespaceCharacterIndex = text.slice(start, end).search(/\S/);
  const isAllWhitespace = firstNonWhitespaceCharacterIndex === -1;
  if (!isAllWhitespace) {
    start += firstNonWhitespaceCharacterIndex;
    for (; end > start; --end) {
      if (/\S/.test(text[end - 1])) {
        break;
      }
    }
  }
  const locFunctions = opts2.printer.features?.experimental_locForRangeFormat ?? opts2;
  const startNodeAndAncestors = findNodeAtOffset(ast, start, opts2, (node, parentNode) => isSourceElement(opts2, node, parentNode), [], "rangeStart", locFunctions);
  if (!startNodeAndAncestors) {
    return;
  }
  const endNodeAndAncestors = (
    // No need find Node at `end`, it will be the same as `startNodeAndAncestors`
    isAllWhitespace ? startNodeAndAncestors : findNodeAtOffset(ast, end, opts2, (node) => isSourceElement(opts2, node), [], "rangeEnd", locFunctions)
  );
  if (!endNodeAndAncestors) {
    return;
  }
  let startNode;
  let endNode;
  if (ast.type === "JsonRoot") {
    const commonAncestor = findCommonAncestor(startNodeAndAncestors, endNodeAndAncestors);
    startNode = commonAncestor;
    endNode = commonAncestor;
  } else {
    [startNode, endNode] = findSiblingAncestors(startNodeAndAncestors, endNodeAndAncestors, opts2);
  }
  const {
    locStart,
    locEnd
  } = locFunctions;
  return [Math.min(locStart(startNode), locStart(endNode)), Math.max(locEnd(startNode), locEnd(endNode))];
}

// src/main/core.js
var {
  addAlignmentToDoc,
  hardline: hardline3
} = __doc_builders4;
var {
  printDocToString: printDocToStringWithoutNormalizeOptions
} = __doc_printer;
var BOM = "\uFEFF";
var CURSOR = /* @__PURE__ */ Symbol("cursor");
async function coreFormat(originalText, opts2, addAlignmentSize = 0) {
  if (!originalText || originalText.trim().length === 0) {
    return {
      formatted: "",
      cursorOffset: -1,
      comments: []
    };
  }
  const {
    ast,
    text
  } = await parse_default(originalText, opts2);
  if (opts2.cursorOffset >= 0) {
    opts2 = {
      ...opts2,
      ...get_cursor_node_default(ast, opts2)
    };
  }
  let doc2 = await printAstToDoc(ast, opts2, addAlignmentSize);
  if (addAlignmentSize > 0) {
    doc2 = addAlignmentToDoc([hardline3, doc2], addAlignmentSize, opts2.tabWidth);
  }
  const result = printDocToStringWithoutNormalizeOptions(doc2, opts2);
  if (addAlignmentSize > 0) {
    const trimmed = result.formatted.trim();
    if (result.cursorNodeStart !== void 0) {
      result.cursorNodeStart -= result.formatted.indexOf(trimmed);
      if (result.cursorNodeStart < 0) {
        result.cursorNodeStart = 0;
        result.cursorNodeText = result.cursorNodeText.trimStart();
      }
      if (result.cursorNodeStart + result.cursorNodeText.length > trimmed.length) {
        result.cursorNodeText = result.cursorNodeText.trimEnd();
      }
    }
    result.formatted = trimmed + convertEndOfLineOptionToCharacter(opts2.endOfLine);
  }
  const comments = opts2[commentsPropertyInOptions];
  if (opts2.cursorOffset >= 0) {
    let oldCursorRegionStart;
    let oldCursorRegionText;
    let newCursorRegionStart;
    let newCursorRegionText;
    if ((opts2.cursorNode || opts2.nodeBeforeCursor || opts2.nodeAfterCursor) && result.cursorNodeText) {
      newCursorRegionStart = result.cursorNodeStart;
      newCursorRegionText = result.cursorNodeText;
      if (opts2.cursorNode) {
        oldCursorRegionStart = opts2.locStart(opts2.cursorNode);
        oldCursorRegionText = text.slice(oldCursorRegionStart, opts2.locEnd(opts2.cursorNode));
      } else {
        if (!opts2.nodeBeforeCursor && !opts2.nodeAfterCursor) {
          throw new Error("Cursor location must contain at least one of cursorNode, nodeBeforeCursor, nodeAfterCursor");
        }
        oldCursorRegionStart = opts2.nodeBeforeCursor ? opts2.locEnd(opts2.nodeBeforeCursor) : 0;
        const oldCursorRegionEnd = opts2.nodeAfterCursor ? opts2.locStart(opts2.nodeAfterCursor) : text.length;
        oldCursorRegionText = text.slice(oldCursorRegionStart, oldCursorRegionEnd);
      }
    } else {
      oldCursorRegionStart = 0;
      oldCursorRegionText = text;
      newCursorRegionStart = 0;
      newCursorRegionText = result.formatted;
    }
    const cursorOffsetRelativeToOldCursorRegionStart = opts2.cursorOffset - oldCursorRegionStart;
    if (oldCursorRegionText === newCursorRegionText) {
      return {
        formatted: result.formatted,
        cursorOffset: newCursorRegionStart + cursorOffsetRelativeToOldCursorRegionStart,
        comments
      };
    }
    const oldCursorNodeCharArray = oldCursorRegionText.split("");
    oldCursorNodeCharArray.splice(cursorOffsetRelativeToOldCursorRegionStart, 0, CURSOR);
    const newCursorNodeCharArray = newCursorRegionText.split("");
    const cursorNodeDiff = diffArrays(oldCursorNodeCharArray, newCursorNodeCharArray);
    let cursorOffset = newCursorRegionStart;
    for (const entry of cursorNodeDiff) {
      if (entry.removed) {
        if (entry.value.includes(CURSOR)) {
          break;
        }
      } else {
        cursorOffset += entry.count;
      }
    }
    return {
      formatted: result.formatted,
      cursorOffset,
      comments
    };
  }
  return {
    formatted: result.formatted,
    cursorOffset: -1,
    comments
  };
}
async function formatRange(originalText, opts2) {
  const {
    ast,
    text
  } = await parse_default(originalText, opts2);
  const [rangeStart, rangeEnd] = calculateRange(text, opts2, ast) ?? [0, 0];
  const rangeString = text.slice(rangeStart, rangeEnd);
  const rangeStart2 = Math.min(rangeStart, text.lastIndexOf("\n", rangeStart) + 1);
  const indentString = text.slice(rangeStart2, rangeStart).match(/^\s*/)[0];
  const alignmentSize = get_alignment_size_default(indentString, opts2.tabWidth);
  const rangeResult = await coreFormat(rangeString, {
    ...opts2,
    rangeStart: 0,
    rangeEnd: Number.POSITIVE_INFINITY,
    // Track the cursor offset only if it's within our range
    cursorOffset: opts2.cursorOffset > rangeStart && opts2.cursorOffset <= rangeEnd ? opts2.cursorOffset - rangeStart : -1,
    // Always use `lf` to format, we'll replace it later
    endOfLine: "lf"
  }, alignmentSize);
  const rangeTrimmed = rangeResult.formatted.trimEnd();
  let {
    cursorOffset
  } = opts2;
  if (cursorOffset > rangeEnd) {
    cursorOffset += rangeTrimmed.length - rangeString.length;
  } else if (rangeResult.cursorOffset >= 0) {
    cursorOffset = rangeResult.cursorOffset + rangeStart;
  }
  let formatted = text.slice(0, rangeStart) + rangeTrimmed + text.slice(rangeEnd);
  if (opts2.endOfLine !== "lf") {
    const eol = convertEndOfLineOptionToCharacter(opts2.endOfLine);
    if (cursorOffset >= 0 && eol === "\r\n") {
      cursorOffset += countEndOfLineCharacters(formatted.slice(0, cursorOffset), "\n");
    }
    formatted = method_replace_all_default(
      /* OPTIONAL_OBJECT: false */
      0,
      formatted,
      "\n",
      eol
    );
  }
  return {
    formatted,
    cursorOffset,
    comments: rangeResult.comments
  };
}
function ensureIndexInText(text, index, defaultValue) {
  if (typeof index !== "number" || Number.isNaN(index) || index < 0 || index > text.length) {
    return defaultValue;
  }
  return index;
}
function normalizeIndexes(text, options7) {
  let {
    cursorOffset,
    rangeStart,
    rangeEnd
  } = options7;
  cursorOffset = ensureIndexInText(text, cursorOffset, -1);
  rangeStart = ensureIndexInText(text, rangeStart, 0);
  rangeEnd = ensureIndexInText(text, rangeEnd, text.length);
  return {
    ...options7,
    cursorOffset,
    rangeStart,
    rangeEnd
  };
}
function normalizeInputAndOptions(text, options7) {
  let {
    cursorOffset,
    rangeStart,
    rangeEnd,
    endOfLine
  } = normalizeIndexes(text, options7);
  const hasBOM = text.charAt(0) === BOM;
  if (hasBOM) {
    text = text.slice(1);
    cursorOffset--;
    rangeStart--;
    rangeEnd--;
  }
  if (endOfLine === "auto") {
    endOfLine = guessEndOfLine(text);
  }
  if (text.includes("\r")) {
    const countCrlfBefore = (index) => countEndOfLineCharacters(text.slice(0, Math.max(index, 0)), "\r\n");
    cursorOffset -= countCrlfBefore(cursorOffset);
    rangeStart -= countCrlfBefore(rangeStart);
    rangeEnd -= countCrlfBefore(rangeEnd);
    text = normalizeEndOfLine(text);
  }
  return {
    hasBOM,
    text,
    options: normalizeIndexes(text, {
      ...options7,
      cursorOffset,
      rangeStart,
      rangeEnd,
      endOfLine
    })
  };
}
async function hasPragma(text, options7) {
  const selectedParser = await resolveParser(options7);
  return !selectedParser.hasPragma || selectedParser.hasPragma(text);
}
async function hasIgnorePragma(text, options7) {
  const selectedParser = await resolveParser(options7);
  return selectedParser.hasIgnorePragma?.(text);
}
async function formatWithCursor(originalText, originalOptions) {
  let {
    hasBOM,
    text,
    options: options7
  } = normalizeInputAndOptions(originalText, await normalize_format_options_default(originalOptions));
  if (options7.rangeStart >= options7.rangeEnd && text !== "" || options7.requirePragma && !await hasPragma(text, options7) || options7.checkIgnorePragma && await hasIgnorePragma(text, options7)) {
    return {
      formatted: originalText,
      cursorOffset: originalOptions.cursorOffset,
      comments: []
    };
  }
  let result;
  if (options7.rangeStart > 0 || options7.rangeEnd < text.length) {
    result = await formatRange(text, options7);
  } else {
    if (!options7.requirePragma && options7.insertPragma && options7.printer.insertPragma && !await hasPragma(text, options7)) {
      text = options7.printer.insertPragma(text);
    }
    result = await coreFormat(text, options7);
  }
  if (hasBOM) {
    result.formatted = BOM + result.formatted;
    if (result.cursorOffset >= 0) {
      result.cursorOffset++;
    }
  }
  return result;
}
async function parse9(originalText, originalOptions, devOptions) {
  const {
    text,
    options: options7
  } = normalizeInputAndOptions(originalText, await normalize_format_options_default(originalOptions));
  const parsed = await parse_default(text, options7);
  if (devOptions) {
    if (devOptions.preprocessForPrint) {
      parsed.ast = await prepareToPrint(parsed.ast, options7);
    }
    if (devOptions.massage) {
      parsed.ast = massage_ast_default(parsed.ast, options7);
    }
  }
  return parsed;
}
async function formatAst(ast, options7) {
  options7 = await normalize_format_options_default(options7);
  const doc2 = await printAstToDoc(ast, options7);
  return printDocToStringWithoutNormalizeOptions(doc2, options7);
}
async function formatDoc(doc2, options7) {
  const text = printDocToDebug(doc2);
  const {
    formatted
  } = await formatWithCursor(text, {
    ...options7,
    parser: "__js_expression"
  });
  return formatted;
}
async function printToDoc(originalText, options7) {
  options7 = await normalize_format_options_default(options7);
  const {
    ast
  } = await parse_default(originalText, options7);
  if (options7.cursorOffset >= 0) {
    options7 = {
      ...options7,
      ...get_cursor_node_default(ast, options7)
    };
  }
  return printAstToDoc(ast, options7);
}
async function printDocToString(doc2, options7) {
  return printDocToStringWithoutNormalizeOptions(doc2, await normalize_format_options_default(options7));
}

// src/main/option-categories.js
var option_categories_exports = {};
__export(option_categories_exports, {
  CATEGORY_CONFIG: () => CATEGORY_CONFIG,
  CATEGORY_EDITOR: () => CATEGORY_EDITOR,
  CATEGORY_FORMAT: () => CATEGORY_FORMAT,
  CATEGORY_GLOBAL: () => CATEGORY_GLOBAL,
  CATEGORY_OTHER: () => CATEGORY_OTHER,
  CATEGORY_OUTPUT: () => CATEGORY_OUTPUT,
  CATEGORY_SPECIAL: () => CATEGORY_SPECIAL
});
var CATEGORY_CONFIG = "Config";
var CATEGORY_EDITOR = "Editor";
var CATEGORY_FORMAT = "Format";
var CATEGORY_OTHER = "Other";
var CATEGORY_OUTPUT = "Output";
var CATEGORY_GLOBAL = "Global";
var CATEGORY_SPECIAL = "Special";

// src/main/plugins/load-builtin-plugins.js
var loadBuiltinPluginsWithoutCache = true ? async () => (await Promise.resolve().then(() => (init_production_plugins(), production_plugins_exports))).plugins : async () => (await null).plugins;
var cache2;
function loadBuiltinPlugins() {
  return cache2 ?? (cache2 = loadBuiltinPluginsWithoutCache());
}
var load_builtin_plugins_default = loadBuiltinPlugins;

// src/main/plugins/load-plugin.js
import path15 from "path";
import { pathToFileURL as pathToFileURL5 } from "url";

// src/utilities/import-from-directory.js
import path14 from "path";
function importFromDirectory(specifier, directory) {
  return import_from_file_default(specifier, path14.join(directory, "noop.js"));
}
var import_from_directory_default = importFromDirectory;

// src/main/plugins/load-plugin.js
async function importPlugin(name, cwd) {
  if (isUrl(name)) {
    return import(name);
  }
  if (path15.isAbsolute(name)) {
    return import(pathToFileURL5(name).href);
  }
  try {
    return await import(pathToFileURL5(path15.resolve(name)).href);
  } catch {
    return import_from_directory_default(name, cwd);
  }
}
async function loadPluginWithoutCache(plugin, cwd) {
  const module = await importPlugin(plugin, cwd);
  const implementation = module.default ?? module;
  const name = isUrl(plugin) ? toPath(plugin) : plugin;
  return { name, ...implementation };
}
var cache3 = /* @__PURE__ */ new Map();
function loadPlugin(plugin) {
  if (typeof plugin !== "string" && !(plugin instanceof URL)) {
    return plugin;
  }
  const cwd = process.cwd();
  const cacheKey = JSON.stringify({ name: plugin, cwd });
  return getOrInsertComputed(
    cache3,
    cacheKey,
    () => loadPluginWithoutCache(plugin, cwd)
  );
}
function clearCache2() {
  cache3.clear();
}

// src/main/plugins/load-plugins.js
function loadPlugins(plugins2 = []) {
  return Promise.all(plugins2.map((plugin) => loadPlugin(plugin)));
}
var load_plugins_default = loadPlugins;

// src/utilities/ignore.js
var import_ignore = __toESM(require_ignore(), 1);
import path16 from "path";
import url2 from "url";
var slash = path16.sep === "\\" ? (filePath) => method_replace_all_default(
  /* OPTIONAL_OBJECT: false */
  0,
  filePath,
  "\\",
  "/"
) : (filePath) => filePath;
function getRelativePath(file, ignoreFile) {
  const ignoreFilePath = toPath(ignoreFile);
  const filePath = isUrl(file) ? url2.fileURLToPath(file) : path16.resolve(file);
  return path16.relative(
    // If there's an ignore-path set, the filename must be relative to the
    // ignore path, not the current working directory.
    ignoreFilePath ? path16.dirname(ignoreFilePath) : process.cwd(),
    filePath
  );
}
async function createSingleIsIgnoredFunction(ignoreFile, withNodeModules) {
  let content = "";
  if (ignoreFile) {
    content += await read_file_default(ignoreFile) ?? "";
  }
  if (!withNodeModules) {
    content += "\nnode_modules";
  }
  if (!content) {
    return;
  }
  const ignore = (0, import_ignore.default)({
    allowRelativePaths: true
  }).add(content);
  return (file) => ignore.checkIgnore(slash(getRelativePath(file, ignoreFile))).ignored;
}
async function createIsIgnoredFunction(ignoreFiles, withNodeModules) {
  if (ignoreFiles.length === 0 && !withNodeModules) {
    ignoreFiles = [void 0];
  }
  const isIgnoredFunctions = (await Promise.all(ignoreFiles.map((ignoreFile) => createSingleIsIgnoredFunction(ignoreFile, withNodeModules)))).filter(Boolean);
  return (file) => isIgnoredFunctions.some((isIgnored2) => isIgnored2(file));
}
async function isIgnored(file, options7) {
  const {
    ignorePath: ignoreFiles,
    withNodeModules
  } = options7;
  const isIgnored2 = await createIsIgnoredFunction(ignoreFiles, withNodeModules);
  return isIgnored2(file);
}

// src/utilities/object-omit.js
function omit(object, keys) {
  keys = new Set(keys);
  return Object.fromEntries(
    Object.entries(object).filter(([key2]) => !keys.has(key2))
  );
}
var object_omit_default = omit;

// src/common/get-file-info.js
async function getFileInfo(file, options7 = {}) {
  if (typeof file !== "string" && !(file instanceof URL)) {
    throw new TypeError(
      `expect \`file\` to be a string or URL, got \`${typeof file}\``
    );
  }
  let { ignorePath, withNodeModules } = options7;
  if (!Array.isArray(ignorePath)) {
    ignorePath = [ignorePath];
  }
  const ignored = await isIgnored(file, { ignorePath, withNodeModules });
  let inferredParser;
  if (!ignored) {
    inferredParser = options7.parser ?? await getParser(file, options7);
  }
  return {
    ignored,
    inferredParser: inferredParser ?? null
  };
}
async function getParser(file, options7) {
  let config;
  if (options7.resolveConfig !== false) {
    config = await resolveConfig(file, {
      // No need read `.editorconfig`
      editorconfig: false
    });
  }
  if (config?.parser) {
    return config.parser;
  }
  let plugins2 = options7.plugins ?? config?.plugins ?? [];
  plugins2 = (await Promise.all([load_builtin_plugins_default(), load_plugins_default(plugins2)])).flat();
  return infer_parser_default({ plugins: plugins2 }, { physicalFile: file });
}
var get_file_info_default = getFileInfo;

// src/index.js
import * as doc from "./doc.mjs";

// src/main/version.evaluate.js
var version_evaluate_default = "3.9.10";

// src/utilities/public.js
var public_exports = {};
__export(public_exports, {
  addDanglingComment: () => addDanglingComment,
  addLeadingComment: () => addLeadingComment,
  addTrailingComment: () => addTrailingComment,
  getAlignmentSize: () => get_alignment_size_default,
  getIndentSize: () => get_indent_size_default,
  getMaxContinuousCount: () => get_max_continuous_count_default,
  getNextNonSpaceNonCommentCharacter: () => get_next_non_space_non_comment_character_default,
  getNextNonSpaceNonCommentCharacterIndex: () => getNextNonSpaceNonCommentCharacterIndex2,
  getPreferredQuote: () => getPreferredQuote,
  getStringWidth: () => get_string_width_default,
  hasNewline: () => has_newline_default,
  hasNewlineInRange: () => has_newline_in_range_default,
  hasSpaces: () => has_spaces_default,
  isNextLineEmpty: () => isNextLineEmpty2,
  isNextLineEmptyAfterIndex: () => is_next_line_empty_default,
  isPreviousLineEmpty: () => isPreviousLineEmpty2,
  makeString: () => makeString,
  skip: () => skip,
  skipEverythingButNewLine: () => skipEverythingButNewLine,
  skipInlineComment: () => skip_inline_comment_default,
  skipNewline: () => skip_newline_default,
  skipSpaces: () => skipSpaces,
  skipToLineEnd: () => skipToLineEnd,
  skipTrailingComment: () => skip_trailing_comment_default,
  skipWhitespace: () => skipWhitespace
});

// src/utilities/skip-inline-comment.js
function skipInlineComment(text, startIndex) {
  if (startIndex === false) {
    return false;
  }
  if (text.charAt(startIndex) === "/" && text.charAt(startIndex + 1) === "*") {
    for (let i = startIndex + 2; i < text.length; ++i) {
      if (text.charAt(i) === "*" && text.charAt(i + 1) === "/") {
        return i + 2;
      }
    }
  }
  return startIndex;
}
var skip_inline_comment_default = skipInlineComment;

// src/utilities/skip-trailing-comment.js
function skipTrailingComment(text, startIndex) {
  if (startIndex === false) {
    return false;
  }
  if (text.charAt(startIndex) === "/" && text.charAt(startIndex + 1) === "/") {
    return skipEverythingButNewLine(text, startIndex);
  }
  return startIndex;
}
var skip_trailing_comment_default = skipTrailingComment;

// src/utilities/get-next-non-space-non-comment-character-index.js
function getNextNonSpaceNonCommentCharacterIndex(text, startIndex) {
  let oldIdx = null;
  let nextIdx = startIndex;
  while (nextIdx !== oldIdx) {
    oldIdx = nextIdx;
    nextIdx = skipSpaces(text, nextIdx);
    nextIdx = skip_inline_comment_default(text, nextIdx);
    nextIdx = skip_trailing_comment_default(text, nextIdx);
    nextIdx = skip_newline_default(text, nextIdx);
  }
  return nextIdx;
}
var get_next_non_space_non_comment_character_index_default = getNextNonSpaceNonCommentCharacterIndex;

// src/utilities/is-next-line-empty.js
function isNextLineEmpty(text, startIndex) {
  let oldIdx = null;
  let idx = startIndex;
  while (idx !== oldIdx) {
    oldIdx = idx;
    idx = skipToLineEnd(text, idx);
    idx = skip_inline_comment_default(text, idx);
    idx = skipSpaces(text, idx);
  }
  idx = skip_trailing_comment_default(text, idx);
  idx = skip_newline_default(text, idx);
  return idx !== false && has_newline_default(text, idx);
}
var is_next_line_empty_default = isNextLineEmpty;

// src/utilities/get-indent-size.js
function getIndentSize(value, tabWidth) {
  const lastNewlineIndex = value.lastIndexOf("\n");
  if (lastNewlineIndex === -1) {
    return 0;
  }
  return get_alignment_size_default(
    // All the leading whitespaces
    value.slice(lastNewlineIndex + 1).match(/^[\t ]*/)[0],
    tabWidth
  );
}
var get_indent_size_default = getIndentSize;

// node_modules/escape-string-regexp/index.js
function escapeStringRegexp(string) {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string");
  }
  return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

// src/utilities/get-max-continuous-count.js
function getMaxContinuousCount(text, searchString) {
  let results = text.matchAll(
    new RegExp(`(?:${escapeStringRegexp(searchString)})+`, "g")
  );
  if (!results.reduce) {
    results = [...results];
  }
  return results.reduce(
    (maxCount, [result]) => Math.max(maxCount, result.length),
    0
  ) / searchString.length;
}
var get_max_continuous_count_default = getMaxContinuousCount;

// src/utilities/get-next-non-space-non-comment-character.js
function getNextNonSpaceNonCommentCharacter(text, startIndex) {
  const index = get_next_non_space_non_comment_character_index_default(text, startIndex);
  return index === false ? "" : text.charAt(index);
}
var get_next_non_space_non_comment_character_default = getNextNonSpaceNonCommentCharacter;

// src/utilities/get-preferred-quote.js
var SINGLE_QUOTE = "'";
var DOUBLE_QUOTE = '"';
var SINGLE_QUOTE_DATA = Object.freeze({
  character: SINGLE_QUOTE,
  codePoint: 39
});
var DOUBLE_QUOTE_DATA = Object.freeze({
  character: DOUBLE_QUOTE,
  codePoint: 34
});
var SINGLE_QUOTE_SETTINGS = Object.freeze({
  preferred: SINGLE_QUOTE_DATA,
  alternate: DOUBLE_QUOTE_DATA
});
var DOUBLE_QUOTE_SETTINGS = Object.freeze({
  preferred: DOUBLE_QUOTE_DATA,
  alternate: SINGLE_QUOTE_DATA
});
function getPreferredQuote(text, preferredQuoteOrPreferSingleQuote) {
  const { preferred, alternate } = preferredQuoteOrPreferSingleQuote === true || preferredQuoteOrPreferSingleQuote === SINGLE_QUOTE ? SINGLE_QUOTE_SETTINGS : DOUBLE_QUOTE_SETTINGS;
  const { length } = text;
  let preferredQuoteCount = 0;
  let alternateQuoteCount = 0;
  for (let index = 0; index < length; index++) {
    const codePoint = text.charCodeAt(index);
    if (codePoint === preferred.codePoint) {
      preferredQuoteCount++;
    } else if (codePoint === alternate.codePoint) {
      alternateQuoteCount++;
    }
  }
  return (preferredQuoteCount > alternateQuoteCount ? alternate : preferred).character;
}

// src/utilities/has-newline-in-range.js
function hasNewlineInRange(text, startIndex, endIndex) {
  for (let i = startIndex; i < endIndex; ++i) {
    if (text.charAt(i) === "\n") {
      return true;
    }
  }
  return false;
}
var has_newline_in_range_default = hasNewlineInRange;

// src/utilities/has-spaces.js
function hasSpaces(text, startIndex, options7 = {}) {
  const idx = skipSpaces(
    text,
    options7.backwards ? startIndex - 1 : startIndex,
    options7
  );
  return idx !== startIndex;
}
var has_spaces_default = hasSpaces;

// src/utilities/public.js
function legacyGetNextNonSpaceNonCommentCharacterIndex(text, node, locEnd) {
  return get_next_non_space_non_comment_character_index_default(text, locEnd(node));
}
function getNextNonSpaceNonCommentCharacterIndex2(text, startIndex) {
  return arguments.length === 2 || typeof startIndex === "number" ? get_next_non_space_non_comment_character_index_default(text, startIndex) : (
    // @ts-expect-error -- expected
    // eslint-disable-next-line prefer-rest-params
    legacyGetNextNonSpaceNonCommentCharacterIndex(...arguments)
  );
}
function legacyIsPreviousLineEmpty(text, node, locStart) {
  return is_previous_line_empty_default(text, locStart(node));
}
function isPreviousLineEmpty2(text, startIndex) {
  return arguments.length === 2 || typeof startIndex === "number" ? is_previous_line_empty_default(text, startIndex) : (
    // @ts-expect-error -- expected
    // eslint-disable-next-line prefer-rest-params
    legacyIsPreviousLineEmpty(...arguments)
  );
}
function legacyIsNextLineEmpty(text, node, locEnd) {
  return is_next_line_empty_default(text, locEnd(node));
}
function makeString(rawText, enclosingQuote, unescapeUnnecessaryEscapes) {
  const otherQuote = enclosingQuote === '"' ? "'" : '"';
  const regex = /\\(.)|(["'])/gs;
  const raw = method_replace_all_default(
    /* OPTIONAL_OBJECT: false */
    0,
    rawText,
    regex,
    (match2, escaped, quote) => {
      if (escaped === otherQuote) {
        return escaped;
      }
      if (quote === enclosingQuote) {
        return "\\" + quote;
      }
      if (quote) {
        return quote;
      }
      return unescapeUnnecessaryEscapes && /^[^\n\r"'0-7\\bfnrt-vx\u2028\u2029]$/.test(escaped) ? escaped : "\\" + escaped;
    }
  );
  return enclosingQuote + raw + enclosingQuote;
}
function isNextLineEmpty2(text, startIndex) {
  return arguments.length === 2 || typeof startIndex === "number" ? is_next_line_empty_default(text, startIndex) : (
    // @ts-expect-error -- expected
    // eslint-disable-next-line prefer-rest-params
    legacyIsNextLineEmpty(...arguments)
  );
}

// src/index.js
function withPlugins(fn, optionsArgumentIndex = 1) {
  return async (...args) => {
    const options7 = args[optionsArgumentIndex] ?? {};
    const { plugins: plugins2 = [] } = options7;
    args[optionsArgumentIndex] = {
      ...options7,
      plugins: (await Promise.all([
        load_builtin_plugins_default(),
        // TODO: standalone version allow `plugins` to be `prettierPlugins` which is an object, should allow that too
        load_plugins_default(plugins2)
      ])).flat()
    };
    return fn(...args);
  };
}
var formatWithCursor2 = withPlugins(formatWithCursor);
async function format2(text, options7) {
  const { formatted } = await formatWithCursor2(text, {
    ...options7,
    cursorOffset: -1
  });
  return formatted;
}
async function check(text, options7) {
  return await format2(text, options7) === text;
}
async function clearCache3() {
  clearCache();
  clearCache2();
}
var getSupportInfo2 = withPlugins(getSupportInfo, 0);
var inferParser2 = withPlugins(
  (file, options7) => infer_parser_default(options7, { physicalFile: file })
);
var sharedWithCli = {
  errors: errors_exports,
  optionCategories: option_categories_exports,
  createIsIgnoredFunction,
  formatOptionsHiddenDefaults,
  normalizeOptions: normalize_options_default,
  getSupportInfoWithoutPlugins: getSupportInfo,
  normalizeOptionSettings,
  inferParser: (file, options7) => Promise.resolve(options7?.parser ?? inferParser2(file, options7)),
  vnopts: {
    ChoiceSchema,
    apiDescriptor
  },
  fastGlob: import_fast_glob.default,
  createTwoFilesPatch,
  picocolors: import_picocolors4.default,
  closetLevenshteinMatch: closestMatch,
  utilities: {
    omit: object_omit_default,
    createMockable: create_mockable_default,
    getOrInsertComputed
  }
};
var debugApis = {
  parse: withPlugins(parse9),
  formatAST: withPlugins(formatAst),
  formatDoc: withPlugins(formatDoc),
  printToDoc: withPlugins(printToDoc),
  printDocToString: withPlugins(printDocToString),
  // Exposed for tests
  mockable
};
export {
  debugApis as __debug,
  sharedWithCli as __internal,
  check,
  clearCache3 as clearConfigCache,
  index_exports as default,
  doc,
  format2 as format,
  formatWithCursor2 as formatWithCursor,
  get_file_info_default as getFileInfo,
  getSupportInfo2 as getSupportInfo,
  resolveConfig,
  resolveConfigFile,
  public_exports as util,
  version_evaluate_default as version
};
