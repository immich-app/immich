import { createRequire as __prettierCreateRequire } from "module";
import { fileURLToPath as __prettierFileUrlToPath } from "url";
import { dirname as __prettierDirname } from "path";
const require = __prettierCreateRequire(import.meta.url);
const __filename = __prettierFileUrlToPath(import.meta.url);
const __dirname = __prettierDirname(__filename);

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/kasi/dist/to_space_case.js
var separatorRe, splitRe, toSpaceCase, to_space_case_default;
var init_to_space_case = __esm({
  "node_modules/kasi/dist/to_space_case.js"() {
    separatorRe = /[.:/_-]/g;
    splitRe = /(^|[a-z ])([A-Z]+)(?=([a-z])?)/g;
    toSpaceCase = (value) => {
      return value.replace(separatorRe, " ").replace(splitRe, (_, $1, $2, $3) => $3 && $2.length > 1 ? `${$1.trim()} ${$2.slice(0, -1)} ${$2.slice(-1)}` : `${$1.trim()} ${$2}`).trim();
    };
    to_space_case_default = toSpaceCase;
  }
});

// node_modules/kasi/dist/to_lower_case.js
var toLowerCase, to_lower_case_default;
var init_to_lower_case = __esm({
  "node_modules/kasi/dist/to_lower_case.js"() {
    init_to_space_case();
    toLowerCase = (value) => {
      return to_space_case_default(value).toLowerCase();
    };
    to_lower_case_default = toLowerCase;
  }
});

// node_modules/kasi/dist/to_camel_case.js
var upperRe, toCamelCase, to_camel_case_default;
var init_to_camel_case = __esm({
  "node_modules/kasi/dist/to_camel_case.js"() {
    init_to_lower_case();
    upperRe = /\s(\w)/g;
    toCamelCase = (value) => {
      return to_lower_case_default(value).replace(upperRe, (_, char) => char.toUpperCase());
    };
    to_camel_case_default = toCamelCase;
  }
});

// scripts/build/shims/shared.js
var OPTIONAL_OBJECT, createMethodShim;
var init_shared = __esm({
  "scripts/build/shims/shared.js"() {
    OPTIONAL_OBJECT = 1;
    createMethodShim = (methodName, getImplementation) => (flags, object, ...arguments_) => {
      if (flags | OPTIONAL_OBJECT && (object === void 0 || object === null)) {
        return;
      }
      const implementation = getImplementation.call(object) ?? object[methodName];
      return implementation.apply(object, arguments_);
    };
  }
});

// scripts/build/shims/method-replace-all.js
var stringReplaceAll, replaceAll, method_replace_all_default;
var init_method_replace_all = __esm({
  "scripts/build/shims/method-replace-all.js"() {
    init_shared();
    stringReplaceAll = String.prototype.replaceAll ?? function(pattern, replacement) {
      if (pattern.global) {
        return this.replace(pattern, replacement);
      }
      return this.split(pattern).join(replacement);
    };
    replaceAll = /* @__PURE__ */ createMethodShim("replaceAll", function() {
      if (typeof this === "string") {
        return stringReplaceAll;
      }
    });
    method_replace_all_default = replaceAll;
  }
});

// node_modules/kasi/dist/to_kebab_case.js
var toKebabCase, to_kebab_case_default;
var init_to_kebab_case = __esm({
  "node_modules/kasi/dist/to_kebab_case.js"() {
    init_method_replace_all();
    init_to_lower_case();
    toKebabCase = (value) => {
      return method_replace_all_default(
        /* OPTIONAL_OBJECT: false */
        0,
        to_lower_case_default(value),
        " ",
        "-"
      );
    };
    to_kebab_case_default = toKebabCase;
  }
});

// node_modules/kasi/dist/index.js
var init_dist = __esm({
  "node_modules/kasi/dist/index.js"() {
    init_to_camel_case();
    init_to_kebab_case();
  }
});

// node_modules/find-up-path/dist/index.js
import fs from "fs";
import path from "path";
import process2 from "process";
var findUpPath, dist_default;
var init_dist2 = __esm({
  "node_modules/find-up-path/dist/index.js"() {
    findUpPath = (fileName, folderPath = process2.cwd(), maxDepth = 25) => {
      let filePath = path.normalize(path.join(folderPath, fileName));
      let depth = 1;
      while (true) {
        if (depth > maxDepth)
          return;
        if (fs.existsSync(filePath))
          return filePath;
        folderPath = path.resolve(folderPath, "..");
        const filePathNext = path.normalize(path.join(folderPath, fileName));
        if (filePathNext === filePath)
          return;
        filePath = filePathNext;
        depth += 1;
      }
    };
    dist_default = findUpPath;
  }
});

// node_modules/find-up-json/dist/utils.js
var attempt;
var init_utils = __esm({
  "node_modules/find-up-json/dist/utils.js"() {
    attempt = (fn, fallback) => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    };
  }
});

// node_modules/find-up-json/dist/index.js
import { Buffer as Buffer2 } from "buffer";
import fs2 from "fs";
import process3 from "process";
var findUp, dist_default2;
var init_dist3 = __esm({
  "node_modules/find-up-json/dist/index.js"() {
    init_dist2();
    init_utils();
    findUp = (fileName, folderPath = process3.cwd(), maxDepth = 25) => {
      const path18 = dist_default(fileName, folderPath, maxDepth);
      if (!path18)
        return;
      const buffer2 = attempt(() => fs2.readFileSync(path18), Buffer2.alloc(0));
      const content = attempt(() => JSON.parse(buffer2.toString()), {});
      return { path: path18, buffer: buffer2, content };
    };
    dist_default2 = findUp;
  }
});

// node_modules/get-current-package/dist/index.js
import fs3 from "fs";
import path2 from "path";
import process4 from "process";
var getCurrentPackage, dist_default3;
var init_dist4 = __esm({
  "node_modules/get-current-package/dist/index.js"() {
    init_dist3();
    getCurrentPackage = () => {
      try {
        const filePath = fs3.realpathSync(process4.argv[1]);
        const folderPath = path2.dirname(filePath);
        const pkg = dist_default2("package.json", folderPath);
        return pkg?.content;
      } catch {
        return;
      }
    };
    dist_default3 = getCurrentPackage;
  }
});

// node_modules/tiny-colors/dist/constants.js
var ENV, ARGV, ENABLED;
var init_constants = __esm({
  "node_modules/tiny-colors/dist/constants.js"() {
    ENV = globalThis.process?.env || {};
    ARGV = globalThis.process?.argv || [];
    ENABLED = !("NO_COLOR" in ENV) && ENV.COLOR !== "0" && ENV.TERM !== "dumb" && !ARGV.includes("--no-color") && !ARGV.includes("--no-colors") && (ENV.COLOR === "1" || !globalThis.process?.stdout || globalThis.process?.stdout?.isTTY === true);
  }
});

// node_modules/tiny-colors/dist/index.js
var chain, wrap, colors, dist_default4;
var init_dist5 = __esm({
  "node_modules/tiny-colors/dist/index.js"() {
    init_constants();
    chain = (modifier) => {
      return new Proxy(modifier, {
        get(target, prop) {
          if (prop in colors) {
            return chain((string2) => modifier(colors[prop](string2)));
          } else {
            return target[prop];
          }
        }
      });
    };
    wrap = (start, end) => {
      return chain((string2) => {
        if (!ENABLED)
          return string2;
        return `\x1B[${start}m${string2}\x1B[${end}m`;
      });
    };
    colors = {
      /* MODIFIERS */
      reset: wrap(0, 0),
      bold: wrap(1, 22),
      dim: wrap(2, 22),
      italic: wrap(3, 23),
      underline: wrap(4, 24),
      overline: wrap(53, 55),
      inverse: wrap(7, 27),
      hidden: wrap(8, 28),
      strikethrough: wrap(9, 29),
      /* FOREGOUND */
      black: wrap(30, 39),
      red: wrap(31, 39),
      green: wrap(32, 39),
      yellow: wrap(33, 39),
      blue: wrap(34, 39),
      magenta: wrap(35, 39),
      cyan: wrap(36, 39),
      white: wrap(37, 39),
      gray: wrap(90, 39),
      /* BACKGROUND */
      bgBlack: wrap(40, 49),
      bgRed: wrap(41, 49),
      bgGreen: wrap(42, 49),
      bgYellow: wrap(43, 49),
      bgBlue: wrap(44, 49),
      bgMagenta: wrap(45, 49),
      bgCyan: wrap(46, 49),
      bgWhite: wrap(47, 49),
      bgGray: wrap(100, 49)
    };
    dist_default4 = colors;
  }
});

// node_modules/tiny-bin/dist/objects/addon.js
var Addon, addon_default;
var init_addon = __esm({
  "node_modules/tiny-bin/dist/objects/addon.js"() {
    Addon = class {
      /* CONSTRUCTOR */
      constructor(bin2) {
        this.bin = bin2;
        this.stdout = bin2.stdout;
        this.stderr = bin2.stderr;
      }
    };
    addon_default = Addon;
  }
});

// node_modules/ansi-purge/dist/constants.js
var ANSI_RE;
var init_constants2 = __esm({
  "node_modules/ansi-purge/dist/constants.js"() {
    ANSI_RE = /([\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|\u001b\]8;[^;]*;.*?(?:\u0007|\u001b\u005c))/g;
  }
});

// node_modules/ansi-purge/dist/index.js
var purge, dist_default5;
var init_dist6 = __esm({
  "node_modules/ansi-purge/dist/index.js"() {
    init_constants2();
    purge = (str) => {
      return str.replace(ANSI_RE, "");
    };
    dist_default5 = purge;
  }
});

// node_modules/tiny-levenshtein/dist/matrix.js
var Matrix, matrix_default;
var init_matrix = __esm({
  "node_modules/tiny-levenshtein/dist/matrix.js"() {
    Matrix = class {
      /* CONSTRUCTOR */
      constructor(rows, columns, Buffer3 = Uint32Array) {
        this.rows = rows;
        this.columns = columns;
        this.buffer = new Buffer3(this.rows * this.columns);
      }
      /* API */
      get(row, column2) {
        const index = row * this.columns + column2;
        return this.buffer[index];
      }
      set(row, column2, value) {
        const index = row * this.columns + column2;
        return this.buffer[index] = value;
      }
    };
    matrix_default = Matrix;
  }
});

// node_modules/tiny-levenshtein/dist/index.js
var levenshtein, dist_default6;
var init_dist7 = __esm({
  "node_modules/tiny-levenshtein/dist/index.js"() {
    init_matrix();
    levenshtein = (a, b) => {
      if (a === b)
        return 0;
      let start = 0;
      let aEnd = a.length - 1;
      let bEnd = b.length - 1;
      while (start <= aEnd && start <= bEnd) {
        if (a[start] !== b[start])
          break;
        start += 1;
      }
      while (aEnd >= start && bEnd >= start) {
        if (a[aEnd] !== b[bEnd])
          break;
        aEnd -= 1;
        bEnd -= 1;
      }
      const aLength = aEnd - start + 1;
      const bLength = bEnd - start + 1;
      if (!aLength)
        return bLength;
      if (!bLength)
        return aLength;
      const maxDistance = Math.max(aLength, bLength);
      const Buffer3 = maxDistance < 255 ? Uint8Array : maxDistance < 65535 ? Uint16Array : Uint32Array;
      const matrix = new matrix_default(aLength + 1, bLength + 1, Buffer3);
      for (let i = 1, l = aLength; i <= l; i++) {
        matrix.set(i, 0, i);
      }
      for (let i = 1, l = bLength; i <= l; i++) {
        matrix.set(0, i, i);
      }
      for (let i = 1; i <= aLength; i++) {
        for (let j = 1; j <= bLength; j++) {
          const cost = a[start + i - 1] === b[start + j - 1] ? 0 : 1;
          const deletion = matrix.get(i - 1, j) + 1;
          const insertion = matrix.get(i, j - 1) + 1;
          const substitution = matrix.get(i - 1, j - 1) + cost;
          const value = Math.min(deletion, insertion, substitution);
          matrix.set(i, j, value);
        }
      }
      const distance = matrix.get(aLength, bLength);
      return distance;
    };
    dist_default6 = levenshtein;
  }
});

// node_modules/tiny-parse-argv/dist/utils.js
var castArray, isBoolean, isNil, isNull, isOverridable, isUndefined, setNormal, setVariadic, uniq, uniqBy, without, zip;
var init_utils2 = __esm({
  "node_modules/tiny-parse-argv/dist/utils.js"() {
    castArray = (value) => {
      return Array.isArray(value) ? value : [value];
    };
    isBoolean = (value) => {
      return value === true || value === false;
    };
    isNil = (value) => {
      return value === null || value === void 0;
    };
    isNull = (value) => {
      return value === null;
    };
    isOverridable = (value) => {
      return isNil(value) || isBoolean(value) || value === "";
    };
    isUndefined = (value) => {
      return value === void 0;
    };
    setNormal = (target, key2, value, override) => {
      if (override) {
        target[key2] = value;
      } else if (Array.isArray(target[key2])) {
        target[key2].push(value);
      } else if (isOverridable(target[key2])) {
        target[key2] = value;
      } else {
        target[key2] = [target[key2], value];
      }
    };
    setVariadic = (target, key2, value, override) => {
      const values = castArray(value);
      if (override) {
        target[key2] = values;
      } else if (Array.isArray(target[key2])) {
        target[key2].push(...values);
      } else if (isOverridable(target[key2])) {
        target[key2] = values;
      } else {
        target[key2] = [target[key2], ...values];
      }
    };
    uniq = (values) => {
      return Array.from(new Set(values));
    };
    uniqBy = (values, iterator) => {
      const ids = /* @__PURE__ */ new Set();
      return values.filter((value, index, arr) => {
        const id = iterator(value, index, arr);
        if (ids.has(id))
          return false;
        ids.add(id);
        return true;
      });
    };
    without = (values, value) => {
      return values.filter((other) => other !== value);
    };
    zip = (keys, value) => {
      return Object.fromEntries(Array.from(keys).map((key2) => [key2, value]));
    };
  }
});

// node_modules/tiny-parse-argv/dist/index.js
var getAliasesMap, getAliasedMap, getAliasedSet, getAliasedDefaults, getAliasedIncompatibles, setAliased, parseDoubleHyphen, parseWithRegExp, parseCharSeparator, parseEqualsSeparator, parseImplicitSeparator, parseProto, parseOption, parseOptionNegation, parseValue, unquote, parseArgv, dist_default7;
var init_dist8 = __esm({
  "node_modules/tiny-parse-argv/dist/index.js"() {
    init_utils2();
    getAliasesMap = (aliases = {}) => {
      const map = {};
      for (const key2 in aliases) {
        const values = uniq([key2, ...aliases[key2] || []]);
        for (const value of values) {
          if (value in map)
            continue;
          map[value] = without(values, value);
        }
      }
      return map;
    };
    getAliasedMap = (aliases, object) => {
      const map = /* @__PURE__ */ new Map();
      for (const key2 in object) {
        const value = object[key2];
        if (isUndefined(value))
          continue;
        map.set(key2, value);
        const keyAliases = aliases[key2];
        if (!keyAliases)
          continue;
        for (const key3 of keyAliases) {
          map.set(key3, value);
        }
      }
      return map;
    };
    getAliasedSet = (aliases, values = []) => {
      const valuesAliases = values.flatMap((value) => aliases[value] || []);
      const valuesAliased = /* @__PURE__ */ new Set([...values, ...valuesAliases]);
      return valuesAliased;
    };
    getAliasedDefaults = (aliases, defaults = {}) => {
      const defaultsAliased = {};
      for (const key2 in defaults) {
        const value = defaults[key2];
        const keys = uniq([key2, ...aliases[key2] || []]);
        for (const key3 of keys) {
          if (key3 in defaultsAliased)
            continue;
          defaultsAliased[key3] = value;
        }
      }
      return defaultsAliased;
    };
    getAliasedIncompatibles = (aliases, incompatibles = {}) => {
      const incompatiblesAliased = {};
      for (const source2 in incompatibles) {
        const sources = getAliasedSet(aliases, [source2]);
        const targets = getAliasedSet(aliases, incompatibles[source2]);
        for (const source3 of sources) {
          for (const target of targets) {
            const sourceSet = incompatiblesAliased[source3] || (incompatiblesAliased[source3] = /* @__PURE__ */ new Set());
            const targetSet = incompatiblesAliased[target] || (incompatiblesAliased[target] = /* @__PURE__ */ new Set());
            sourceSet.add(target);
            targetSet.add(source3);
          }
        }
      }
      return incompatiblesAliased;
    };
    setAliased = (target, key2, value, unary, variadic, aliases) => {
      const set3 = variadic ? setVariadic : setNormal;
      set3(target, key2, value, unary);
      aliases[key2]?.forEach((alias) => {
        set3(target, alias, value, unary);
      });
    };
    parseDoubleHyphen = (argv) => {
      const index = argv.indexOf("--");
      if (index < 0)
        return [argv, []];
      const parse8 = argv.slice(0, index);
      const preserve = argv.slice(index + 1);
      return [parse8, preserve];
    };
    parseWithRegExp = (argv, re, callback) => {
      return argv.flatMap((arg) => {
        const match2 = re.exec(arg);
        if (!match2)
          return arg;
        return callback(...match2);
      });
    };
    parseCharSeparator = (argv) => {
      const re = /^-([a-zA-Z0-9\.]{2,})([^]*)$/;
      return parseWithRegExp(argv, re, (_, chars2) => chars2.split("").map((char) => `-${char}`));
    };
    parseEqualsSeparator = (argv) => {
      const re = /^(--?[^=][^=]*?)=([^]*)$/;
      const shieldValue = (value) => value.startsWith("-") ? `"${value}"` : value;
      return parseWithRegExp(argv, re, (_, key2, value) => [key2, shieldValue(value)]);
    };
    parseImplicitSeparator = (argv) => {
      const re = /^(--?(?:no-)?\S*?[a-zA-Z]\S*?)((?:[0-9\/]|-(?=$))[^]*)$/;
      return parseWithRegExp(argv, re, (_, key2, value) => [key2, value]);
    };
    parseProto = (argv) => {
      const re = /^--?(no-)?(__proto__|prototype|constructor)$/;
      return argv.filter((arg, index) => !re.test(arg) && !re.test(argv[index - 1]));
    };
    parseOption = (arg) => {
      const optionRe = /^(--?)([^]+)$/;
      const match2 = optionRe.exec(arg);
      if (!match2)
        return;
      return match2[2];
    };
    parseOptionNegation = (arg) => {
      const negationRe = /^no-([^]+)$/;
      const match2 = negationRe.exec(arg);
      if (!match2)
        return [arg, true];
      return [match2[1], false];
    };
    parseValue = (key2, valueRaw, booleans, integers, numbers, strings, validators) => {
      const value = unquote(String(valueRaw));
      if (validators.get(key2)?.(value) === false) {
        return null;
      }
      if (booleans.has(key2)) {
        if (value === "true")
          return true;
        if (value === "false")
          return false;
      }
      if (integers.has(key2)) {
        const integer = Number(value);
        if (Number.isInteger(integer))
          return integer;
        return null;
      }
      if (numbers.has(key2)) {
        const number = Number(value);
        if (!Number.isNaN(number))
          return number;
        return null;
      }
      if (strings.has(key2) || value !== valueRaw) {
        return value;
      }
      const numberRe = /^0[xX][0-9a-fA-F]+$|^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/;
      if (numberRe.test(value)) {
        return Number(value);
      } else {
        return value;
      }
    };
    unquote = (value) => {
      return value.replace(/^(['"])(\1*)(.*)(\1\2)$/, "$3");
    };
    parseArgv = (argv, options = {}) => {
      const aliases = getAliasesMap(options.alias);
      const booleans = getAliasedSet(aliases, options.boolean);
      const integers = getAliasedSet(aliases, options.integer);
      const numbers = getAliasedSet(aliases, options.number);
      const strings = getAliasedSet(aliases, options.string);
      const eagers = getAliasedSet(aliases, options.eager);
      const unarys = getAliasedSet(aliases, options.unary);
      const variadics = getAliasedSet(aliases, options.variadic);
      const defaults = getAliasedDefaults(aliases, options.default);
      const incompatibles = getAliasedIncompatibles(aliases, options.incompatible);
      const validators = getAliasedMap(aliases, options.validators);
      const required = options.required || [];
      const known = /* @__PURE__ */ new Set([...booleans, ...integers, ...numbers, ...strings, ...Object.keys(defaults)]);
      const found = [];
      const onIncompatible = options.onIncompatible;
      const onInvalid = options.onInvalid;
      const onMissing = options.onMissing;
      const onUnknown = options.onUnknown;
      const [parse8, preserve] = parseDoubleHyphen(argv);
      const parsed = { _: [], "--": preserve };
      const args = parseCharSeparator(parseImplicitSeparator(parseEqualsSeparator(parseProto(parse8))));
      let optionPrev = "";
      let optionEagerPrev = "";
      for (let i = 0, l = args.length; i < l; i++) {
        const arg = args[i];
        const option = parseOption(arg);
        if (option) {
          const [key2, positive] = parseOptionNegation(option);
          if (isOverridable(parsed[key2])) {
            if (!integers.has(key2) && !numbers.has(key2) && !strings.has(key2)) {
              const unary = unarys.has(key2);
              const variadic = variadics.has(key2);
              const value = variadic ? [positive] : positive;
              setAliased(parsed, key2, value, unary, variadic, aliases);
            }
          }
          found.push(key2);
          optionPrev = option;
          optionEagerPrev = eagers.has(key2) ? option : "";
        } else {
          const value = parseValue(optionPrev, arg, booleans, integers, numbers, strings, validators);
          if (optionPrev && (!booleans.has(optionPrev) || isBoolean(value))) {
            if (!isNull(value)) {
              const unary = unarys.has(optionPrev);
              const variadic = variadics.has(optionPrev);
              setAliased(parsed, optionPrev, value, unary, variadic, aliases);
            }
          } else if (optionEagerPrev && !booleans.has(optionEagerPrev)) {
            if (!isNull(value)) {
              const unary = unarys.has(optionEagerPrev);
              const variadic = variadics.has(optionEagerPrev);
              setAliased(parsed, optionEagerPrev, value, unary, variadic, aliases);
            }
          } else {
            parsed._.push(String(value ?? arg));
            optionEagerPrev = "";
          }
          optionPrev = "";
        }
      }
      const parsedWithDefaults = { ...defaults, ...parsed };
      const parsedWithDefaultsAndBooleans = { ...zip(booleans, false), ...parsedWithDefaults };
      if (onUnknown) {
        const unknowns = Object.keys(parsedWithDefaults).filter((key2) => key2 !== "_" && key2 !== "--" && !known.has(key2));
        if (unknowns.length) {
          onUnknown(unknowns);
        }
      }
      if (onMissing) {
        const missings = required.filter((key2) => !(key2 in parsedWithDefaults));
        if (missings.length) {
          onMissing(missings);
        }
      }
      if (onInvalid) {
        const invalids = found.filter((key2) => parsedWithDefaults[key2] === void 0);
        if (invalids.length) {
          onInvalid(invalids);
        }
      }
      if (onIncompatible) {
        const options2 = uniq(found);
        const pairs = [];
        for (let si = 0, sl = options2.length; si < sl; si++) {
          const source2 = options2[si];
          const sourceIncompatibles = incompatibles[source2];
          if (!sourceIncompatibles)
            continue;
          for (let ti = si + 1, tl = sl; ti < tl; ti++) {
            const target = options2[ti];
            if (!sourceIncompatibles.has(target))
              continue;
            pairs.push([source2, target]);
          }
        }
        if (pairs.length) {
          const pairsUnique = uniqBy(pairs, (pair) => [...pair].sort().join());
          onIncompatible(pairsUnique);
        }
      }
      return parsedWithDefaultsAndBooleans;
    };
    dist_default7 = parseArgv;
  }
});

// node_modules/tiny-bin/dist/objects/utils.js
var castArray2, getClosest, groupBy, identity, isArray, isObject, isUndefined2, pushBack, sum;
var init_utils3 = __esm({
  "node_modules/tiny-bin/dist/objects/utils.js"() {
    init_dist6();
    init_dist();
    init_dist7();
    init_dist8();
    castArray2 = (value) => {
      return Array.isArray(value) ? value : [value];
    };
    getClosest = (values, value, maxDistance = 3, caseInsensitive = false) => {
      if (!values.length)
        return;
      const target = caseInsensitive ? value.toLowerCase() : value;
      const targets = caseInsensitive ? values.map((value2) => value2.toLowerCase()) : values;
      const distances = targets.map((other) => dist_default6(target, other));
      const minDistance = Math.min(...distances);
      if (minDistance > maxDistance)
        return;
      const minDistanceIndex = distances.indexOf(minDistance);
      const closest = values[minDistanceIndex];
      return closest;
    };
    groupBy = (values, iterator) => {
      const groups = /* @__PURE__ */ new Map();
      for (let i = 0, l = values.length; i < l; i++) {
        const value = values[i];
        const key2 = iterator(value, i, values);
        const group = groups.get(key2) || [];
        group.push(value);
        groups.set(key2, group);
      }
      return groups;
    };
    identity = (value) => {
      return value;
    };
    isArray = (value) => {
      return Array.isArray(value);
    };
    isObject = (value) => {
      return typeof value === "object" && value !== null;
    };
    isUndefined2 = (value) => {
      return value === void 0;
    };
    pushBack = (map, key2) => {
      const value = map.get(key2);
      if (isUndefined2(value))
        return map;
      map.delete(key2);
      map.set(key2, value);
      return map;
    };
    sum = (numbers) => {
      return numbers.reduce((acc, value) => acc + value, 0);
    };
  }
});

// node_modules/tiny-bin/dist/objects/collection.js
var Collection, collection_default;
var init_collection = __esm({
  "node_modules/tiny-bin/dist/objects/collection.js"() {
    init_addon();
    init_utils3();
    Collection = class extends addon_default {
      constructor() {
        super(...arguments);
        this.list = [];
        this.map = /* @__PURE__ */ new Map();
      }
      /* API */
      getAll() {
        return this.list;
      }
      getById(id) {
        return this.getByIds([id])?.value;
      }
      getByIdOrFail(id) {
        const value = this.getById(id);
        if (value)
          return value;
        const ids = Array.from(this.map.keys());
        const closest = getClosest(ids, id, 3, true);
        this.bin.fail(`Not found "${id}"${closest ? `. Did you mean "${closest}"?` : ""}`);
      }
      getByIds(ids) {
        for (const id of ids) {
          const value = this.map.get(id);
          if (!value)
            continue;
          return { id, value };
        }
      }
      register(value, override = false) {
        const existing = this.getByIds(value.ids);
        if (existing && override) {
          const index = this.list.indexOf(existing.value);
          existing.value.ids.forEach((id) => this.map.delete(id));
          value.ids.forEach((id) => this.map.set(id, value));
          this.list.splice(index, 1, value);
        } else {
          value.ids.forEach((id) => this.map.set(id, value));
          this.list.push(value);
        }
      }
    };
    collection_default = Collection;
  }
});

// node_modules/tiny-bin/dist/objects/arguments.js
var Arguments, arguments_default;
var init_arguments = __esm({
  "node_modules/tiny-bin/dist/objects/arguments.js"() {
    init_dist5();
    init_collection();
    Arguments = class extends collection_default {
      /* API */
      print(mode) {
        const args = this.getAll();
        if (!args.length)
          return;
        const table = args.map((arg) => [
          dist_default4.yellow(arg.name),
          arg.description
        ]);
        this.stdout.group("ARGUMENTS", () => {
          this.stdout.table(table, mode);
        });
      }
    };
    arguments_default = Arguments;
  }
});

// node_modules/tiny-bin/dist/objects/options.js
var Options, options_default;
var init_options = __esm({
  "node_modules/tiny-bin/dist/objects/options.js"() {
    init_dist5();
    init_collection();
    init_utils3();
    Options = class extends collection_default {
      /* API */
      print(mode) {
        const options = this.getAll();
        if (!options.length)
          return;
        const optionsVisible = options.filter((option) => !option.hidden);
        if (!optionsVisible.length)
          return;
        const withoutOther = (section) => section.toLowerCase() !== "other" ? section : "";
        const optionsBySection = pushBack(groupBy(optionsVisible, (option) => withoutOther(option.section.toLowerCase())), "");
        optionsBySection.forEach((options2, section) => {
          if (!options2.length)
            return;
          const title = section ? `${section.toUpperCase()} OPTIONS` : optionsBySection.size > 1 ? "OTHER OPTIONS" : "OPTIONS";
          const table = options2.map((option) => {
            const withDeprecated = option.deprecated ? dist_default4.dim : identity;
            return [
              [
                [
                  ...option.data.longs.sort().map((long) => dist_default4.green(`--${long}`)),
                  ...option.data.shorts.sort().map((short) => dist_default4.green(`-${short}`))
                ].join(", "),
                [
                  ...option.data.args.sort().map((arg) => dist_default4.blue(`<${arg}${option.variadic ? "..." : ""}>`))
                ].join(" ")
              ].join(" "),
              option.description
            ].map(withDeprecated);
          });
          this.stdout.group(title, () => {
            this.stdout.table(table, mode);
          });
        });
      }
    };
    options_default = Options;
  }
});

// node_modules/tiny-bin/dist/objects/usage.js
var Usage, usage_default;
var init_usage = __esm({
  "node_modules/tiny-bin/dist/objects/usage.js"() {
    init_dist5();
    init_addon();
    init_utils3();
    Usage = class extends addon_default {
      constructor() {
        super(...arguments);
        this.usages = /* @__PURE__ */ new Set();
      }
      /* API */
      print(command) {
        this.stdout.group("USAGE", () => {
          if (this.usages.size) {
            this.usages.forEach((usage) => {
              this.stdout.print(usage);
            });
          } else {
            const isCommandDefault = command === this.bin.command;
            const binName = this.bin.config.name;
            const commandName = isCommandDefault ? "" : dist_default4.magenta(command.name);
            const name = [binName, commandName].filter(identity).join(" ");
            const commands = isCommandDefault && !command.handler ? dist_default4.magenta("[command]") : "";
            const args = command.arguments.getAll().map((arg) => dist_default4.yellow(arg.name)).join(" ");
            const isOptionRequired = (option) => option.required && isUndefined2(option.default) && !option.hidden;
            const optionsGlobalRequired = !isCommandDefault ? this.bin.command.options.getAll().filter(isOptionRequired) : [];
            const optionsLocalRequired = command.options.getAll().filter(isOptionRequired);
            const optionsRequired = [...optionsGlobalRequired, ...optionsLocalRequired];
            const options = optionsRequired.map((option) => {
              const flagName = option.data.longs[0] || option.data.shorts[0];
              const flag = dist_default4.green(`--${flagName}`);
              const argName = option.data.args[0];
              const argVariadic = option.variadic ? "..." : "";
              const arg = argName ? dist_default4.blue(`<${argName}${argVariadic}>`) : "";
              return [flag, arg].filter(identity).join(" ");
            }).join(" ");
            const line2 = [name, commands, options, args].filter(identity).join(" ");
            this.stdout.print(line2);
          }
        });
      }
      register(usage) {
        this.usages.add(usage);
      }
    };
    usage_default = Usage;
  }
});

// node_modules/tiny-bin/dist/objects/command.js
var Command, command_default;
var init_command = __esm({
  "node_modules/tiny-bin/dist/objects/command.js"() {
    init_addon();
    init_arguments();
    init_options();
    init_usage();
    Command = class extends addon_default {
      /* CONSTRUCTOR */
      constructor(bin2, options) {
        super(bin2);
        this.arguments = new arguments_default(this.bin);
        this.options = new options_default(this.bin);
        this.usage = new usage_default(this.bin);
        this.ids = [this.parse(options.name)];
        this.name = options.name;
        this.description = options.description || "";
        this.section = options.section || "";
        this.deprecated = !!options.deprecated;
        this.hidden = !!options.hidden;
      }
      /* PRIVATE API */
      parse(name) {
        const re = /^_?[a-z][a-z-]*$/;
        const isValid = re.test(name);
        if (!isValid)
          this.bin.fail(`Invalid command: "${name}"`);
        return name;
      }
      /* API */
      async run(options, argv) {
        if (!this.handler) {
          this.bin.fail(`Command handler not defined for command: "${this.name}"`);
        } else {
          return this.handler(options, options._, options["--"]);
        }
      }
    };
    command_default = Command;
  }
});

// node_modules/tiny-bin/dist/objects/command_default.js
var CommandDefault, command_default_default;
var init_command_default = __esm({
  "node_modules/tiny-bin/dist/objects/command_default.js"() {
    init_command();
    init_utils3();
    CommandDefault = class extends command_default {
      /* CONSTRUCTOR */
      constructor(bin2) {
        super(bin2, {
          name: "_default",
          description: "Execute the default action",
          hidden: true
        });
      }
      /* API */
      async run(options, argv) {
        const name = this.bin.commands.getById(options._[0]) ? options._[0] : this.name;
        if (options["help"] || name === "help") {
          return this.bin.commands.run("help", options, argv);
        } else if (options["version"] || options["v"]) {
          return this.bin.commands.run("_version", options, argv);
        } else {
          const isDefault = name === this.name;
          if (isDefault && !this.handler) {
            this.bin.fail("Command handler not defined for default command");
          }
          const command = this.bin.commands.getByIdOrFail(name);
          const options2 = [...this.bin.command.options.getAll(), ...command.options.getAll()];
          const minArgs = command.arguments.getAll().filter((arg) => arg.required).length;
          const maxArgs = sum(command.arguments.getAll().map((arg) => arg.variadic ? Infinity : 1));
          const parseArgvOptions = {
            known: [],
            boolean: [],
            integer: [],
            number: [],
            string: [],
            eager: [],
            required: [],
            unary: [],
            variadic: [],
            alias: {},
            default: {},
            incompatible: {},
            validators: {},
            onIncompatible: (options3) => {
              this.bin.fail(`Incompatible options: "${options3[0][0]}" and "${options3[0][1]}" cannot be used together`);
            },
            onInvalid: (options3) => {
              this.bin.fail(`Invalid value for "${options3[0]}" option`);
            },
            onMissing: (options3) => {
              this.bin.fail(`Missing required option: "${options3[0]}"`);
            },
            onUnknown: (options3) => {
              const closest = getClosest(parseArgvOptions.known, options3[0], 3, true);
              this.bin.fail(`Unknown option: "${options3[0]}"${closest ? `. Did you mean "${closest}"?` : ""}`);
            }
          };
          options2.forEach((option) => {
            var _a, _b;
            parseArgvOptions.known.push(...option.data.alls);
            if (option.data.type === "boolean") {
              parseArgvOptions.boolean.push(...option.data.alls);
            }
            if (option.data.type === "integer") {
              parseArgvOptions.integer.push(...option.data.alls);
            }
            if (option.data.type === "number") {
              parseArgvOptions.number.push(...option.data.alls);
            }
            if (option.data.type === "string") {
              parseArgvOptions.string.push(...option.data.alls);
            }
            if (option.eager) {
              parseArgvOptions.eager.push(...option.data.alls);
            }
            if (option.incompatible) {
              const incompatible = (_a = parseArgvOptions.incompatible)[_b = option.data.alls[0]] || (_a[_b] = []);
              incompatible.push(...option.incompatible);
            }
            if (option.required) {
              parseArgvOptions.required.push(...option.data.alls);
            }
            if (!option.variadic) {
              parseArgvOptions.unary.push(...option.data.alls);
            }
            if (option.variadic) {
              parseArgvOptions.variadic.push(...option.data.alls);
            }
            if (option.validate) {
              parseArgvOptions.validators[option.data.alls[0]] = option.validate;
            }
            if ("default" in option) {
              parseArgvOptions.default[option.data.alls[0]] = option.default;
            }
            const [first, ...rest] = option.data.alls;
            parseArgvOptions.alias[first] = rest;
          });
          const parsed = dist_default7(argv, parseArgvOptions);
          options2.forEach((option) => {
            if (option.data.type !== "string")
              return;
            const name2 = option.data.alls[0];
            const value = parsed[name2];
            if (!value)
              return;
            const enums = option.enum;
            if (!enums)
              return;
            const values = castArray2(value);
            values.forEach((value2) => {
              if (enums.includes(value2))
                return;
              this.bin.fail(`Invalid value for "${option.data.alls[0]}" option, received "${value2}" but only ${enums.map((e) => `"${e}"`).join(", ")} are supported`);
            });
          });
          options2.forEach((option) => {
            const name2 = option.data.alls[0];
            const value = parsed[name2];
            if (!isArray(value))
              return;
            if (value.length < 2)
              return;
            if (option.variadic)
              return;
            this.bin.fail(`Expected 1 value for "${option.data.alls[0]}" option, but received "${value.length}" values`);
          });
          Object.keys(parsed).forEach((key2) => {
            const camelKey = to_camel_case_default(key2);
            if (camelKey === key2)
              return;
            parsed[camelKey] = parsed[key2];
          });
          if (!isDefault) {
            parsed._.shift();
          }
          const actualArgs = parsed._.length;
          if (actualArgs < minArgs || actualArgs > maxArgs) {
            if (minArgs === maxArgs) {
              this.bin.fail(`Expected ${minArgs} arguments, but received ${actualArgs} arguments`);
            } else {
              this.bin.fail(`Expected between ${minArgs} and ${maxArgs} arguments, but received ${actualArgs} arguments`);
            }
          }
          if (isDefault) {
            return this.handler(parsed, parsed._, parsed["--"]);
          } else {
            return command.run(parsed, argv);
          }
        }
      }
    };
    command_default_default = CommandDefault;
  }
});

// node_modules/tiny-bin/dist/objects/argument.js
var Argument, argument_default;
var init_argument = __esm({
  "node_modules/tiny-bin/dist/objects/argument.js"() {
    init_addon();
    Argument = class extends addon_default {
      /* CONSTRUCTOR */
      constructor(bin2, options) {
        super(bin2);
        this.ids = [this.parse(options.name)];
        this.name = options.name;
        this.description = options.description || "";
        this.required = options.name[0] === "<";
        this.variadic = options.name.includes("...");
      }
      /* PRIVATE API */
      parse(name) {
        const re = /^\[([^\].]+)(?:\.\.\.)?\]$|^<([^>.]+)(?:\.\.\.)?>$/;
        const match2 = re.exec(name);
        if (!match2)
          this.bin.fail(`Invalid argument: "${name}"`);
        const id = match2[1] || match2[2];
        return id;
      }
    };
    argument_default = Argument;
  }
});

// node_modules/tiny-bin/dist/objects/command_help.js
var CommandHelp, command_help_default;
var init_command_help = __esm({
  "node_modules/tiny-bin/dist/objects/command_help.js"() {
    init_collection();
    init_command();
    init_argument();
    CommandHelp = class extends command_default {
      /* CONSTRUCTOR */
      constructor(bin2) {
        super(bin2, {
          name: "help",
          description: "Display help for the command"
        });
        this.arguments.register(new argument_default(bin2, { name: "[command]", description: "The command to display help for" }));
      }
      /* PRIVATE API */
      getPrintMode(collections) {
        return collections.some((collection) => collection.getAll().some((item) => item.description.includes("\n"))) ? "lines" : "line";
      }
      /* API */
      async run(options, argv) {
        const [arg1, arg2] = options._;
        const hasCustomCommands = this.bin.commands.getAll().length > 3;
        const name = arg1 === "help" ? arg2 || (options["help"] ? arg1 : "") : hasCustomCommands ? arg1 : "";
        if (name) {
          const command = this.bin.commands.getByIdOrFail(name);
          const mode = this.getPrintMode([command.arguments, command.options, this.bin.command.options]);
          this.stdout.indent();
          this.stdout.print();
          this.bin.config.print();
          command.usage.print(command);
          command.arguments.print(mode);
          this.bin.command.options.print(mode);
          command.options.print(mode);
          this.stdout.dedent();
        } else {
          const mode = this.getPrintMode([this.bin.command.arguments, this.bin.command.options, this.bin.commands]);
          this.stdout.indent();
          this.stdout.print();
          this.bin.config.print();
          this.bin.command.usage.print(this.bin.command);
          this.bin.command.arguments.print(mode);
          this.bin.command.options.print(mode);
          if (hasCustomCommands) {
            this.bin.commands.print(mode);
          }
          this.stdout.dedent();
        }
      }
    };
    command_help_default = CommandHelp;
  }
});

// node_modules/tiny-bin/dist/objects/command_version.js
var CommandVersion, command_version_default;
var init_command_version = __esm({
  "node_modules/tiny-bin/dist/objects/command_version.js"() {
    init_command();
    CommandVersion = class extends command_default {
      /* CONSTRUCTOR */
      constructor(bin2) {
        super(bin2, {
          name: "_version",
          description: "Display the version number",
          hidden: true
        });
      }
      /* API */
      async run(options, argv) {
        this.stdout.print(this.bin.config.version);
      }
    };
    command_version_default = CommandVersion;
  }
});

// node_modules/tiny-bin/dist/objects/commands.js
var Commands, commands_default;
var init_commands = __esm({
  "node_modules/tiny-bin/dist/objects/commands.js"() {
    init_dist5();
    init_collection();
    init_utils3();
    Commands = class extends collection_default {
      /* API */
      print(mode) {
        const commands = this.getAll();
        if (!commands.length)
          return;
        const commandsVisible = commands.filter((command) => !command.hidden);
        if (!commandsVisible.length)
          return;
        const withoutOther = (section) => section.toLowerCase() !== "other" ? section : "";
        const commandsBySection = pushBack(groupBy(commandsVisible, (command) => withoutOther(command.section.toLowerCase())), "");
        commandsBySection.forEach((commands2, section) => {
          if (!commands2.length)
            return;
          const title = section ? `${section.toUpperCase()} COMMANDS` : commandsBySection.size > 1 ? "OTHER COMMANDS" : "COMMANDS";
          const table = commands2.map((command) => {
            const withDeprecated = command.deprecated ? dist_default4.dim : identity;
            return [
              [
                dist_default4.magenta(command.name),
                ...command.arguments.getAll().map((arg) => dist_default4.yellow(arg.name))
              ].join(" "),
              command.description
            ].map(withDeprecated);
          });
          this.stdout.group(title, () => {
            this.stdout.table(table, mode);
          });
        });
      }
      run(name, options, argv) {
        const command = this.getByIdOrFail(name);
        return command.run(options, argv);
      }
    };
    commands_default = Commands;
  }
});

// node_modules/tiny-bin/dist/objects/config.js
var Config, config_default;
var init_config = __esm({
  "node_modules/tiny-bin/dist/objects/config.js"() {
    init_dist5();
    init_dist5();
    init_addon();
    Config = class extends addon_default {
      constructor() {
        super(...arguments);
        this.name = "bin";
        this.description = "";
        this.package = "";
        this.version = "";
        this.colors = ENABLED;
        this.autoExit = true;
      }
      /* API */
      print() {
        this.stdout.print(`${dist_default4.cyan(this.name)} ${dist_default4.dim(this.version)}`);
        this.stdout.print();
      }
      update(options) {
        Object.assign(this, options);
      }
    };
    config_default = Config;
  }
});

// node_modules/fast-string-truncated-width/dist/utils.js
var getCodePointsLength, isFullWidth, isWideNotCJKTNotEmoji;
var init_utils4 = __esm({
  "node_modules/fast-string-truncated-width/dist/utils.js"() {
    getCodePointsLength = /* @__PURE__ */ (() => {
      const SURROGATE_PAIR_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
      return (input) => {
        let surrogatePairsNr = 0;
        SURROGATE_PAIR_RE.lastIndex = 0;
        while (SURROGATE_PAIR_RE.test(input)) {
          surrogatePairsNr += 1;
        }
        return input.length - surrogatePairsNr;
      };
    })();
    isFullWidth = (x) => {
      return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
    };
    isWideNotCJKTNotEmoji = (x) => {
      return x === 8987 || x === 9001 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12771 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 19903 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
    };
  }
});

// node_modules/fast-string-truncated-width/dist/index.js
var ANSI_RE2, CONTROL_RE, CJKT_WIDE_RE, TAB_RE, EMOJI_RE, LATIN_RE, MODIFIER_RE, NO_TRUNCATION, getStringTruncatedWidth, dist_default8;
var init_dist9 = __esm({
  "node_modules/fast-string-truncated-width/dist/index.js"() {
    init_method_replace_all();
    init_utils4();
    ANSI_RE2 = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|\u001b\]8;[^;]*;.*?(?:\u0007|\u001b\u005c)/y;
    CONTROL_RE = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
    CJKT_WIDE_RE = /(?:(?![\uFF61-\uFF9F\uFF00-\uFFEF])[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Tangut}]){1,1000}/yu;
    TAB_RE = /\t{1,1000}/y;
    EMOJI_RE = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/yu;
    LATIN_RE = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
    MODIFIER_RE = /\p{M}+/gu;
    NO_TRUNCATION = {
      limit: Infinity,
      ellipsis: ""
    };
    getStringTruncatedWidth = (input, truncationOptions = {}, widthOptions = {}) => {
      const LIMIT = truncationOptions.limit ?? Infinity;
      const ELLIPSIS2 = truncationOptions.ellipsis ?? "";
      const ELLIPSIS_WIDTH2 = truncationOptions?.ellipsisWidth ?? (ELLIPSIS2 ? getStringTruncatedWidth(ELLIPSIS2, NO_TRUNCATION, widthOptions).width : 0);
      const ANSI_WIDTH = 0;
      const CONTROL_WIDTH = widthOptions.controlWidth ?? 0;
      const TAB_WIDTH = widthOptions.tabWidth ?? 8;
      const EMOJI_WIDTH = widthOptions.emojiWidth ?? 2;
      const FULL_WIDTH_WIDTH = 2;
      const REGULAR_WIDTH = widthOptions.regularWidth ?? 1;
      const WIDE_WIDTH = widthOptions.wideWidth ?? FULL_WIDTH_WIDTH;
      const PARSE_BLOCKS = [[LATIN_RE, REGULAR_WIDTH], [ANSI_RE2, ANSI_WIDTH], [CONTROL_RE, CONTROL_WIDTH], [TAB_RE, TAB_WIDTH], [EMOJI_RE, EMOJI_WIDTH], [CJKT_WIDE_RE, WIDE_WIDTH]];
      let indexPrev = 0;
      let index = 0;
      let length = input.length;
      let lengthExtra = 0;
      let truncationEnabled = false;
      let truncationIndex = length;
      let truncationLimit = Math.max(0, LIMIT - ELLIPSIS_WIDTH2);
      let unmatchedStart = 0;
      let unmatchedEnd = 0;
      let width = 0;
      let widthExtra = 0;
      outer: while (true) {
        if (unmatchedEnd > unmatchedStart || index >= length && index > indexPrev) {
          const unmatched = input.slice(unmatchedStart, unmatchedEnd) || input.slice(indexPrev, index);
          lengthExtra = 0;
          for (const char of method_replace_all_default(
            /* OPTIONAL_OBJECT: false */
            0,
            unmatched,
            MODIFIER_RE,
            ""
          )) {
            const codePoint = char.codePointAt(0) || 0;
            if (isFullWidth(codePoint)) {
              widthExtra = FULL_WIDTH_WIDTH;
            } else if (isWideNotCJKTNotEmoji(codePoint)) {
              widthExtra = WIDE_WIDTH;
            } else {
              widthExtra = REGULAR_WIDTH;
            }
            if (width + widthExtra > truncationLimit) {
              truncationIndex = Math.min(truncationIndex, Math.max(unmatchedStart, indexPrev) + lengthExtra);
            }
            if (width + widthExtra > LIMIT) {
              truncationEnabled = true;
              break outer;
            }
            lengthExtra += char.length;
            width += widthExtra;
          }
          unmatchedStart = unmatchedEnd = 0;
        }
        if (index >= length) {
          break outer;
        }
        for (let i = 0, l = PARSE_BLOCKS.length; i < l; i++) {
          const [BLOCK_RE, BLOCK_WIDTH] = PARSE_BLOCKS[i];
          BLOCK_RE.lastIndex = index;
          if (BLOCK_RE.test(input)) {
            lengthExtra = BLOCK_RE === CJKT_WIDE_RE ? getCodePointsLength(input.slice(index, BLOCK_RE.lastIndex)) : BLOCK_RE === EMOJI_RE ? 1 : BLOCK_RE.lastIndex - index;
            widthExtra = lengthExtra * BLOCK_WIDTH;
            if (width + widthExtra > truncationLimit) {
              truncationIndex = Math.min(truncationIndex, index + Math.floor((truncationLimit - width) / BLOCK_WIDTH));
            }
            if (width + widthExtra > LIMIT) {
              truncationEnabled = true;
              break outer;
            }
            width += widthExtra;
            unmatchedStart = indexPrev;
            unmatchedEnd = index;
            index = indexPrev = BLOCK_RE.lastIndex;
            continue outer;
          }
        }
        index += 1;
      }
      return {
        width: truncationEnabled ? truncationLimit : width,
        index: truncationEnabled ? truncationIndex : length,
        truncated: truncationEnabled,
        ellipsed: truncationEnabled && LIMIT >= ELLIPSIS_WIDTH2
      };
    };
    dist_default8 = getStringTruncatedWidth;
  }
});

// node_modules/fast-string-width/dist/index.js
var NO_TRUNCATION2, fastStringWidth, dist_default9;
var init_dist10 = __esm({
  "node_modules/fast-string-width/dist/index.js"() {
    init_dist9();
    NO_TRUNCATION2 = {
      limit: Infinity,
      ellipsis: "",
      ellipsisWidth: 0
    };
    fastStringWidth = (input, options = {}) => {
      return dist_default8(input, NO_TRUNCATION2, options).width;
    };
    dist_default9 = fastStringWidth;
  }
});

// node_modules/tiny-bin/dist/objects/logger.js
var Logger, logger_default;
var init_logger = __esm({
  "node_modules/tiny-bin/dist/objects/logger.js"() {
    init_dist10();
    init_dist5();
    init_addon();
    init_utils3();
    Logger = class extends addon_default {
      /* CONSTRUCTOR */
      constructor(bin2, handler) {
        super(bin2);
        this.indentationLevel = 0;
        this.indentation = "  ";
        this.handler = handler;
      }
      /* API */
      indent() {
        this.indentationLevel += 1;
      }
      dedent() {
        this.indentationLevel -= 1;
      }
      group(name, fn) {
        this.print(dist_default4.bold(name.toUpperCase()));
        this.indent();
        this.print();
        fn();
        this.print();
        this.dedent();
      }
      print(message = "") {
        const colorize = this.bin.config.colors ? identity : dist_default5;
        this.handler(colorize(`${this.indentation.repeat(this.indentationLevel)}${message}`));
      }
      table(rows, mode = "line") {
        const rowsLengths = rows.map((row) => row.map((cell) => dist_default9(cell)));
        const maxLengths = rowsLengths[0].map((_, j) => Math.max(...rowsLengths.map((_2, i) => rowsLengths[i][j])));
        if (mode === "lines" && maxLengths.length === 2) {
          const COLUMN = 30;
          const PADDING = 4;
          rows.forEach(([left, right], i) => {
            const leftNedded = dist_default9(left) + PADDING;
            const leftAvailable = COLUMN - leftNedded;
            const leftShortEnough = leftAvailable >= 2;
            const rightLines = right.trim().split(/\r?\n|\r/g);
            const line2 = [left, rightLines.map((line3, i2) => leftShortEnough && !i2 ? `${" ".repeat(leftAvailable)}${line3}` : `${i2 ? "" : "\n"}${" ".repeat(COLUMN)}${line3}`).join("\n")].join("");
            this.print(line2);
          });
        } else if (mode === "line") {
          rows.forEach((row, i) => {
            const line2 = row.map((value, j) => {
              const paddingLength = j === row.length - 1 ? 0 : Math.max(0, 1 + maxLengths[j] - rowsLengths[i][j]);
              const padding = " ".repeat(paddingLength);
              return `${value}${padding}`;
            }).join(" ");
            this.print(line2);
          });
        } else {
          throw new Error("Unsupported printing mode");
        }
      }
    };
    logger_default = Logger;
  }
});

// node_modules/tiny-bin/dist/objects/option.js
var Option, option_default;
var init_option = __esm({
  "node_modules/tiny-bin/dist/objects/option.js"() {
    init_addon();
    init_utils3();
    Option = class extends addon_default {
      /* CONSTRUCTOR */
      constructor(bin2, options) {
        super(bin2);
        this.data = this.parse(options.name, options.type);
        this.ids = this.data.alls;
        this.name = options.name;
        this.description = options.description || "";
        this.section = options.section || "";
        this.deprecated = !!options.deprecated;
        this.eager = !!options.eager;
        this.hidden = !!options.hidden;
        this.incompatible = castArray2(options.incompatible || []);
        this.required = !!options.required;
        this.variadic = options.name.includes("...");
        this.default = options.default;
        this.enum = options.enum;
        this.validate = options.validate;
        if (this.eager && !this.data.args.length) {
          this.bin.fail(`Eager option must not be boolean: "${this.name}"`);
        }
        if (this.eager && !this.variadic) {
          this.bin.fail(`Eager option must be variadic: "${this.name}"`);
        }
      }
      /* PRIVATE API */
      parse(name, forceType) {
        const longsPositive = [];
        const longs = [];
        const shorts = [];
        const args = [];
        const re = /--([a-z0-9-\.]+)|-([a-zA-Z\.])|<([^>.]+)(?:\.\.\.)?>|([\s,])|([^])/g;
        name.replace(re, (_, long, short, arg, spacer, invalid) => {
          if (long && long.startsWith("no-"))
            longsPositive.push(long.slice(3));
          if (long)
            longs.push(long);
          if (short)
            shorts.push(short);
          if (arg)
            args.push(arg);
          if (invalid)
            this.bin.fail(`Invalid option: "${name}"`);
          return _;
        });
        if (!longs.length && !shorts.length)
          this.bin.fail(`Option must define at least a longhand or a shorthand: "${name}"`);
        if (args.length > 1)
          this.bin.fail(`Option can define at most one argument: "${name}"`);
        const type = forceType || (args.length ? "string" : "boolean");
        const alls = [...longsPositive, ...longs, ...shorts];
        const data = { type, alls, longs, shorts, args };
        return data;
      }
    };
    option_default = Option;
  }
});

// node_modules/tiny-bin/dist/objects/bin.js
import process5 from "process";
var Bin, bin_default;
var init_bin = __esm({
  "node_modules/tiny-bin/dist/objects/bin.js"() {
    init_dist4();
    init_dist5();
    init_command_default();
    init_command_help();
    init_command_version();
    init_commands();
    init_config();
    init_logger();
    init_option();
    init_utils3();
    Bin = class {
      /* CONSTRUCTOR */
      constructor(options) {
        this.stdout = new logger_default(this, console.log);
        this.stderr = new logger_default(this, console.error);
        this.config = new config_default(this);
        this.commands = new commands_default(this);
        this.config.name = options.name ?? this.config.name;
        this.config.description = options.description ?? this.config.description;
        const fallback = new command_default_default(this);
        const help = new command_help_default(this);
        const version = new command_version_default(this);
        this.commands.register(fallback);
        this.commands.register(help);
        this.commands.register(version);
        this.command = fallback;
        this.command.options.register(new option_default(this, { name: "--help", description: "Display help for the command" }));
        this.command.options.register(new option_default(this, { name: "--version, -v", description: "Display the version number" }));
        this.command.options.register(new option_default(this, { name: "--no-color, --no-colors", description: "Disable colored output", hidden: true }));
      }
      /* API */
      fail(message) {
        this.stderr.print();
        this.stderr.indent();
        this.stderr.print(dist_default4.red(message));
        this.stderr.dedent();
        this.stderr.print();
        process5.exit(1);
      }
      async run(argv = process5.argv.slice(2)) {
        var _a, _b;
        if (!this.config.package || !this.config.version) {
          const pkg = dist_default3();
          if (pkg) {
            const { name, version } = pkg;
            (_a = this.config).package || (_a.package = name);
            (_b = this.config).version || (_b.version = version);
          }
        }
        try {
          const options = dist_default7(argv);
          await this.commands.run(this.command.name, options, argv);
          if (this.config.autoExit) {
            process5.exit();
          }
        } catch (error) {
          console.error(error);
          if (this.config.autoExit) {
            process5.exit(1);
          }
        }
      }
    };
    bin_default = Bin;
  }
});

// node_modules/tiny-bin/dist/objects/chainable_action.js
var ChainableAction, chainable_action_default;
var init_chainable_action = __esm({
  "node_modules/tiny-bin/dist/objects/chainable_action.js"() {
    init_addon();
    init_chainable_command_global();
    init_utils3();
    ChainableAction = class extends addon_default {
      command(name, description, options) {
        const commandOptions = isObject(name) ? name : { name, description, ...options };
        return new chainable_command_global_default(this.bin).command(commandOptions);
      }
      run(argv) {
        return new chainable_command_global_default(this.bin).run(argv);
      }
    };
    chainable_action_default = ChainableAction;
  }
});

// node_modules/tiny-bin/dist/objects/chainable_command_local.js
var ChainableCommandLocal, chainable_command_local_default;
var init_chainable_command_local = __esm({
  "node_modules/tiny-bin/dist/objects/chainable_command_local.js"() {
    init_addon();
    init_argument();
    init_chainable_action();
    init_option();
    init_utils3();
    ChainableCommandLocal = class extends addon_default {
      /* CONSTRUCTOR */
      constructor(bin2, command) {
        super(bin2);
        this.command = command;
      }
      /* API */
      usage(usage) {
        this.command.usage.register(usage);
        return this;
      }
      option(name, description, options) {
        const optionOptions = isObject(name) ? name : { name, description, ...options };
        const option = new option_default(this.bin, optionOptions);
        this.command.options.register(option, !!optionOptions.override);
        return this;
      }
      argument(name, description, options) {
        const argumentOptions = isObject(name) ? name : { name, description, ...options };
        const argument = new argument_default(this.bin, argumentOptions);
        this.command.arguments.register(argument);
        return this;
      }
      action(handler) {
        this.command.handler = handler;
        return new chainable_action_default(this.bin);
      }
    };
    chainable_command_local_default = ChainableCommandLocal;
  }
});

// node_modules/tiny-bin/dist/objects/chainable_command_global.js
var ChainableCommandGlobal, chainable_command_global_default;
var init_chainable_command_global = __esm({
  "node_modules/tiny-bin/dist/objects/chainable_command_global.js"() {
    init_addon();
    init_argument();
    init_chainable_action();
    init_chainable_command_local();
    init_command();
    init_option();
    init_utils3();
    ChainableCommandGlobal = class extends addon_default {
      /* API */
      config(options) {
        this.bin.config.update(options);
        return this;
      }
      usage(usage) {
        this.bin.command.usage.register(usage);
        return this;
      }
      option(name, description, options) {
        const optionOptions = isObject(name) ? name : { name, description, ...options };
        const option = new option_default(this.bin, optionOptions);
        this.bin.command.options.register(option, !!optionOptions.override);
        return this;
      }
      argument(name, description, options) {
        const argumentOptions = isObject(name) ? name : { name, description, ...options };
        const argument = new argument_default(this.bin, argumentOptions);
        this.bin.command.arguments.register(argument);
        return this;
      }
      action(handler) {
        this.bin.command.handler = handler;
        return new chainable_action_default(this.bin);
      }
      command(name, description, options) {
        const commandOptions = isObject(name) ? name : { name, description, ...options };
        const command = new command_default(this.bin, commandOptions);
        this.bin.commands.register(command);
        return new chainable_command_local_default(this.bin, command);
      }
      run(argv) {
        return this.bin.run(argv);
      }
    };
    chainable_command_global_default = ChainableCommandGlobal;
  }
});

// node_modules/tiny-bin/dist/index.js
function bin(name, description) {
  const binOptions = isObject(name) ? name : { name, description };
  const bin2 = new bin_default(binOptions);
  const command = new chainable_command_global_default(bin2);
  return command;
}
var dist_default10;
var init_dist11 = __esm({
  "node_modules/tiny-bin/dist/index.js"() {
    init_bin();
    init_chainable_command_global();
    init_utils3();
    dist_default10 = bin;
  }
});

// node_modules/function-once/dist/index.js
var once, dist_default11;
var init_dist12 = __esm({
  "node_modules/function-once/dist/index.js"() {
    once = (fn) => {
      let called = false;
      let result;
      return () => {
        if (!called) {
          called = true;
          result = fn();
        }
        return result;
      };
    };
    dist_default11 = once;
  }
});

// node_modules/ionstore/dist/utils.js
var attempt2;
var init_utils5 = __esm({
  "node_modules/ionstore/dist/utils.js"() {
    attempt2 = (fn, fallback) => {
      try {
        return fn();
      } catch {
        return fallback;
      }
    };
  }
});

// node_modules/ionstore/dist/abstract.js
var __classPrivateFieldSet, __classPrivateFieldGet, _AbstractStore_save, AbstractStore, abstract_default;
var init_abstract = __esm({
  "node_modules/ionstore/dist/abstract.js"() {
    init_utils5();
    __classPrivateFieldSet = function(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    __classPrivateFieldGet = function(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    AbstractStore = class extends Map {
      /* CONSTRUCTOR */
      constructor(options) {
        super();
        _AbstractStore_save.set(this, void 0);
        const { id, backend } = options;
        if (!/^[a-zA-Z0-9_-]+$/.test(id))
          throw new Error(`Invalid store id: "${id}"`);
        const read3 = () => attempt2(() => backend.read(id), []);
        const write = () => attempt2(() => backend.write(id, this.entries()), null);
        for (const [key2, value] of read3()) {
          super.set(key2, value);
        }
        __classPrivateFieldSet(this, _AbstractStore_save, write, "f");
        return this;
      }
      /* API */
      clear() {
        if (!this.size)
          return;
        super.clear();
        __classPrivateFieldGet(this, _AbstractStore_save, "f").call(this);
      }
      delete(key2) {
        const deleted = super.delete(key2);
        if (!deleted)
          return false;
        __classPrivateFieldGet(this, _AbstractStore_save, "f").call(this);
        return true;
      }
      set(key2, value) {
        const valuePrev = this.get(key2);
        if (value === valuePrev)
          return this;
        super.set(key2, value);
        __classPrivateFieldGet(this, _AbstractStore_save, "f").call(this);
        return this;
      }
    };
    _AbstractStore_save = /* @__PURE__ */ new WeakMap();
    abstract_default = AbstractStore;
  }
});

// node_modules/ionstore/dist/node.js
import fs4 from "fs";
import os from "os";
import path3 from "path";
var NodeStore, node_default;
var init_node = __esm({
  "node_modules/ionstore/dist/node.js"() {
    init_abstract();
    NodeStore = class extends abstract_default {
      /* CONSTRUCTOR */
      constructor(id) {
        super({
          id,
          backend: {
            read: (id2) => {
              const filePath = path3.join(os.tmpdir(), `ionstore_${id2}.json`);
              const content = fs4.readFileSync(filePath, "utf8");
              return JSON.parse(content);
            },
            write: (id2, data) => {
              const filePath = path3.join(os.tmpdir(), `ionstore_${id2}.json`);
              const content = JSON.stringify(Array.from(data));
              return fs4.writeFileSync(filePath, content);
            }
          }
        });
      }
    };
    node_default = NodeStore;
  }
});

// node_modules/tiny-updater/dist/utils.js
var init_utils6 = __esm({
  "node_modules/tiny-updater/dist/utils.js"() {
  }
});

// node_modules/tiny-updater/dist/store.js
var store;
var init_store = __esm({
  "node_modules/tiny-updater/dist/store.js"() {
    init_dist12();
    init_node();
    init_utils6();
    store = dist_default11(() => {
      return new node_default("tiny-updater");
    });
  }
});

// node_modules/when-exit/dist/node/constants.js
import process6 from "process";
var IS_LINUX, IS_WINDOWS;
var init_constants3 = __esm({
  "node_modules/when-exit/dist/node/constants.js"() {
    IS_LINUX = process6.platform === "linux";
    IS_WINDOWS = process6.platform === "win32";
  }
});

// node_modules/when-exit/dist/node/signals.js
var Signals, signals_default;
var init_signals = __esm({
  "node_modules/when-exit/dist/node/signals.js"() {
    init_constants3();
    Signals = ["SIGHUP", "SIGINT", "SIGTERM"];
    if (!IS_WINDOWS) {
      Signals.push("SIGALRM", "SIGABRT", "SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
    }
    if (IS_LINUX) {
      Signals.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
    }
    signals_default = Signals;
  }
});

// node_modules/when-exit/dist/node/interceptor.js
import process7 from "process";
var Interceptor, interceptor_default;
var init_interceptor = __esm({
  "node_modules/when-exit/dist/node/interceptor.js"() {
    init_constants3();
    init_signals();
    Interceptor = class {
      /* CONSTRUCTOR */
      constructor() {
        this.callbacks = /* @__PURE__ */ new Set();
        this.exited = false;
        this.exit = (signal) => {
          if (this.exited)
            return;
          this.exited = true;
          for (const callback of this.callbacks) {
            callback();
          }
          if (signal) {
            if (IS_WINDOWS && (signal !== "SIGINT" && signal !== "SIGTERM" && signal !== "SIGKILL")) {
              process7.kill(process7.pid, "SIGTERM");
            } else {
              process7.kill(process7.pid, signal);
            }
          }
        };
        this.hook = () => {
          process7.once("exit", () => this.exit());
          for (const signal of signals_default) {
            try {
              process7.once(signal, () => this.exit(signal));
            } catch {
            }
          }
        };
        this.register = (callback) => {
          this.callbacks.add(callback);
          return () => {
            this.callbacks.delete(callback);
          };
        };
        this.hook();
      }
    };
    interceptor_default = new Interceptor();
  }
});

// node_modules/when-exit/dist/node/index.js
var whenExit, node_default2;
var init_node2 = __esm({
  "node_modules/when-exit/dist/node/index.js"() {
    init_interceptor();
    whenExit = interceptor_default.register;
    node_default2 = whenExit;
  }
});

// node_modules/tiny-updater/dist/version.js
var init_version = __esm({
  "node_modules/tiny-updater/dist/version.js"() {
    init_dist5();
    init_node2();
    init_utils6();
  }
});

// node_modules/tiny-updater/dist/index.js
var init_dist13 = __esm({
  "node_modules/tiny-updater/dist/index.js"() {
    init_store();
    init_utils6();
    init_version();
  }
});

// node_modules/specialist/dist/exit.js
import process8 from "process";
var exit, exit_default;
var init_exit = __esm({
  "node_modules/specialist/dist/exit.js"() {
    init_dist5();
    exit = (message, code = 1) => {
      const log = code === 0 ? console.log : console.error;
      if (code === 0) {
        log(message);
      } else {
        log(`
  ${dist_default4.red(message)}
`);
      }
      process8.exit(code);
    };
    exit_default = exit;
  }
});

// node_modules/specialist/dist/index.js
var init_dist14 = __esm({
  "node_modules/specialist/dist/index.js"() {
    init_dist11();
    init_dist5();
    init_dist8();
    init_dist13();
    init_exit();
  }
});

// src/experimental-cli/constants.evaluate.js
var CLI_VERSION, DEFAULT_PARSERS, PRETTIER_VERSION;
var init_constants_evaluate = __esm({
  "src/experimental-cli/constants.evaluate.js"() {
    CLI_VERSION = "0.12.0";
    DEFAULT_PARSERS = [
      "flow",
      "babel",
      "babel-flow",
      "babel-ts",
      "typescript",
      "acorn",
      "espree",
      "meriyah",
      "css",
      "less",
      "scss",
      "json",
      "json5",
      "jsonc",
      "json-stringify",
      "graphql",
      "markdown",
      "mdx",
      "vue",
      "yaml",
      "glimmer",
      "html",
      "angular",
      "lwc"
    ];
    PRETTIER_VERSION = "3.9.10";
  }
});

// node_modules/import-meta-resolve/lib/errors.js
import v8 from "v8";
import assert from "assert";
import { format, inspect } from "util";
function formatList(array, type = "and") {
  return array.length < 3 ? array.join(` ${type} `) : `${array.slice(0, -1).join(", ")}, ${type} ${array[array.length - 1]}`;
}
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
function getMessage(key2, parameters, self) {
  const message = messages.get(key2);
  assert.ok(message !== void 0, "expected `message` to be found");
  if (typeof message === "function") {
    assert.ok(
      message.length <= parameters.length,
      // Default options do not count.
      `Code: ${key2}; The provided arguments length (${parameters.length}) does not match the required ones (${message.length}).`
    );
    return Reflect.apply(message, self, parameters);
  }
  const regex3 = /%[dfijoOs]/g;
  let expectedLength = 0;
  while (regex3.exec(message) !== null) expectedLength++;
  assert.ok(
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
var own, classRegExp, kTypes, codes, messages, nodeInternalPrefix, userStackTraceLimit, captureLargerStackTrace;
var init_errors = __esm({
  "node_modules/import-meta-resolve/lib/errors.js"() {
    own = {}.hasOwnProperty;
    classRegExp = /^([A-Z][a-z\d]*)+$/;
    kTypes = /* @__PURE__ */ new Set([
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
    codes = {};
    messages = /* @__PURE__ */ new Map();
    nodeInternalPrefix = "__node_internal_";
    codes.ERR_INVALID_ARG_TYPE = createError(
      "ERR_INVALID_ARG_TYPE",
      /**
       * @param {string} name
       * @param {Array<string> | string} expected
       * @param {unknown} actual
       */
      (name, expected, actual) => {
        assert.ok(typeof name === "string", "'name' must be a string");
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
        const types = [];
        const instances = [];
        const other = [];
        for (const value of expected) {
          assert.ok(
            typeof value === "string",
            "All expected entries have to be of type string"
          );
          if (kTypes.has(value)) {
            types.push(value.toLowerCase());
          } else if (classRegExp.exec(value) === null) {
            assert.ok(
              value !== "object",
              'The value "object" should be written as "Object"'
            );
            other.push(value);
          } else {
            instances.push(value);
          }
        }
        if (instances.length > 0) {
          const pos2 = types.indexOf("object");
          if (pos2 !== -1) {
            types.slice(pos2, 1);
            instances.push("Object");
          }
        }
        if (types.length > 0) {
          message += `${types.length > 1 ? "one of type" : "of type"} ${formatList(
            types,
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
      (path18, base, message) => {
        return `Invalid package config ${path18}${base ? ` while importing ${base}` : ""}${message ? `. ${message}` : ""}`;
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
          assert.ok(isImport === false);
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
      (path18, base, exactUrl = false) => {
        return `Cannot find ${exactUrl ? "module" : "package"} '${path18}' imported from ${base}`;
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
      (extension, path18) => {
        return `Unknown file extension "${extension}" for ${path18}`;
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
    captureLargerStackTrace = hideStackFrames(
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
  }
});

// node_modules/import-meta-resolve/lib/package-json-reader.js
import fs5 from "fs";
import path4 from "path";
import { fileURLToPath } from "url";
function read(jsonPath, { base, specifier }) {
  const existing = cache.get(jsonPath);
  if (existing) {
    return existing;
  }
  let string2;
  try {
    string2 = fs5.readFileSync(path4.toNamespacedPath(jsonPath), "utf8");
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
  if (string2 !== void 0) {
    let parsed;
    try {
      parsed = JSON.parse(string2);
    } catch (error_) {
      const cause = (
        /** @type {ErrnoException} */
        error_
      );
      const error = new ERR_INVALID_PACKAGE_CONFIG(
        jsonPath,
        (base ? `"${specifier}" from ` : "") + fileURLToPath(base || specifier),
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
    const packageConfig = read(fileURLToPath(packageJSONUrl), {
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
  const packageJSONPath = fileURLToPath(packageJSONUrl);
  return {
    pjsonPath: packageJSONPath,
    exists: false,
    type: "none"
  };
}
function getPackageType(url3) {
  return getPackageScopeConfig(url3).type;
}
var hasOwnProperty, ERR_INVALID_PACKAGE_CONFIG, cache;
var init_package_json_reader = __esm({
  "node_modules/import-meta-resolve/lib/package-json-reader.js"() {
    init_errors();
    hasOwnProperty = {}.hasOwnProperty;
    ({ ERR_INVALID_PACKAGE_CONFIG } = codes);
    cache = /* @__PURE__ */ new Map();
  }
});

// node_modules/import-meta-resolve/lib/get-format.js
import { fileURLToPath as fileURLToPath2 } from "url";
function mimeToFormat(mime) {
  if (mime && /\s*(text|application)\/javascript\s*(;\s*charset=utf-?8\s*)?/i.test(mime))
    return "module";
  if (mime === "application/json") return "json";
  return null;
}
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
  const format2 = extensionFormatMap[value];
  if (format2) return format2;
  if (ignoreErrors) {
    return void 0;
  }
  const filepath = fileURLToPath2(url3);
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
var ERR_UNKNOWN_FILE_EXTENSION, hasOwnProperty2, extensionFormatMap, protocolHandlers;
var init_get_format = __esm({
  "node_modules/import-meta-resolve/lib/get-format.js"() {
    init_package_json_reader();
    init_errors();
    ({ ERR_UNKNOWN_FILE_EXTENSION } = codes);
    hasOwnProperty2 = {}.hasOwnProperty;
    extensionFormatMap = {
      // @ts-expect-error: hush.
      __proto__: null,
      ".cjs": "commonjs",
      ".js": "module",
      ".json": "json",
      ".mjs": "module"
    };
    protocolHandlers = {
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
  }
});

// node_modules/import-meta-resolve/lib/utils.js
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
var ERR_INVALID_ARG_VALUE, DEFAULT_CONDITIONS, DEFAULT_CONDITIONS_SET;
var init_utils7 = __esm({
  "node_modules/import-meta-resolve/lib/utils.js"() {
    init_errors();
    ({ ERR_INVALID_ARG_VALUE } = codes);
    DEFAULT_CONDITIONS = Object.freeze(["node", "import"]);
    DEFAULT_CONDITIONS_SET = new Set(DEFAULT_CONDITIONS);
  }
});

// node_modules/import-meta-resolve/lib/resolve.js
import assert2 from "assert";
import { statSync, realpathSync } from "fs";
import process9 from "process";
import { fileURLToPath as fileURLToPath3, pathToFileURL } from "url";
import path5 from "path";
import { builtinModules } from "module";
function emitInvalidSegmentDeprecation(target, request, match2, packageJsonUrl, internal, base, isTarget) {
  if (process9.noDeprecation) {
    return;
  }
  const pjsonPath = fileURLToPath3(packageJsonUrl);
  const double = doubleSlashRegEx.exec(isTarget ? target : request) !== null;
  process9.emitWarning(
    `Use of deprecated ${double ? "double slash" : "leading or trailing slash matching"} resolving "${target}" for module request "${request}" ${request === match2 ? "" : `matched to "${match2}" `}in the "${internal ? "imports" : "exports"}" field module resolution of the package at ${pjsonPath}${base ? ` imported from ${fileURLToPath3(base)}` : ""}.`,
    "DeprecationWarning",
    "DEP0166"
  );
}
function emitLegacyIndexDeprecation(url3, packageJsonUrl, base, main) {
  if (process9.noDeprecation) {
    return;
  }
  const format2 = defaultGetFormatWithoutErrors(url3, { parentURL: base.href });
  if (format2 !== "module") return;
  const urlPath = fileURLToPath3(url3.href);
  const packagePath = fileURLToPath3(new URL(".", packageJsonUrl));
  const basePath = fileURLToPath3(base);
  if (!main) {
    process9.emitWarning(
      `No "main" or "exports" field defined in the package.json for ${packagePath} resolving the main entry point "${urlPath.slice(
        packagePath.length
      )}", imported from ${basePath}.
Default "index" lookups for the main are deprecated for ES modules.`,
      "DeprecationWarning",
      "DEP0151"
    );
  } else if (path5.resolve(packagePath, main) !== urlPath) {
    process9.emitWarning(
      `Package ${packagePath} has a "main" field set to "${main}", excluding the full filename and extension to the resolved file at "${urlPath.slice(
        packagePath.length
      )}", imported from ${basePath}.
 Automatic extension resolution of the "main" field is deprecated for ES modules.`,
      "DeprecationWarning",
      "DEP0151"
    );
  }
}
function tryStatSync(path18) {
  try {
    return statSync(path18);
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
    fileURLToPath3(new URL(".", packageJsonUrl)),
    fileURLToPath3(base)
  );
}
function finalizeResolution(resolved, base, preserveSymlinks) {
  if (encodedSeparatorRegEx.exec(resolved.pathname) !== null) {
    throw new ERR_INVALID_MODULE_SPECIFIER(
      resolved.pathname,
      'must not include encoded "/" or "\\" characters',
      fileURLToPath3(base)
    );
  }
  let filePath;
  try {
    filePath = fileURLToPath3(resolved);
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
    const error = new ERR_UNSUPPORTED_DIR_IMPORT(filePath, fileURLToPath3(base));
    error.url = String(resolved);
    throw error;
  }
  if (!stats || !stats.isFile()) {
    const error = new ERR_MODULE_NOT_FOUND(
      filePath || resolved.pathname,
      base && fileURLToPath3(base),
      true
    );
    error.url = String(resolved);
    throw error;
  }
  if (!preserveSymlinks) {
    const real = realpathSync(filePath);
    const { search, hash } = resolved;
    resolved = pathToFileURL(real + (filePath.endsWith(path5.sep) ? "/" : ""));
    resolved.search = search;
    resolved.hash = hash;
  }
  return resolved;
}
function importNotDefined(specifier, packageJsonUrl, base) {
  return new ERR_PACKAGE_IMPORT_NOT_DEFINED(
    specifier,
    packageJsonUrl && fileURLToPath3(new URL(".", packageJsonUrl)),
    fileURLToPath3(base)
  );
}
function exportsNotFound(subpath, packageJsonUrl, base) {
  return new ERR_PACKAGE_PATH_NOT_EXPORTED(
    fileURLToPath3(new URL(".", packageJsonUrl)),
    subpath,
    base && fileURLToPath3(base)
  );
}
function throwInvalidSubpath(request, match2, packageJsonUrl, internal, base) {
  const reason = `request is not a valid match in pattern "${match2}" for the "${internal ? "imports" : "exports"}" resolution of ${fileURLToPath3(packageJsonUrl)}`;
  throw new ERR_INVALID_MODULE_SPECIFIER(
    request,
    reason,
    base && fileURLToPath3(base)
  );
}
function invalidPackageTarget(subpath, target, packageJsonUrl, internal, base) {
  target = typeof target === "object" && target !== null ? JSON.stringify(target, null, "") : `${target}`;
  return new ERR_INVALID_PACKAGE_TARGET(
    fileURLToPath3(new URL(".", packageJsonUrl)),
    subpath,
    target,
    internal,
    base && fileURLToPath3(base)
  );
}
function resolvePackageTargetString(target, subpath, match2, packageJsonUrl, base, pattern, internal, isPathMap, conditions) {
  if (subpath !== "" && !pattern && target[target.length - 1] !== "/")
    throw invalidPackageTarget(match2, target, packageJsonUrl, internal, base);
  if (!target.startsWith("./")) {
    if (internal && !target.startsWith("../") && !target.startsWith("/")) {
      let isURL = false;
      try {
        new URL(target);
        isURL = true;
      } catch {
      }
      if (!isURL) {
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
          fileURLToPath3(packageJsonUrl),
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
        fileURLToPath3(packageJsonUrl),
        base,
        `"exports" cannot contain some keys starting with '.' and some not. The exports object must either be an object of package subpath keys or an object of main entry condition name keys only.`
      );
    }
  }
  return isConditionalSugar;
}
function emitTrailingSlashPatternDeprecation(match2, pjsonUrl, base) {
  if (process9.noDeprecation) {
    return;
  }
  const pjsonPath = fileURLToPath3(pjsonUrl);
  if (emittedPackageWarnings.has(pjsonPath + "|" + match2)) return;
  emittedPackageWarnings.add(pjsonPath + "|" + match2);
  process9.emitWarning(
    `Use of deprecated trailing slash pattern mapping "${match2}" in the "exports" field module resolution of the package at ${pjsonPath}${base ? ` imported from ${fileURLToPath3(base)}` : ""}. Mapping specifiers ending in "/" is no longer supported.`,
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
    throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, fileURLToPath3(base));
  }
  let packageJsonUrl;
  const packageConfig = getPackageScopeConfig(base);
  if (packageConfig.exists) {
    packageJsonUrl = pathToFileURL(packageConfig.pjsonPath);
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
      fileURLToPath3(base)
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
    const packageJsonUrl2 = pathToFileURL(packageConfig.pjsonPath);
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
  let packageJsonPath = fileURLToPath3(packageJsonUrl);
  let lastPath;
  do {
    const stat = tryStatSync(packageJsonPath.slice(0, -13));
    if (!stat || !stat.isDirectory()) {
      lastPath = packageJsonPath;
      packageJsonUrl = new URL(
        (isScoped ? "../../../../node_modules/" : "../../../node_modules/") + packageName + "/package.json",
        packageJsonUrl
      );
      packageJsonPath = fileURLToPath3(packageJsonUrl);
      continue;
    }
    const packageConfig2 = read(packageJsonPath, { base, specifier });
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
  throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath3(base), false);
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
  assert2.ok(resolved !== void 0, "expected to be defined");
  if (resolved.protocol !== "file:") {
    return resolved;
  }
  return finalizeResolution(resolved, base, preserveSymlinks);
}
var RegExpPrototypeSymbolReplace, ERR_NETWORK_IMPORT_DISALLOWED, ERR_INVALID_MODULE_SPECIFIER, ERR_INVALID_PACKAGE_CONFIG2, ERR_INVALID_PACKAGE_TARGET, ERR_MODULE_NOT_FOUND, ERR_PACKAGE_IMPORT_NOT_DEFINED, ERR_PACKAGE_PATH_NOT_EXPORTED, ERR_UNSUPPORTED_DIR_IMPORT, ERR_UNSUPPORTED_RESOLVE_REQUEST, own2, invalidSegmentRegEx, deprecatedInvalidSegmentRegEx, invalidPackageNameRegEx, patternRegEx, encodedSeparatorRegEx, emittedPackageWarnings, doubleSlashRegEx;
var init_resolve = __esm({
  "node_modules/import-meta-resolve/lib/resolve.js"() {
    init_get_format();
    init_errors();
    init_package_json_reader();
    init_utils7();
    RegExpPrototypeSymbolReplace = RegExp.prototype[Symbol.replace];
    ({
      ERR_NETWORK_IMPORT_DISALLOWED,
      ERR_INVALID_MODULE_SPECIFIER,
      ERR_INVALID_PACKAGE_CONFIG: ERR_INVALID_PACKAGE_CONFIG2,
      ERR_INVALID_PACKAGE_TARGET,
      ERR_MODULE_NOT_FOUND,
      ERR_PACKAGE_IMPORT_NOT_DEFINED,
      ERR_PACKAGE_PATH_NOT_EXPORTED,
      ERR_UNSUPPORTED_DIR_IMPORT,
      ERR_UNSUPPORTED_RESOLVE_REQUEST
    } = codes);
    own2 = {}.hasOwnProperty;
    invalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i;
    deprecatedInvalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
    invalidPackageNameRegEx = /^\.|%|\\/;
    patternRegEx = /\*/g;
    encodedSeparatorRegEx = /%2f|%5c/i;
    emittedPackageWarnings = /* @__PURE__ */ new Set();
    doubleSlashRegEx = /[/\\]{2}/;
  }
});

// node_modules/import-meta-resolve/index.js
var init_import_meta_resolve = __esm({
  "node_modules/import-meta-resolve/index.js"() {
    init_resolve();
  }
});

// node_modules/lomemo/dist/index.js
var memoize, dist_default13;
var init_dist15 = __esm({
  "node_modules/lomemo/dist/index.js"() {
    memoize = (fn, resolver) => {
      const memoized = function(...args) {
        const key2 = resolver ? resolver.apply(this, args) : args[0];
        const cache3 = memoized.cache;
        const cached = cache3.get(key2);
        if (cached !== void 0 || cache3.has(key2))
          return cached;
        const result = fn.apply(this, args);
        memoized.cache = cache3.set(key2, result) || cache3;
        return result;
      };
      memoized.cache = new (memoize.Cache || Map)();
      return memoized;
    };
    memoize.Cache = Map;
    dist_default13 = memoize;
  }
});

// node_modules/promise-resolve-timeout/dist/index.js
function resolveTimeout(timeout, value) {
  return new Promise((resolve4) => {
    if (timeout === Infinity)
      return;
    setTimeout(() => {
      if (typeof value === "function") {
        resolve4(value());
      } else {
        resolve4(value);
      }
    }, timeout);
  });
}
var dist_default14;
var init_dist16 = __esm({
  "node_modules/promise-resolve-timeout/dist/index.js"() {
    dist_default14 = resolveTimeout;
  }
});

// node_modules/promise-make-naked/dist/utils.js
var noop2;
var init_utils8 = __esm({
  "node_modules/promise-make-naked/dist/utils.js"() {
    noop2 = () => {
    };
  }
});

// node_modules/promise-make-naked/dist/index.js
var makeNakedPromise, dist_default15;
var init_dist17 = __esm({
  "node_modules/promise-make-naked/dist/index.js"() {
    init_utils8();
    makeNakedPromise = () => {
      let resolve4 = noop2;
      let reject = noop2;
      let resolved = false;
      let rejected = false;
      const promise = new Promise((res, rej) => {
        resolve4 = (value) => {
          resolved = true;
          return res(value);
        };
        reject = (value) => {
          rejected = true;
          return rej(value);
        };
      });
      const isPending = () => !resolved && !rejected;
      const isResolved = () => resolved;
      const isRejected = () => rejected;
      return { promise, resolve: resolve4, reject, isPending, isResolved, isRejected };
    };
    dist_default15 = makeNakedPromise;
  }
});

// node_modules/promise-make-counter/dist/index.js
var makeCounterPromise, dist_default16;
var init_dist18 = __esm({
  "node_modules/promise-make-counter/dist/index.js"() {
    init_dist17();
    makeCounterPromise = () => {
      const { promise, resolve: resolve4, isPending } = dist_default15();
      let counter = 0;
      const increment = () => {
        counter += 1;
      };
      const decrement = () => {
        counter -= 1;
        if (counter)
          return;
        resolve4();
      };
      const init = () => {
        increment();
        queueMicrotask(decrement);
      };
      init();
      return { promise, isPending, increment, decrement };
    };
    dist_default16 = makeCounterPromise;
  }
});

// node_modules/tiny-readdir/dist/constants.js
var NOOP_PROMISE_LIKE;
var init_constants4 = __esm({
  "node_modules/tiny-readdir/dist/constants.js"() {
    NOOP_PROMISE_LIKE = {
      then: (fn) => {
        fn();
      }
    };
  }
});

// node_modules/tiny-readdir/dist/utils.js
var castArray3, isFunction;
var init_utils9 = __esm({
  "node_modules/tiny-readdir/dist/utils.js"() {
    castArray3 = (value) => {
      return Array.isArray(value) ? value : [value];
    };
    isFunction = (value) => {
      return typeof value === "function";
    };
  }
});

// node_modules/tiny-readdir/dist/index.js
import fs6 from "fs";
import path6 from "path";
var readdir, dist_default17;
var init_dist19 = __esm({
  "node_modules/tiny-readdir/dist/index.js"() {
    init_dist18();
    init_constants4();
    init_utils9();
    readdir = (rootPath, options) => {
      const followSymlinks = options?.followSymlinks ?? false;
      const maxDepth = options?.depth ?? Infinity;
      const maxPaths = options?.limit ?? Infinity;
      const ignore = options?.ignore ?? [];
      const ignores = castArray3(ignore).map((ignore2) => isFunction(ignore2) ? ignore2 : (targetPath) => ignore2.test(targetPath));
      const isIgnored = (targetPath) => ignores.some((ignore2) => ignore2(targetPath));
      const signal = options?.signal ?? { aborted: false };
      const onDirents = options?.onDirents || (() => {
      });
      const directories = [];
      const directoriesNames = /* @__PURE__ */ new Set();
      const directoriesNamesToPaths = {};
      const files = [];
      const filesNames = /* @__PURE__ */ new Set();
      const filesNamesToPaths = {};
      const symlinks = [];
      const symlinksNames = /* @__PURE__ */ new Set();
      const symlinksNamesToPaths = {};
      const map = {};
      const visited = /* @__PURE__ */ new Set();
      const resultEmpty = { directories: [], directoriesNames: /* @__PURE__ */ new Set(), directoriesNamesToPaths: {}, files: [], filesNames: /* @__PURE__ */ new Set(), filesNamesToPaths: {}, symlinks: [], symlinksNames: /* @__PURE__ */ new Set(), symlinksNamesToPaths: {}, map: {} };
      const result = { directories, directoriesNames, directoriesNamesToPaths, files, filesNames, filesNamesToPaths, symlinks, symlinksNames, symlinksNamesToPaths, map };
      const { promise, increment, decrement } = dist_default16();
      let foundPaths = 0;
      const handleDirectory = (dirmap, subPath, name, depth) => {
        if (visited.has(subPath))
          return;
        if (foundPaths >= maxPaths)
          return;
        foundPaths += 1;
        dirmap.directories.push(subPath);
        dirmap.directoriesNames.add(name);
        directories.push(subPath);
        directoriesNames.add(name);
        directoriesNamesToPaths.propertyIsEnumerable(name) || (directoriesNamesToPaths[name] = []);
        directoriesNamesToPaths[name].push(subPath);
        visited.add(subPath);
        if (depth >= maxDepth)
          return;
        if (foundPaths >= maxPaths)
          return;
        populateResultFromPath(subPath, depth + 1);
      };
      const handleFile = (dirmap, subPath, name) => {
        if (visited.has(subPath))
          return;
        if (foundPaths >= maxPaths)
          return;
        foundPaths += 1;
        dirmap.files.push(subPath);
        dirmap.filesNames.add(name);
        files.push(subPath);
        filesNames.add(name);
        filesNamesToPaths.propertyIsEnumerable(name) || (filesNamesToPaths[name] = []);
        filesNamesToPaths[name].push(subPath);
        visited.add(subPath);
      };
      const handleSymlink = (dirmap, subPath, name, depth) => {
        if (visited.has(subPath))
          return;
        if (foundPaths >= maxPaths)
          return;
        foundPaths += 1;
        dirmap.symlinks.push(subPath);
        dirmap.symlinksNames.add(name);
        symlinks.push(subPath);
        symlinksNames.add(name);
        symlinksNamesToPaths.propertyIsEnumerable(name) || (symlinksNamesToPaths[name] = []);
        symlinksNamesToPaths[name].push(subPath);
        visited.add(subPath);
        if (!followSymlinks)
          return;
        if (depth >= maxDepth)
          return;
        if (foundPaths >= maxPaths)
          return;
        populateResultFromSymlink(subPath, depth + 1);
      };
      const handleStat = (dirmap, rootPath2, name, stat, depth) => {
        if (signal.aborted)
          return;
        if (isIgnored(rootPath2))
          return;
        if (stat.isDirectory()) {
          handleDirectory(dirmap, rootPath2, name, depth);
        } else if (stat.isFile()) {
          handleFile(dirmap, rootPath2, name);
        } else if (stat.isSymbolicLink()) {
          handleSymlink(dirmap, rootPath2, name, depth);
        }
      };
      const handleDirent = (dirmap, rootPath2, dirent, depth) => {
        if (signal.aborted)
          return;
        const separator = rootPath2 === path6.sep ? "" : path6.sep;
        const name = dirent.name;
        const subPath = `${rootPath2}${separator}${name}`;
        if (isIgnored(subPath))
          return;
        if (dirent.isDirectory()) {
          handleDirectory(dirmap, subPath, name, depth);
        } else if (dirent.isFile()) {
          handleFile(dirmap, subPath, name);
        } else if (dirent.isSymbolicLink()) {
          handleSymlink(dirmap, subPath, name, depth);
        }
      };
      const handleDirents = (dirmap, rootPath2, dirents, depth) => {
        for (let i = 0, l = dirents.length; i < l; i++) {
          handleDirent(dirmap, rootPath2, dirents[i], depth);
        }
      };
      const populateResultFromPath = (rootPath2, depth) => {
        if (signal.aborted)
          return;
        if (depth > maxDepth)
          return;
        if (foundPaths >= maxPaths)
          return;
        increment();
        fs6.readdir(rootPath2, { withFileTypes: true }, (error, dirents) => {
          if (error)
            return decrement();
          if (signal.aborted)
            return decrement();
          if (!dirents.length)
            return decrement();
          const promise2 = onDirents(dirents) || NOOP_PROMISE_LIKE;
          promise2.then(() => {
            const dirmap = map[rootPath2] = { directories: [], directoriesNames: /* @__PURE__ */ new Set(), directoriesNamesToPaths: {}, files: [], filesNames: /* @__PURE__ */ new Set(), filesNamesToPaths: {}, symlinks: [], symlinksNames: /* @__PURE__ */ new Set(), symlinksNamesToPaths: {} };
            handleDirents(dirmap, rootPath2, dirents, depth);
            decrement();
          });
        });
      };
      const populateResultFromSymlink = (rootPath2, depth) => {
        increment();
        fs6.realpath(rootPath2, (error, realPath) => {
          if (error)
            return decrement();
          if (signal.aborted)
            return decrement();
          fs6.stat(realPath, (error2, stat) => {
            if (error2)
              return decrement();
            if (signal.aborted)
              return decrement();
            const name = path6.basename(realPath);
            const dirmap = map[rootPath2] = { directories: [], directoriesNames: /* @__PURE__ */ new Set(), directoriesNamesToPaths: {}, files: [], filesNames: /* @__PURE__ */ new Set(), filesNamesToPaths: {}, symlinks: [], symlinksNames: /* @__PURE__ */ new Set(), symlinksNamesToPaths: {} };
            handleStat(dirmap, realPath, name, stat, depth);
            decrement();
          });
        });
      };
      const populateResultFromRoot = async (rootPath2, depth = 1) => {
        rootPath2 = path6.normalize(rootPath2);
        visited.add(rootPath2);
        populateResultFromPath(rootPath2, depth);
        await promise;
        if (signal.aborted)
          return resultEmpty;
        return result;
      };
      return populateResultFromRoot(rootPath);
    };
    dist_default17 = readdir;
  }
});

// node_modules/graphmatch/dist/utils.js
var getNodes, getNodeFlags, getNodeSourceWithCache, getNodeSource, uniq2;
var init_utils10 = __esm({
  "node_modules/graphmatch/dist/utils.js"() {
    getNodes = (node) => {
      const nodes = /* @__PURE__ */ new Set();
      const queue = [node];
      for (let i = 0; i < queue.length; i++) {
        const node2 = queue[i];
        if (nodes.has(node2))
          continue;
        nodes.add(node2);
        const { children } = node2;
        if (!children?.length)
          continue;
        for (let ci = 0, cl = children.length; ci < cl; ci++) {
          queue.push(children[ci]);
        }
      }
      return Array.from(nodes);
    };
    getNodeFlags = (node) => {
      let flags = "";
      const nodes = getNodes(node);
      for (let i = 0, l = nodes.length; i < l; i++) {
        const node2 = nodes[i];
        if (!node2.regex)
          continue;
        const nodeFlags = node2.regex.flags;
        flags || (flags = nodeFlags);
        if (flags === nodeFlags)
          continue;
        throw new Error(`Inconsistent RegExp flags used: "${flags}" and "${nodeFlags}"`);
      }
      return flags;
    };
    getNodeSourceWithCache = (node, partial, cache3) => {
      const cached = cache3.get(node);
      if (cached !== void 0)
        return cached;
      const isNodePartial = node.partial ?? partial;
      let source2 = "";
      if (node.regex) {
        source2 += isNodePartial ? "(?:$|" : "";
        source2 += node.regex.source;
      }
      if (node.children?.length) {
        const children = uniq2(node.children.map((node2) => getNodeSourceWithCache(node2, partial, cache3)).filter(Boolean));
        if (children?.length) {
          const isSomeChildNonPartial = node.children.some((child) => !child.regex || !(child.partial ?? partial));
          const needsWrapperGroup = children.length > 1 || isNodePartial && (!source2.length || isSomeChildNonPartial);
          source2 += needsWrapperGroup ? isNodePartial ? "(?:$|" : "(?:" : "";
          source2 += children.join("|");
          source2 += needsWrapperGroup ? ")" : "";
        }
      }
      if (node.regex) {
        source2 += isNodePartial ? ")" : "";
      }
      cache3.set(node, source2);
      return source2;
    };
    getNodeSource = (node, partial) => {
      const cache3 = /* @__PURE__ */ new Map();
      const nodes = getNodes(node);
      for (let i = nodes.length - 1; i >= 0; i--) {
        const source2 = getNodeSourceWithCache(nodes[i], partial, cache3);
        if (i > 0)
          continue;
        return source2;
      }
      return "";
    };
    uniq2 = (values) => {
      return Array.from(new Set(values));
    };
  }
});

// node_modules/graphmatch/dist/index.js
var graphmatch, dist_default18;
var init_dist20 = __esm({
  "node_modules/graphmatch/dist/index.js"() {
    init_utils10();
    graphmatch = (node, input, options) => {
      return graphmatch.compile(node, options).test(input);
    };
    graphmatch.compile = (node, options) => {
      const partial = options?.partial ?? false;
      const source2 = getNodeSource(node, partial);
      const flags = getNodeFlags(node);
      return new RegExp(`^(?:${source2})$`, flags);
    };
    dist_default18 = graphmatch;
  }
});

// node_modules/zeptomatch/dist/compile/index.js
var compile, compile_default;
var init_compile = __esm({
  "node_modules/zeptomatch/dist/compile/index.js"() {
    init_dist20();
    compile = (node, options) => {
      const re = dist_default18.compile(node, options);
      const source2 = `${re.source.slice(0, -1)}[\\\\/]?$`;
      const flags = re.flags;
      return new RegExp(source2, flags);
    };
    compile_default = compile;
  }
});

// node_modules/zeptomatch/dist/merge/index.js
var merge, merge_default;
var init_merge = __esm({
  "node_modules/zeptomatch/dist/merge/index.js"() {
    merge = (res) => {
      const source2 = res.map((re) => re.source).join("|") || "$^";
      const flags = res[0]?.flags;
      return new RegExp(source2, flags);
    };
    merge_default = merge;
  }
});

// node_modules/grammex/dist/utils.js
var isArray2, isFunction2, isFunctionNullary, isFunctionStrictlyNullaryOrUnary, isNumber2, isObject3, isRegExp, isRegExpCapturing, isRegExpStatic, isString2, isUndefined3, memoize2;
var init_utils11 = __esm({
  "node_modules/grammex/dist/utils.js"() {
    isArray2 = (value) => {
      return Array.isArray(value);
    };
    isFunction2 = (value) => {
      return typeof value === "function";
    };
    isFunctionNullary = (value) => {
      return value.length === 0;
    };
    isFunctionStrictlyNullaryOrUnary = (() => {
      const { toString } = Function.prototype;
      const re = /(?:^\(\s*(?:[^,.()]|\.(?!\.\.))*\s*\)\s*=>|^\s*[a-zA-Z$_][a-zA-Z0-9$_]*\s*=>)/;
      return (value) => {
        return (value.length === 0 || value.length === 1) && re.test(toString.call(value));
      };
    })();
    isNumber2 = (value) => {
      return typeof value === "number";
    };
    isObject3 = (value) => {
      return typeof value === "object" && value !== null;
    };
    isRegExp = (value) => {
      return value instanceof RegExp;
    };
    isRegExpCapturing = /* @__PURE__ */ (() => {
      const sourceRe = /\\\(|\((?!\?(?::|=|!|<=|<!))/;
      return (re) => {
        return sourceRe.test(re.source);
      };
    })();
    isRegExpStatic = /* @__PURE__ */ (() => {
      const sourceRe = /^[a-zA-Z0-9_-]+$/;
      return (re) => {
        return sourceRe.test(re.source) && !re.flags.includes("i");
      };
    })();
    isString2 = (value) => {
      return typeof value === "string";
    };
    isUndefined3 = (value) => {
      return value === void 0;
    };
    memoize2 = (fn) => {
      const cache3 = /* @__PURE__ */ new Map();
      return (arg) => {
        const cached = cache3.get(arg);
        if (cached !== void 0)
          return cached;
        const value = fn(arg);
        cache3.set(arg, value);
        return value;
      };
    };
  }
});

// node_modules/grammex/dist/index.js
var parse, match, chars, regex, regexCapturing, regexNonCapturing, string, repeat, optional, star, plus, and, or, backtrackable, handleable, memoizable, lazy, resolve;
var init_dist21 = __esm({
  "node_modules/grammex/dist/index.js"() {
    init_utils11();
    parse = (input, rule, options = {}) => {
      const state = { cache: {}, input, index: 0, indexBacktrackMax: 0, options, output: [] };
      const matched = resolve(rule)(state);
      const indexMax = Math.max(state.index, state.indexBacktrackMax);
      if (matched && state.index === input.length) {
        return state.output;
      } else {
        throw new Error(`Failed to parse at index ${indexMax}`);
      }
    };
    match = (target, handler) => {
      if (isArray2(target)) {
        return chars(target, handler);
      } else if (isString2(target)) {
        return string(target, handler);
      } else {
        return regex(target, handler);
      }
    };
    chars = (target, handler) => {
      const charCodes = {};
      for (const char of target) {
        if (char.length !== 1)
          throw new Error(`Invalid character: "${char}"`);
        const charCode = char.charCodeAt(0);
        charCodes[charCode] = true;
      }
      return (state) => {
        const input = state.input;
        let indexStart = state.index;
        let indexEnd = indexStart;
        while (indexEnd < input.length) {
          const charCode = input.charCodeAt(indexEnd);
          if (!(charCode in charCodes))
            break;
          indexEnd += 1;
        }
        if (indexEnd > indexStart) {
          if (!isUndefined3(handler) && !state.options.silent) {
            const target2 = input.slice(indexStart, indexEnd);
            const output = isFunction2(handler) ? handler(target2, input, `${indexStart}`) : handler;
            if (!isUndefined3(output)) {
              state.output.push(output);
            }
          }
          state.index = indexEnd;
        }
        return true;
      };
    };
    regex = (target, handler) => {
      if (isRegExpStatic(target)) {
        return string(target.source, handler);
      } else {
        const source2 = target.source;
        const flags = target.flags.replace(/y|$/, "y");
        const re = new RegExp(source2, flags);
        if (isRegExpCapturing(target) && isFunction2(handler) && !isFunctionStrictlyNullaryOrUnary(handler)) {
          return regexCapturing(re, handler);
        } else {
          return regexNonCapturing(re, handler);
        }
      }
    };
    regexCapturing = (re, handler) => {
      return (state) => {
        const indexStart = state.index;
        const input = state.input;
        re.lastIndex = indexStart;
        const match2 = re.exec(input);
        if (match2) {
          const indexEnd = re.lastIndex;
          if (!state.options.silent) {
            const output = handler(...match2, input, `${indexStart}`);
            if (!isUndefined3(output)) {
              state.output.push(output);
            }
          }
          state.index = indexEnd;
          return true;
        } else {
          return false;
        }
      };
    };
    regexNonCapturing = (re, handler) => {
      return (state) => {
        const indexStart = state.index;
        const input = state.input;
        re.lastIndex = indexStart;
        const matched = re.test(input);
        if (matched) {
          const indexEnd = re.lastIndex;
          if (!isUndefined3(handler) && !state.options.silent) {
            const output = isFunction2(handler) ? handler(input.slice(indexStart, indexEnd), input, `${indexStart}`) : handler;
            if (!isUndefined3(output)) {
              state.output.push(output);
            }
          }
          state.index = indexEnd;
          return true;
        } else {
          return false;
        }
      };
    };
    string = (target, handler) => {
      return (state) => {
        const indexStart = state.index;
        const input = state.input;
        const matched = input.startsWith(target, indexStart);
        if (matched) {
          if (!isUndefined3(handler) && !state.options.silent) {
            const output = isFunction2(handler) ? handler(target, input, `${indexStart}`) : handler;
            if (!isUndefined3(output)) {
              state.output.push(output);
            }
          }
          state.index += target.length;
          return true;
        } else {
          return false;
        }
      };
    };
    repeat = (rule, min, max, handler) => {
      const erule = resolve(rule);
      const isBacktrackable = min > 1;
      return memoizable(handleable(backtrackable((state) => {
        let repetitions = 0;
        while (repetitions < max) {
          const index = state.index;
          const matched = erule(state);
          if (!matched)
            break;
          repetitions += 1;
          if (state.index === index)
            break;
        }
        return repetitions >= min;
      }, isBacktrackable), handler));
    };
    optional = (rule, handler) => {
      return repeat(rule, 0, 1, handler);
    };
    star = (rule, handler) => {
      return repeat(rule, 0, Infinity, handler);
    };
    plus = (rule, handler) => {
      return repeat(rule, 1, Infinity, handler);
    };
    and = (rules, handler) => {
      const erules = rules.map(resolve);
      return memoizable(handleable(backtrackable((state) => {
        for (let i = 0, l = erules.length; i < l; i++) {
          if (!erules[i](state))
            return false;
        }
        return true;
      }), handler));
    };
    or = (rules, handler) => {
      const erules = rules.map(resolve);
      return memoizable(handleable((state) => {
        for (let i = 0, l = erules.length; i < l; i++) {
          if (erules[i](state))
            return true;
        }
        return false;
      }, handler));
    };
    backtrackable = (rule, enabled = true, force = false) => {
      const erule = resolve(rule);
      if (!enabled)
        return erule;
      return (state) => {
        const index = state.index;
        const length = state.output.length;
        const matched = erule(state);
        if (!matched && !force) {
          state.indexBacktrackMax = Math.max(state.indexBacktrackMax, state.index);
        }
        if (!matched || force) {
          state.index = index;
          if (state.output.length !== length) {
            state.output.length = length;
          }
        }
        return matched;
      };
    };
    handleable = (rule, handler) => {
      const erule = resolve(rule);
      if (!handler)
        return erule;
      return (state) => {
        if (state.options.silent)
          return erule(state);
        const length = state.output.length;
        const matched = erule(state);
        if (matched) {
          const outputs = state.output.splice(length, Infinity);
          const output = handler(outputs);
          if (!isUndefined3(output)) {
            state.output.push(output);
          }
          return true;
        } else {
          return false;
        }
      };
    };
    memoizable = /* @__PURE__ */ (() => {
      let RULE_ID = 0;
      return (rule) => {
        const erule = resolve(rule);
        const ruleId = RULE_ID += 1;
        return (state) => {
          var _a;
          if (state.options.memoization === false)
            return erule(state);
          const indexStart = state.index;
          const cache3 = (_a = state.cache)[ruleId] || (_a[ruleId] = { indexMax: -1, queue: [] });
          const cacheQueue = cache3.queue;
          const isPotentiallyCached = indexStart <= cache3.indexMax;
          if (isPotentiallyCached) {
            const cacheStore = cache3.store || (cache3.store = /* @__PURE__ */ new Map());
            if (cacheQueue.length) {
              for (let i = 0, l = cacheQueue.length; i < l; i += 2) {
                const key2 = cacheQueue[i * 2];
                const value = cacheQueue[i * 2 + 1];
                cacheStore.set(key2, value);
              }
              cacheQueue.length = 0;
            }
            const cached = cacheStore.get(indexStart);
            if (cached === false) {
              return false;
            } else if (isNumber2(cached)) {
              state.index = cached;
              return true;
            } else if (cached) {
              state.index = cached.index;
              if (cached.output?.length) {
                state.output.push(...cached.output);
              }
              return true;
            }
          }
          const lengthStart = state.output.length;
          const matched = erule(state);
          cache3.indexMax = Math.max(cache3.indexMax, indexStart);
          if (matched) {
            const indexEnd = state.index;
            const lengthEnd = state.output.length;
            if (lengthEnd > lengthStart) {
              const output = state.output.slice(lengthStart, lengthEnd);
              cacheQueue.push(indexStart, { index: indexEnd, output });
            } else {
              cacheQueue.push(indexStart, indexEnd);
            }
            return true;
          } else {
            cacheQueue.push(indexStart, false);
            return false;
          }
        };
      };
    })();
    lazy = (getter) => {
      let erule;
      return (state) => {
        erule || (erule = resolve(getter()));
        return erule(state);
      };
    };
    resolve = memoize2((rule) => {
      if (isFunction2(rule)) {
        if (isFunctionNullary(rule)) {
          return lazy(rule);
        } else {
          return rule;
        }
      }
      if (isString2(rule) || isRegExp(rule)) {
        return match(rule);
      }
      if (isArray2(rule)) {
        return and(rule);
      }
      if (isObject3(rule)) {
        return or(Object.values(rule));
      }
      throw new Error("Invalid rule");
    });
  }
});

// node_modules/zeptomatch/dist/utils.js
var identity2, isString3, memoizeByObject, memoizeByPrimitive;
var init_utils12 = __esm({
  "node_modules/zeptomatch/dist/utils.js"() {
    identity2 = (value) => {
      return value;
    };
    isString3 = (value) => {
      return typeof value === "string";
    };
    memoizeByObject = (fn) => {
      const cacheFull = /* @__PURE__ */ new WeakMap();
      const cachePartial = /* @__PURE__ */ new WeakMap();
      return (globs, options) => {
        const cache3 = options?.partial ? cachePartial : cacheFull;
        const cached = cache3.get(globs);
        if (cached !== void 0)
          return cached;
        const result = fn(globs, options);
        cache3.set(globs, result);
        return result;
      };
    };
    memoizeByPrimitive = (fn) => {
      const cacheFull = {};
      const cachePartial = {};
      return (glob, options) => {
        const cache3 = options?.partial ? cachePartial : cacheFull;
        return cache3[glob] ?? (cache3[glob] = fn(glob, options));
      };
    };
  }
});

// node_modules/zeptomatch/dist/normalize/grammar.js
var Escaped, Passthrough, StarStarStar, StarStarNoLeft, StarStarNoRight, Grammar, grammar_default;
var init_grammar = __esm({
  "node_modules/zeptomatch/dist/normalize/grammar.js"() {
    init_dist21();
    init_utils12();
    Escaped = match(/\\./, identity2);
    Passthrough = match(/./, identity2);
    StarStarStar = match(/\*\*\*+/, "*");
    StarStarNoLeft = match(/([^/{[(!])\*\*/, (_, $1) => `${$1}*`);
    StarStarNoRight = match(/(^|.)\*\*(?=[^*/)\]}])/, (_, $1) => `${$1}*`);
    Grammar = star(or([Escaped, StarStarStar, StarStarNoLeft, StarStarNoRight, Passthrough]));
    grammar_default = Grammar;
  }
});

// node_modules/zeptomatch/dist/normalize/index.js
var normalize, normalize_default;
var init_normalize = __esm({
  "node_modules/zeptomatch/dist/normalize/index.js"() {
    init_dist21();
    init_grammar();
    normalize = (glob) => {
      return parse(glob, grammar_default, { memoization: false }).join("");
    };
    normalize_default = normalize;
  }
});

// node_modules/zeptomatch/dist/range.js
var ALPHABET, int2alpha, alpha2int, makeRangeInt, makeRangePaddedInt, makeRangeAlpha;
var init_range = __esm({
  "node_modules/zeptomatch/dist/range.js"() {
    ALPHABET = "abcdefghijklmnopqrstuvwxyz";
    int2alpha = (int) => {
      let alpha = "";
      while (int > 0) {
        const reminder = (int - 1) % 26;
        alpha = ALPHABET[reminder] + alpha;
        int = Math.floor((int - 1) / 26);
      }
      return alpha;
    };
    alpha2int = (str) => {
      let int = 0;
      for (let i = 0, l = str.length; i < l; i++) {
        int = int * 26 + ALPHABET.indexOf(str[i]) + 1;
      }
      return int;
    };
    makeRangeInt = (start, end) => {
      if (end < start)
        return makeRangeInt(end, start);
      const range = [];
      while (start <= end) {
        range.push(start++);
      }
      return range;
    };
    makeRangePaddedInt = (start, end, paddingLength) => {
      return makeRangeInt(start, end).map((int) => String(int).padStart(paddingLength, "0"));
    };
    makeRangeAlpha = (start, end) => {
      return makeRangeInt(alpha2int(start), alpha2int(end)).map(int2alpha);
    };
  }
});

// node_modules/zeptomatch/dist/parse/utils.js
var regex2, alternation, sequence, slash;
var init_utils13 = __esm({
  "node_modules/zeptomatch/dist/parse/utils.js"() {
    regex2 = (source2) => {
      const regex3 = new RegExp(source2, "s");
      return { partial: false, regex: regex3, children: [] };
    };
    alternation = (children) => {
      return { children };
    };
    sequence = /* @__PURE__ */ (() => {
      const pushToLeaves = (parent, child, handled) => {
        if (handled.has(parent))
          return;
        handled.add(parent);
        const { children } = parent;
        if (!children.length) {
          children.push(child);
        } else {
          for (let i = 0, l = children.length; i < l; i++) {
            pushToLeaves(children[i], child, handled);
          }
        }
      };
      return (nodes) => {
        if (!nodes.length) {
          return alternation([]);
        }
        for (let i = nodes.length - 1; i >= 1; i--) {
          const handled = /* @__PURE__ */ new Set();
          const parent = nodes[i - 1];
          const child = nodes[i];
          pushToLeaves(parent, child, handled);
        }
        return nodes[0];
      };
    })();
    slash = () => {
      const regex3 = new RegExp("[\\\\/]", "s");
      return { regex: regex3, children: [] };
    };
  }
});

// node_modules/zeptomatch/dist/parse/grammar.js
var Escaped2, Escape, Slash, Passthrough2, NegationOdd, NegationEven, Negation, StarStarBetween, StarStarStart, StarStarEnd, StarStarNone, StarStar, StarDouble, StarSingle, Star, Question, ClassOpen, ClassClose, ClassNegation, ClassRange, ClassEscaped, ClassEscape, ClassSlash, ClassPassthrough, ClassValue, Class, RangeOpen, RangeClose, RangeNumeric, RangeAlphaLower, RangeAlphaUpper, RangeValue, Range, BracesOpen, BracesClose, BracesComma, BracesEscaped, BracesEscape, BracesSlash, BracesPassthrough, BracesNested, BracesEmptyValue, BracesFullValue, BracesValue, Braces, Grammar2, grammar_default2;
var init_grammar2 = __esm({
  "node_modules/zeptomatch/dist/parse/grammar.js"() {
    init_dist21();
    init_range();
    init_utils12();
    init_dist22();
    init_utils13();
    Escaped2 = match(/\\./, regex2);
    Escape = match(/[$.*+?^(){}[\]\|]/, (char) => regex2(`\\${char}`));
    Slash = match(/[\\\/]/, slash);
    Passthrough2 = match(/[^$.*+?^(){}[\]\|\\\/]+/, regex2);
    NegationOdd = match(/^(?:!!)*!(.*)$/, (_, glob) => regex2(`(?!^${dist_default19.compile(glob).source}$).*?`));
    NegationEven = match(/^(!!)+/);
    Negation = or([NegationOdd, NegationEven]);
    StarStarBetween = match(/\/(\*\*\/)+/, () => alternation([sequence([slash(), regex2(".+?"), slash()]), slash()]));
    StarStarStart = match(/^(\*\*\/)+/, () => alternation([regex2("^"), sequence([regex2(".*?"), slash()])]));
    StarStarEnd = match(/\/(\*\*)$/, () => alternation([sequence([slash(), regex2(".*?")]), regex2("$")]));
    StarStarNone = match(/\*\*/, () => regex2(".*?"));
    StarStar = or([StarStarBetween, StarStarStart, StarStarEnd, StarStarNone]);
    StarDouble = match(/\*\/(?!\*\*\/|\*$)/, () => sequence([regex2("[^\\\\/]*?"), slash()]));
    StarSingle = match(/\*/, () => regex2("[^\\\\/]*"));
    Star = or([StarDouble, StarSingle]);
    Question = match("?", () => regex2("[^\\\\/]"));
    ClassOpen = match("[", identity2);
    ClassClose = match("]", identity2);
    ClassNegation = match(/[!^]/, "^\\\\/");
    ClassRange = match(/[a-z]-[a-z]|[0-9]-[0-9]/i, identity2);
    ClassEscaped = match(/\\./, identity2);
    ClassEscape = match(/[$.*+?^(){}[\|]/, (char) => `\\${char}`);
    ClassSlash = match(/[\\\/]/, "\\\\/");
    ClassPassthrough = match(/[^$.*+?^(){}[\]\|\\\/]+/, identity2);
    ClassValue = or([ClassEscaped, ClassEscape, ClassSlash, ClassRange, ClassPassthrough]);
    Class = and([ClassOpen, optional(ClassNegation), star(ClassValue), ClassClose], (_) => regex2(_.join("")));
    RangeOpen = match("{", "(?:");
    RangeClose = match("}", ")");
    RangeNumeric = match(/(\d+)\.\.(\d+)/, (_, $1, $2) => makeRangePaddedInt(+$1, +$2, Math.min($1.length, $2.length)).join("|"));
    RangeAlphaLower = match(/([a-z]+)\.\.([a-z]+)/, (_, $1, $2) => makeRangeAlpha($1, $2).join("|"));
    RangeAlphaUpper = match(/([A-Z]+)\.\.([A-Z]+)/, (_, $1, $2) => makeRangeAlpha($1.toLowerCase(), $2.toLowerCase()).join("|").toUpperCase());
    RangeValue = or([RangeNumeric, RangeAlphaLower, RangeAlphaUpper]);
    Range = and([RangeOpen, RangeValue, RangeClose], (_) => regex2(_.join("")));
    BracesOpen = match("{");
    BracesClose = match("}");
    BracesComma = match(",");
    BracesEscaped = match(/\\./, regex2);
    BracesEscape = match(/[$.*+?^(){[\]\|]/, (char) => regex2(`\\${char}`));
    BracesSlash = match(/[\\\/]/, slash);
    BracesPassthrough = match(/[^$.*+?^(){}[\]\|\\\/,]+/, regex2);
    BracesNested = lazy(() => Braces);
    BracesEmptyValue = match("", () => regex2("(?:)"));
    BracesFullValue = plus(or([StarStar, Star, Question, Class, Range, BracesNested, BracesEscaped, BracesEscape, BracesSlash, BracesPassthrough]), sequence);
    BracesValue = or([BracesFullValue, BracesEmptyValue]);
    Braces = and([BracesOpen, optional(and([BracesValue, star(and([BracesComma, BracesValue]))])), BracesClose], alternation);
    Grammar2 = star(or([Negation, StarStar, Star, Question, Class, Range, Braces, Escaped2, Escape, Slash, Passthrough2]), sequence);
    grammar_default2 = Grammar2;
  }
});

// node_modules/zeptomatch/dist/parse/index.js
var _parse, parse_default;
var init_parse = __esm({
  "node_modules/zeptomatch/dist/parse/index.js"() {
    init_dist21();
    init_grammar2();
    _parse = (glob) => {
      return parse(glob, grammar_default2, { memoization: false })[0];
    };
    parse_default = _parse;
  }
});

// node_modules/zeptomatch/dist/index.js
var zeptomatch, dist_default19;
var init_dist22 = __esm({
  "node_modules/zeptomatch/dist/index.js"() {
    init_compile();
    init_merge();
    init_normalize();
    init_parse();
    init_utils12();
    zeptomatch = (glob, path18, options) => {
      return zeptomatch.compile(glob, options).test(path18);
    };
    zeptomatch.compile = (() => {
      const compileGlob = memoizeByPrimitive((glob, options) => {
        return compile_default(parse_default(normalize_default(glob)), options);
      });
      const compileGlobs = memoizeByObject((globs, options) => {
        return merge_default(globs.map((glob) => compileGlob(glob, options)));
      });
      return (glob, options) => {
        if (isString3(glob)) {
          return compileGlob(glob, options);
        } else {
          return compileGlobs(glob, options);
        }
      };
    })();
    dist_default19 = zeptomatch;
  }
});

// node_modules/zeptomatch-explode/dist/explode_start.js
var SIMPLE_RE, explodeStart, explode_start_default;
var init_explode_start = __esm({
  "node_modules/zeptomatch-explode/dist/explode_start.js"() {
    SIMPLE_RE = /(\/?)([ a-zA-Z0-9._-]*)(?:\{([ a-zA-Z0-9._-]+(?:,[ a-zA-Z0-9._-]+)*)\})?([ a-zA-Z0-9._-]*)(\/(?=.))/gsy;
    explodeStart = (glob) => {
      let index = 0;
      let length = glob.length;
      let statics = [];
      while (index < length) {
        SIMPLE_RE.lastIndex = index;
        const match2 = SIMPLE_RE.exec(glob);
        if (!match2)
          break;
        const [_, slash2, prefix, multiple, suffix] = match2;
        if (!prefix && !multiple && !suffix)
          break;
        const values = multiple ? multiple.split(",").map((value) => `${slash2}${prefix}${value}${suffix}`) : [`${slash2}${prefix}${suffix}`];
        statics = statics.length ? statics.flatMap((prefix2) => values.map((value) => `${prefix2}/${value}`)) : values;
        index = SIMPLE_RE.lastIndex;
      }
      const dynamic = index ? glob.slice(index) : glob;
      return { statics, dynamic };
    };
    explode_start_default = explodeStart;
  }
});

// node_modules/zeptomatch-explode/dist/explode_end.js
var SIMPLE_RE2, explodeEnd, explode_end_default;
var init_explode_end = __esm({
  "node_modules/zeptomatch-explode/dist/explode_end.js"() {
    SIMPLE_RE2 = /(^|\/)(\*?)([ a-zA-Z0-9._-]*)(?:\{([ a-zA-Z0-9._-]+(?:,[ a-zA-Z0-9._-]+)*)\})?([ a-zA-Z0-9._-]*)(\*?)$/;
    explodeEnd = (glob) => {
      const match2 = SIMPLE_RE2.exec(glob);
      if (match2) {
        const [_, slash2, starStart, prefix, multiple, suffix, starEnd] = match2;
        if (prefix || multiple || suffix) {
          const flexibleStart = !!starStart;
          const flexibleEnd = !!starEnd;
          const statics = multiple ? multiple.split(",").map((value) => `${prefix}${value}${suffix}`) : [`${prefix}${suffix}`];
          const head = glob.slice(0, match2.index);
          const dynamic = head ? `${head}/*` : "*";
          return { flexibleStart, flexibleEnd, statics, dynamic };
        } else if (starStart || starEnd) {
          const flexibleStart = true;
          const flexibleEnd = true;
          const statics = [];
          const dynamic = glob;
          return { flexibleStart, flexibleEnd, statics, dynamic };
        }
      }
      return { flexibleStart: false, flexibleEnd: false, statics: [], dynamic: glob };
    };
    explode_end_default = explodeEnd;
  }
});

// node_modules/zeptomatch-explode/dist/index.js
var init_dist23 = __esm({
  "node_modules/zeptomatch-explode/dist/index.js"() {
    init_explode_start();
    init_explode_end();
  }
});

// node_modules/zeptomatch-is-static/dist/index.js
var isStatic, dist_default20;
var init_dist24 = __esm({
  "node_modules/zeptomatch-is-static/dist/index.js"() {
    isStatic = /* @__PURE__ */ (() => {
      const re = /^(?:\\$|\\.|[^*?!^{}[\]\\])*$/s;
      return (glob) => {
        return re.test(glob);
      };
    })();
    dist_default20 = isStatic;
  }
});

// node_modules/zeptomatch-unescape/dist/index.js
var unescape, dist_default21;
var init_dist25 = __esm({
  "node_modules/zeptomatch-unescape/dist/index.js"() {
    unescape = /* @__PURE__ */ (() => {
      const re = /\\(.)/gs;
      return (glob) => {
        return glob.replace(re, "$1");
      };
    })();
    dist_default21 = unescape;
  }
});

// node_modules/tiny-readdir-glob/dist/utils.js
import path7 from "path";
var castArray4, globExplode, globsExplode, globCompile, globsCompile, globsPartition, ignoreCompile, intersection, isPathSep, isString4, uniq3, uniqFlat, uniqMergeConcat;
var init_utils14 = __esm({
  "node_modules/tiny-readdir-glob/dist/utils.js"() {
    init_dist22();
    init_dist23();
    init_dist24();
    init_dist25();
    castArray4 = (value) => {
      return Array.isArray(value) ? value : [value];
    };
    globExplode = (glob) => {
      if (dist_default20(glob)) {
        return [[dist_default21(glob)], "**/*"];
      } else {
        const { statics, dynamic } = explode_start_default(glob);
        return [statics, dynamic];
      }
    };
    globsExplode = (globs) => {
      const results = [];
      for (const glob of globs) {
        const [paths, pathsGlob] = globExplode(glob);
        if (!paths.length) {
          paths.push("");
        }
        for (const path18 of paths) {
          const existing = results.find((result) => result[0].includes(path18));
          if (existing) {
            if (!existing[1].includes(pathsGlob)) {
              existing[1].push(pathsGlob);
            }
          } else {
            results.push([[path18], [pathsGlob]]);
          }
        }
      }
      return results;
    };
    globCompile = (glob) => {
      if (!glob || glob === "**/*") {
        return () => true;
      }
      const { flexibleStart, flexibleEnd, statics, dynamic } = explode_end_default(glob);
      if (dynamic === "**/*" && statics.length && !flexibleEnd) {
        return (rootPath, targetPath) => {
          for (let i = 0, l = statics.length; i < l; i++) {
            const end = statics[i];
            if (!targetPath.endsWith(end))
              continue;
            if (flexibleStart)
              return true;
            if (targetPath.length === end.length)
              return true;
            if (isPathSep(targetPath[targetPath.length - end.length - 1]))
              return true;
          }
          return false;
        };
      } else {
        const re = dist_default19.compile(glob);
        return (rootPath, targetPath) => {
          return re.test(path7.relative(rootPath, targetPath));
        };
      }
    };
    globsCompile = (globs) => {
      const fns = globs.map(globCompile);
      return (rootPath, targetPath) => fns.some((fn) => fn(rootPath, targetPath));
    };
    globsPartition = (globs) => {
      const positives = [];
      const negatives = [];
      const bangsRe = /^!+/;
      if (globs.length) {
        for (const glob of globs) {
          const match2 = glob.match(bangsRe);
          if (match2) {
            const bangsNr = match2[0].length;
            const bucket = bangsNr % 2 === 0 ? positives : negatives;
            bucket.push(glob.slice(bangsNr));
          } else {
            positives.push(glob);
          }
        }
        if (!positives.length) {
          positives.push("**");
        }
      }
      return [positives, negatives];
    };
    ignoreCompile = (rootPath, ignore) => {
      if (!ignore)
        return;
      return castArray4(ignore).map((ignore2) => {
        if (!isString4(ignore2))
          return ignore2;
        const fn = globCompile(ignore2);
        return (targetPath) => fn(rootPath, targetPath);
      });
    };
    intersection = (sets) => {
      if (sets.length === 1)
        return sets[0];
      const result = /* @__PURE__ */ new Set();
      for (let i = 0, l = sets.length; i < l; i++) {
        const set3 = sets[i];
        for (const value of set3) {
          result.add(value);
        }
      }
      return result;
    };
    isPathSep = (char) => {
      return char === "/" || char === "\\";
    };
    isString4 = (value) => {
      return typeof value === "string";
    };
    uniq3 = (values) => {
      if (values.length < 2)
        return values;
      return Array.from(new Set(values));
    };
    uniqFlat = (values) => {
      if (values.length === 1)
        return values[0];
      return uniq3(values.flat());
    };
    uniqMergeConcat = (values) => {
      if (values.length === 1)
        return values[0];
      const merged = {};
      for (let i = 0, l = values.length; i < l; i++) {
        const value = values[i];
        for (const key2 in value) {
          const prev = merged[key2];
          const next = Array.isArray(prev) ? prev.concat(value[key2]) : value[key2];
          merged[key2] = next;
        }
      }
      for (const key2 in merged) {
        merged[key2] = uniq3(merged[key2]);
      }
      return merged;
    };
  }
});

// node_modules/tiny-readdir-glob/dist/index.js
import path8 from "path";
import process10 from "process";
var readdirGlob, dist_default22;
var init_dist26 = __esm({
  "node_modules/tiny-readdir-glob/dist/index.js"() {
    init_dist19();
    init_utils14();
    readdirGlob = async (glob, options) => {
      const [globsPositive, globsNegative] = globsPartition(castArray4(glob));
      const cwd = options?.cwd ?? process10.cwd();
      const ignore = [...castArray4(options?.ignore ?? []), ...globsNegative];
      const bucketDirectories = [];
      const bucketFiles = [];
      const bucketSymlinks = [];
      const bucketDirectoriesFound = [];
      const bucketFilesFound = [];
      const bucketSymlinksFound = [];
      const bucketDirectoriesFoundNames = [];
      const bucketFilesFoundNames = [];
      const bucketSymlinksFoundNames = [];
      const bucketDirectoriesFoundNamesToPaths = [];
      const bucketFilesFoundNamesToPaths = [];
      const bucketSymlinksFoundNamesToPaths = [];
      for (const [folders, foldersGlobs] of globsExplode(globsPositive)) {
        const isMatch = globsCompile(foldersGlobs);
        for (const folder of folders) {
          const rootPath = path8.join(cwd, folder).replace(/\/$/, "");
          const isIgnored = ignoreCompile(rootPath, ignore);
          const isRelativeMatch = (targetPath) => isMatch(rootPath, targetPath);
          const result = await dist_default17(rootPath, {
            depth: options?.depth,
            limit: options?.limit,
            followSymlinks: options?.followSymlinks,
            ignore: isIgnored,
            signal: options?.signal,
            onDirents: options?.onDirents
          });
          bucketDirectories.push(result.directories.filter(isRelativeMatch));
          bucketFiles.push(result.files.filter(isRelativeMatch));
          bucketSymlinks.push(result.symlinks.filter(isRelativeMatch));
          bucketDirectoriesFound.push(result.directories);
          bucketFilesFound.push(result.files);
          bucketSymlinksFound.push(result.symlinks);
          bucketDirectoriesFoundNames.push(result.directoriesNames);
          bucketFilesFoundNames.push(result.filesNames);
          bucketSymlinksFoundNames.push(result.symlinksNames);
          bucketDirectoriesFoundNamesToPaths.push(result.directoriesNamesToPaths);
          bucketFilesFoundNamesToPaths.push(result.filesNamesToPaths);
          bucketSymlinksFoundNamesToPaths.push(result.symlinksNamesToPaths);
        }
      }
      const directories = uniqFlat(bucketDirectories);
      const files = uniqFlat(bucketFiles);
      const symlinks = uniqFlat(bucketSymlinks);
      const directoriesFound = uniqFlat(bucketDirectoriesFound);
      const filesFound = uniqFlat(bucketFilesFound);
      const symlinksFound = uniqFlat(bucketSymlinksFound);
      const directoriesFoundNames = intersection(bucketDirectoriesFoundNames);
      const filesFoundNames = intersection(bucketFilesFoundNames);
      const symlinksFoundNames = intersection(bucketSymlinksFoundNames);
      const directoriesFoundNamesToPaths = uniqMergeConcat(bucketDirectoriesFoundNamesToPaths);
      const filesFoundNamesToPaths = uniqMergeConcat(bucketFilesFoundNamesToPaths);
      const symlinksFoundNamesToPaths = uniqMergeConcat(bucketSymlinksFoundNamesToPaths);
      return { directories, files, symlinks, directoriesFound, filesFound, symlinksFound, directoriesFoundNames, filesFoundNames, symlinksFoundNames, directoriesFoundNamesToPaths, filesFoundNamesToPaths, symlinksFoundNamesToPaths };
    };
    dist_default22 = readdirGlob;
  }
});

// node_modules/zeptomatch-escape/dist/index.js
var escape, dist_default23;
var init_dist27 = __esm({
  "node_modules/zeptomatch-escape/dist/index.js"() {
    escape = /* @__PURE__ */ (() => {
      const re = /(\\.)|([*?!^{}[\]])|(.)/gs;
      const replacer = (_, $1, $2, $3) => $1 || $3 || `\\${$2}`;
      return (value) => {
        return value.replace(re, replacer);
      };
    })();
    dist_default23 = escape;
  }
});

// node_modules/@prettier/cli/dist/utils.js
import crypto from "crypto";
import fs7 from "fs";
import path9 from "path";
import process11 from "process";
import { text as stream2text } from "stream/consumers";
import url from "url";
function castArray5(value) {
  return isArray3(value) ? value : [value];
}
function fastJoinedPath(folderPath, fileName) {
  return `${folderPath}${path9.sep}${fileName}`;
}
function fastRelativePath(fromPath, toPath) {
  if (toPath.startsWith(fromPath)) {
    if (toPath[fromPath.length] === path9.sep) {
      return toPath.slice(fromPath.length + 1);
    }
  }
  return path9.relative(fromPath, toPath);
}
function fastRelativeChildPath(fromPath, toPath) {
  if (toPath.startsWith(fromPath)) {
    if (toPath[fromPath.length] === path9.sep) {
      return toPath.slice(fromPath.length + 1);
    }
  }
}
function findLastIndex(array, predicate) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i], i, array)) return i;
  }
  return -1;
}
function getCachePath(rootPath) {
  const nodeModulesPaths = path9.join(rootPath, "node_modules");
  const cachePath = path9.join(nodeModulesPaths, ".cache", "prettier", ".prettier-caches");
  return cachePath;
}
function getCacheRootPath(rootPath) {
  return findDirectoryUpwards(rootPath, (folderPath) => fs7.existsSync(path9.join(folderPath, "node_modules")));
}
function getDirectoryPaths(rootPath, withNodeModules) {
  const ignoreGlob = `**/{.git,.sl,.svn,.hg,.DS_Store,Thumbs.db${withNodeModules ? "" : ",node_modules"}}`;
  const ignoreRe = dist_default19.compile(ignoreGlob);
  const ignore = (targetPath) => {
    return ignoreRe.test(path9.relative(rootPath, targetPath));
  };
  return dist_default17(rootPath, {
    followSymlinks: false,
    ignore
  });
}
function getExpandedFoldersPaths(foldersPaths, untilPath = "/") {
  const knownPaths = new Set(foldersPaths);
  const expandedPaths = /* @__PURE__ */ new Set();
  const extraPaths = /* @__PURE__ */ new Set();
  for (let i = 0, l = foldersPaths.length; i < l; i++) {
    let folderPath = foldersPaths[i];
    while (true) {
      if (expandedPaths.has(folderPath)) break;
      if (folderPath === untilPath) break;
      expandedPaths.add(folderPath);
      folderPath = path9.dirname(folderPath);
      if (!knownPaths.has(folderPath)) {
        extraPaths.add(folderPath);
      }
    }
  }
  return [[...expandedPaths], [...extraPaths]];
}
async function getFolderChildrenPaths(folderPath) {
  const dirents = await fs7.promises.readdir(folderPath, {
    withFileTypes: true
  });
  const childrenPaths = dirents.map((dirent) => fastJoinedPath(folderPath, dirent.name));
  return childrenPaths;
}
async function getFoldersChildrenPaths(foldersPaths) {
  const childrensPaths = await Promise.all(foldersPaths.map(getFolderChildrenPaths));
  const childrenPaths = childrensPaths.flat();
  return childrenPaths;
}
function getGlobPaths(rootPath, globs, withNodeModules) {
  return dist_default22(globs, {
    cwd: rootPath,
    followSymlinks: false,
    ignore: `**/{.git,.sl,.svn,.hg,.DS_Store,Thumbs.db${withNodeModules ? "" : ",node_modules"}}`
  });
}
async function getModule(modulePath) {
  const moduleExports = await import(url.pathToFileURL(modulePath).href);
  const module = moduleExports.default || moduleExports.exports || moduleExports;
  return module;
}
function getModulePath(name, rootPath) {
  const rootUrl = url.pathToFileURL(rootPath);
  const moduleUrl = moduleResolve(name, rootUrl);
  const modulePath = url.fileURLToPath(moduleUrl);
  return modulePath;
}
function identity3(value) {
  return value;
}
async function getPluginOrExit(name) {
  try {
    return await getPlugin(name);
  } catch {
    exit_default(`The plugin "${name}" could not be loaded`);
  }
}
function getPluginPath(name) {
  const rootPath = path9.join(process11.cwd(), "index.js");
  try {
    return getModulePath(`./${name}`, rootPath);
  } catch {
    return getModulePath(name, rootPath);
  }
}
function getPluginVersion(name) {
  const pluginPath = getPluginPath(name);
  const parentPath = path9.dirname(pluginPath);
  const pkg = dist_default2("package.json", parentPath);
  if (!pkg || !pkg.content.version) {
    return null;
  } else {
    return pkg.content.version;
  }
}
function getPluginsVersions(names) {
  const pluginsVersions = names.map(getPluginVersion);
  return pluginsVersions;
}
function findDirectoryUpwards(rootPath, isMatch) {
  let currentPath = rootPath;
  while (true) {
    if (isMatch(currentPath)) return currentPath;
    const currentPathNext = path9.dirname(currentPath);
    if (currentPath === currentPathNext) return;
    currentPath = currentPathNext;
  }
}
function getProjectPath(rootPath) {
  function isProjectPath(folderPath) {
    const gitPath = path9.join(folderPath, ".git");
    if (fs7.existsSync(gitPath)) return true;
    const hgPath = path9.join(folderPath, ".hg");
    if (fs7.existsSync(hgPath)) return true;
    const svnPath = path9.join(folderPath, ".svn");
    if (fs7.existsSync(svnPath)) return true;
    const slPath = path9.join(folderPath, ".sl");
    if (fs7.existsSync(slPath)) return true;
    return false;
  }
  return findDirectoryUpwards(rootPath, isProjectPath) ?? rootPath;
}
function getStats(targetPath) {
  try {
    return fs7.statSync(targetPath);
  } catch {
    return;
  }
}
async function getTargetsPaths(rootPath, globs, withNodeModules) {
  const targetFiles = [];
  const targetFilesNames = [];
  const targetFilesNamesToPaths = {};
  const targetDirectories = [];
  const targetGlobs = [];
  for (const glob of globs) {
    const filePath = path9.resolve(rootPath, glob);
    const fileStats = getStats(filePath);
    if (fileStats?.isFile()) {
      const fileName = path9.basename(filePath);
      targetFiles.push(filePath);
      targetFilesNames.push(fileName);
      targetFilesNamesToPaths.propertyIsEnumerable(fileName) || (targetFilesNamesToPaths[fileName] = []);
      targetFilesNamesToPaths[fileName].push(filePath);
    } else if (fileStats?.isDirectory()) {
      targetDirectories.push(filePath);
    } else {
      targetGlobs.push(glob);
    }
  }
  const globResult = await getGlobPaths(rootPath, targetGlobs, withNodeModules);
  const globResultFiles = globResult.files;
  const globResultFilesFoundNames = [...globResult.filesFoundNames];
  const directoriesResults = await Promise.all(targetDirectories.map((targetPath) => getDirectoryPaths(targetPath, withNodeModules)));
  const directoriesResultsFiles = directoriesResults.map((result) => result.files);
  const directoriesResultsFilesFoundNames = directoriesResults.map((result) => [...result.filesNames]);
  const foundFiles = uniqChunks(globResultFiles, ...directoriesResultsFiles);
  const foundFilesNames = uniqChunks(globResultFilesFoundNames, ...directoriesResultsFilesFoundNames);
  const filesPaths = [...without2(targetFiles, foundFiles), ...foundFiles];
  const filesNames = [...without2(targetFilesNames, foundFilesNames), ...foundFilesNames];
  const filesNamesToPaths = globResult.filesFoundNamesToPaths;
  for (const fileName in targetFilesNamesToPaths) {
    const prev = filesNamesToPaths[fileName];
    const next = Array.isArray(prev) ? prev.concat(targetFilesNamesToPaths[fileName]) : targetFilesNamesToPaths[fileName];
    filesNamesToPaths[fileName] = uniq4(next);
  }
  const filesExplicitPaths = targetFiles;
  const globFilesFoundPaths = globResult.filesFound;
  const directoryFilesFoundPaths = directoriesResultsFiles.flat();
  const filesFoundPaths = [...globFilesFoundPaths, ...directoryFilesFoundPaths];
  const globFoldersFoundPaths = globResult.directoriesFound;
  const directoryFoldersFoundPaths = directoriesResults.flatMap((result) => result.directories);
  const foldersFoundPaths = [rootPath, ...globFoldersFoundPaths, ...directoryFoldersFoundPaths];
  return [filesPaths, filesNames, filesNamesToPaths, filesExplicitPaths, filesFoundPaths, foldersFoundPaths];
}
function isArray3(value) {
  return Array.isArray(value);
}
function isBoolean2(value) {
  return typeof value === "boolean";
}
function isFunction3(value) {
  return typeof value === "function";
}
function isInteger(value) {
  return Number.isInteger(value);
}
function isIntegerInRange(value, min = -Infinity, max = Infinity, step = 1) {
  return isInteger(value) && value >= min && value <= max && value % step === 0;
}
function isNull2(value) {
  return value === null;
}
function isNumber3(value) {
  return typeof value === "number";
}
function isObject4(value) {
  if (value === null) return false;
  const type = typeof value;
  return type === "object" || type === "function";
}
function isString5(value) {
  return typeof value === "string";
}
function isTruthy(value) {
  return !!value;
}
function isUndefined4(value) {
  return typeof value === "undefined";
}
function negate(fn) {
  return (...args) => {
    return !fn(...args);
  };
}
function noop3() {
  return;
}
async function normalizeOptions(options, targets) {
  if (!isObject4(options)) exit_default("Invalid options object");
  const targetsGlobs = targets.filter(isString5);
  const targetsStatic = "--" in options && Array.isArray(options["--"]) ? options["--"].filter(isString5).map(dist_default23) : [];
  const globs = [...targetsGlobs, ...targetsStatic];
  const stdin = await getStdin();
  if (!isString5(stdin) && !globs.length) exit_default("Expected at least one target file/dir/glob");
  const check = "check" in options && !!options.check;
  const list = "listDifferent" in options && !!options.listDifferent;
  const write = "write" in options && !!options.write;
  const dump = !check && !list && !write;
  if (check && list) exit_default('The "--check" and "--list-different" flags cannot be used together');
  if (check && write) exit_default('The "--check" and "--write" flags cannot be used together');
  if (list && write) exit_default('The "--list-different" and "--write" flags cannot be used together');
  const config = "config" in options ? !!options.config : true;
  const configPath = "configPath" in options && isString5(options.configPath) ? [options.configPath] : void 0;
  const editorConfig = "editorconfig" in options ? !!options.editorconfig : true;
  const ignore = "ignore" in options ? !!options.ignore : true;
  const ignorePath = "ignorePath" in options && isArray3(options.ignorePath) && options.ignorePath.every(isString5) ? options.ignorePath : void 0;
  const withNodeModules = "withNodeModules" in options ? !!options.withNodeModules : false;
  const cache3 = "cache" in options ? !!options.cache : true;
  const cacheLocation = "cacheLocation" in options && isString5(options.cacheLocation) ? options.cacheLocation : void 0;
  const errorOnUnmatchedPattern = "errorOnUnmatchedPattern" in options ? !!options.errorOnUnmatchedPattern : true;
  const ignoreUnknown = "ignoreUnknown" in options && isBoolean2(options.ignoreUnknown) ? !!options.ignoreUnknown : globs.some(dist_default20);
  const logLevel = "logLevel" in options ? options.logLevel || "log" : "log";
  const parallel = "parallel" in options && !!options.parallel;
  const parallelWorkers = "parallelWorkers" in options && Math.round(Number(options.parallelWorkers)) || 0;
  const stdinFilepath = "stdinFilepath" in options && isString5(options.stdinFilepath) ? options.stdinFilepath : void 0;
  const contextOptions = normalizeContextOptions(options);
  const formatOptions = normalizeFormatOptions(options);
  return {
    globs,
    check,
    dump,
    list,
    write,
    config,
    configPath,
    editorConfig,
    ignore,
    ignorePath,
    withNodeModules,
    cache: cache3,
    cacheLocation,
    errorOnUnmatchedPattern,
    ignoreUnknown,
    logLevel,
    parallel,
    parallelWorkers,
    stdinFilepath,
    contextOptions,
    formatOptions
  };
}
function normalizeContextOptions(options) {
  if (!isObject4(options)) exit_default("Invalid options object");
  const contextOptions = {};
  if ("cursorOffset" in options) {
    const value = Number(options.cursorOffset);
    if (isInteger(value) && value >= 0) {
      contextOptions.cursorOffset = value;
    }
  }
  if ("rangeEnd" in options) {
    const value = Number(options.rangeEnd);
    if (isInteger(value) && value >= 0) {
      contextOptions.rangeEnd = value;
    }
  }
  if ("rangeStart" in options) {
    const value = Number(options.rangeStart);
    if (isInteger(value) && value >= 0) {
      contextOptions.rangeStart = value;
    }
  }
  return contextOptions;
}
function normalizeFormatOptions(options) {
  if (!isObject4(options)) exit_default("Invalid options object");
  const formatOptions = {};
  for (const [key2, value] of Object.entries(options)) {
    if (key2 === "plugin" || key2 === "plugins") continue;
    const validator = formatOptionsValidators[key2];
    if (validator) {
      const normalized = validator(value);
      if (!isUndefined4(normalized)) {
        formatOptions[key2] = normalized;
      }
    } else {
      formatOptions[key2] = value;
    }
  }
  if ("plugin" in options || "plugins" in options) {
    const value = options["plugin"] || options["plugins"];
    if (isArray3(value) && value.every(isString5)) {
      formatOptions.plugins = value;
    } else if (isString5(value)) {
      formatOptions.plugins = [value];
    } else if (!isUndefined4(value)) {
      exit_default("Non-string plugin specifiers are not supported yet");
    }
  }
  return formatOptions;
}
function normalizePluginOptions(options, names) {
  if (!isObject4(options)) exit_default("Invalid options object");
  const config = {};
  for (let i = 0, l = names.length; i < l; i++) {
    const name = names[i];
    const value = options[name];
    if (isUndefined4(value)) continue;
    config[name] = value;
  }
  return config;
}
function normalizePrettierOptions(options, folderPath) {
  if (!isObject4(options)) exit_default("Invalid options object");
  const config = normalizeFormatOptions(options);
  if ("overrides" in options && isArray3(options.overrides)) {
    const overridesRaw = options.overrides;
    for (let i = 0, l = overridesRaw.length; i < l; i++) {
      const overrideRaw = overridesRaw[i];
      if (!isObject4(overrideRaw)) continue;
      if (!("files" in overrideRaw)) continue;
      if (!isString5(overrideRaw.files) && (!isArray3(overrideRaw.files) || !overrideRaw.files.every(isString5))) continue;
      if (isArray3(overrideRaw.files) && !overrideRaw.files.length) continue;
      if (!("options" in overrideRaw)) continue;
      if (!isObject4(overrideRaw.options)) continue;
      const overrides = config.overrides || (config.overrides = []);
      const filesPositive = castArray5(overrideRaw.files);
      const filesNegative = "filesNegative" in overrideRaw && (isString5(overrideRaw.filesNegative) || isArray3(overrideRaw.filesNegative) && overrideRaw.filesNegative.every(isString5)) ? castArray5(overrideRaw.filesNegative) : [];
      const folder = folderPath;
      const options2 = normalizeFormatOptions(overrideRaw.options);
      overrides.push({
        filesPositive,
        filesNegative,
        folder,
        options: options2
      });
    }
  }
  return config;
}
function omit(object, keys) {
  const clone = {
    ...object
  };
  for (let i = 0, l = keys.length; i < l; i++) {
    delete clone[keys[i]];
  }
  return clone;
}
function pluralize(value, length) {
  return `${value}${length === 1 ? "" : "s"}`;
}
function resolve2(value) {
  return isFunction3(value) ? value() : value;
}
function sha1hex(value) {
  return crypto.createHash("sha1").update(value).digest("hex");
}
function sha1base64(value) {
  return crypto.createHash("sha1").update(value).digest("base64");
}
function someOf(fns) {
  return (arg) => {
    return fns.some((fn) => fn(arg));
  };
}
function trimFinalNewline(value) {
  return value.replace(/(\r?\n|\r)$/, "");
}
function uniq4(values) {
  if (values.length < 2) return values;
  return Array.from(new Set(values));
}
function uniqChunks(...chunks) {
  const chunksNonEmpty = chunks.filter((chunk) => chunk.length);
  if (chunksNonEmpty.length === 0) {
    return [];
  } else if (chunksNonEmpty.length === 1) {
    return chunksNonEmpty[0];
  } else {
    return uniq4(chunks.flat());
  }
}
function without2(values, exclude) {
  if (!values.length) return values;
  if (!exclude.length) return values;
  const excludeSet = new Set(exclude);
  return values.filter((value) => !excludeSet.has(value));
}
function zipObjectUnless(keys, values, unless) {
  const map = {};
  for (let i = 0, l = keys.length; i < l; i++) {
    const value = values[i];
    if (!unless(value)) {
      map[keys[i]] = value;
    }
  }
  return map;
}
var getPlugin, getStdin, formatOptionsValidators, normalizePathSeparatorsToPosix;
var init_utils15 = __esm({
  "node_modules/@prettier/cli/dist/utils.js"() {
    init_method_replace_all();
    init_dist3();
    init_dist12();
    init_import_meta_resolve();
    init_dist15();
    init_dist16();
    init_dist14();
    init_dist19();
    init_dist26();
    init_dist22();
    init_dist27();
    init_dist24();
    getPlugin = dist_default13((name) => {
      const pluginPath = getPluginPath(name);
      const plugin = getModule(pluginPath);
      return plugin;
    });
    getStdin = dist_default11(async () => {
      if (!process11.stdin.isTTY) {
        const stdin = stream2text(process11.stdin);
        const fallback = dist_default14(1e3, void 0);
        return Promise.race([stdin, fallback]);
      }
    });
    formatOptionsValidators = {
      experimentalOperatorPosition: (value) => value === "start" || value === "end" ? value : void 0,
      experimentalTernaries: (value) => isBoolean2(value) ? value : void 0,
      arrowParens: (value) => value === "avoid" || value === "always" ? value : void 0,
      bracketSameLine: (value) => isBoolean2(value) ? value : void 0,
      bracketSpacing: (value) => isBoolean2(value) ? value : void 0,
      embeddedLanguageFormatting: (value) => value === "auto" || value === "off" ? value : void 0,
      endOfLine: (value) => value === "lf" || value === "crlf" || value === "cr" || value === "auto" ? value : void 0,
      htmlWhitespaceSensitivity: (value) => value === "css" || value === "strict" || value === "ignore" ? value : void 0,
      insertPragma: (value) => isBoolean2(value) ? value : void 0,
      jsxSingleQuote: (value) => isBoolean2(value) ? value : void 0,
      objectWrap: (value) => value === "preserve" || value === "collapse" ? value : void 0,
      // New parsers that we don't know about can be added by plugins
      parser: (value) => isString5(value) ? value : void 0,
      printWidth: (value) => {
        const number = Number(value);
        return isInteger(number) && number >= 0 ? number : void 0;
      },
      proseWrap: (value) => value === "always" || value === "never" || value === "preserve" ? value : void 0,
      quoteProps: (value) => value === "as-needed" || value === "consistent" || value === "preserve" ? value : void 0,
      requirePragma: (value) => isBoolean2(value) ? value : void 0,
      semi: (value) => isBoolean2(value) ? value : void 0,
      singleAttributePerLine: (value) => isBoolean2(value) ? value : void 0,
      singleQuote: (value) => isBoolean2(value) ? value : void 0,
      tabWidth: (value) => {
        const number = Number(value);
        return isInteger(number) && number >= 0 ? number : void 0;
      },
      trailingComma: (value) => value === "all" || value === "es5" || value === "none" ? value : void 0,
      useTabs: (value) => isBoolean2(value) ? value : void 0,
      vueIndentScriptAndStyle: (value) => isBoolean2(value) ? value : void 0
    };
    normalizePathSeparatorsToPosix = (() => {
      if (path9.sep === "\\") {
        return (filePath) => {
          return method_replace_all_default(
            /* OPTIONAL_OBJECT: false */
            0,
            filePath,
            "\\",
            "/"
          );
        };
      } else {
        return identity3;
      }
    })();
  }
});

// node_modules/binary-extensions/binary-extensions.json
var binary_extensions_default;
var init_binary_extensions = __esm({
  "node_modules/binary-extensions/binary-extensions.json"() {
    binary_extensions_default = [
      "3dm",
      "3ds",
      "3g2",
      "3gp",
      "7z",
      "a",
      "aac",
      "adp",
      "afdesign",
      "afphoto",
      "afpub",
      "ai",
      "aif",
      "aiff",
      "alz",
      "ape",
      "apk",
      "appimage",
      "ar",
      "arj",
      "asf",
      "au",
      "avi",
      "bak",
      "baml",
      "bh",
      "bin",
      "bk",
      "bmp",
      "btif",
      "bz2",
      "bzip2",
      "cab",
      "caf",
      "cgm",
      "class",
      "cmx",
      "cpio",
      "cr2",
      "cr3",
      "cur",
      "dat",
      "dcm",
      "deb",
      "dex",
      "djvu",
      "dll",
      "dmg",
      "dng",
      "doc",
      "docm",
      "docx",
      "dot",
      "dotm",
      "dra",
      "DS_Store",
      "dsk",
      "dts",
      "dtshd",
      "dvb",
      "dwg",
      "dxf",
      "ecelp4800",
      "ecelp7470",
      "ecelp9600",
      "egg",
      "eol",
      "eot",
      "epub",
      "exe",
      "f4v",
      "fbs",
      "fh",
      "fla",
      "flac",
      "flatpak",
      "fli",
      "flv",
      "fpx",
      "fst",
      "fvt",
      "g3",
      "gh",
      "gif",
      "graffle",
      "gz",
      "gzip",
      "h261",
      "h263",
      "h264",
      "icns",
      "ico",
      "ief",
      "img",
      "ipa",
      "iso",
      "jar",
      "jpeg",
      "jpg",
      "jpgv",
      "jpm",
      "jxr",
      "key",
      "ktx",
      "lha",
      "lib",
      "lvp",
      "lz",
      "lzh",
      "lzma",
      "lzo",
      "m3u",
      "m4a",
      "m4v",
      "mar",
      "mdi",
      "mht",
      "mid",
      "midi",
      "mj2",
      "mka",
      "mkv",
      "mmr",
      "mng",
      "mobi",
      "mov",
      "movie",
      "mp3",
      "mp4",
      "mp4a",
      "mpeg",
      "mpg",
      "mpga",
      "mxu",
      "nef",
      "npx",
      "numbers",
      "nupkg",
      "o",
      "odp",
      "ods",
      "odt",
      "oga",
      "ogg",
      "ogv",
      "otf",
      "ott",
      "pages",
      "pbm",
      "pcx",
      "pdb",
      "pdf",
      "pea",
      "pgm",
      "pic",
      "png",
      "pnm",
      "pot",
      "potm",
      "potx",
      "ppa",
      "ppam",
      "ppm",
      "pps",
      "ppsm",
      "ppsx",
      "ppt",
      "pptm",
      "pptx",
      "psd",
      "pya",
      "pyc",
      "pyo",
      "pyv",
      "qt",
      "rar",
      "ras",
      "raw",
      "resources",
      "rgb",
      "rip",
      "rlc",
      "rmf",
      "rmvb",
      "rpm",
      "rtf",
      "rz",
      "s3m",
      "s7z",
      "scpt",
      "sgi",
      "shar",
      "snap",
      "sil",
      "sketch",
      "slk",
      "smv",
      "snk",
      "so",
      "stl",
      "suo",
      "sub",
      "swf",
      "tar",
      "tbz",
      "tbz2",
      "tga",
      "tgz",
      "thmx",
      "tif",
      "tiff",
      "tlz",
      "ttc",
      "ttf",
      "txz",
      "udf",
      "uvh",
      "uvi",
      "uvm",
      "uvp",
      "uvs",
      "uvu",
      "viv",
      "vob",
      "war",
      "wav",
      "wax",
      "wbmp",
      "wdp",
      "weba",
      "webm",
      "webp",
      "whl",
      "wim",
      "wm",
      "wma",
      "wmv",
      "wmx",
      "woff",
      "woff2",
      "wrm",
      "wvx",
      "xbm",
      "xif",
      "xla",
      "xlam",
      "xls",
      "xlsb",
      "xlsm",
      "xlsx",
      "xlt",
      "xltm",
      "xltx",
      "xm",
      "xmind",
      "xpi",
      "xpm",
      "xwd",
      "xz",
      "z",
      "zip",
      "zipx"
    ];
  }
});

// node_modules/binary-extensions/index.js
var binary_extensions_default2;
var init_binary_extensions2 = __esm({
  "node_modules/binary-extensions/index.js"() {
    init_binary_extensions();
    binary_extensions_default2 = binary_extensions_default;
  }
});

// node_modules/is-binary-path/index.js
import path10 from "path";
function isBinaryPath(filePath) {
  return extensions.has(path10.extname(filePath).slice(1).toLowerCase());
}
var extensions;
var init_is_binary_path = __esm({
  "node_modules/is-binary-path/index.js"() {
    init_binary_extensions2();
    extensions = new Set(binary_extensions_default2);
  }
});

// node_modules/json-sorted-stringify/dist/index.js
var stringify, dist_default24;
var init_dist28 = __esm({
  "node_modules/json-sorted-stringify/dist/index.js"() {
    stringify = (value) => {
      return JSON.stringify(value, (_, value2) => {
        if (typeof value2 === "object" && value2 !== null && !Array.isArray(value2)) {
          const keys = Object.keys(value2).sort();
          const clone = {};
          for (let i = 0, l = keys.length; i < l; i++) {
            const key2 = keys[i];
            clone[key2] = value2[key2];
          }
          return clone;
        }
        return value2;
      });
    };
    dist_default24 = stringify;
  }
});

// node_modules/@prettier/cli/dist/cache.js
import fs8 from "fs";
import os2 from "os";
import path11 from "path";
var Cache, cache_default;
var init_cache = __esm({
  "node_modules/@prettier/cli/dist/cache.js"() {
    init_utils15();
    Cache = class {
      constructor(version, rootPath, cacheRootPath, options, logger) {
        this.version = sha1hex(version);
        this.logger = logger;
        this.rootPath = rootPath;
        const cachePath = cacheRootPath ? getCachePath(cacheRootPath) : path11.join(os2.tmpdir(), "prettier", ".prettier-caches");
        this.storePath = options.cacheLocation || path11.join(cachePath, `${sha1hex(rootPath)}.json`);
        this.store = this.read();
        this.dirty = false;
      }
      cleanup(store2) {
        for (const version in store2) {
          if (version === this.version)
            continue;
          delete store2[version];
          this.dirty = true;
        }
        return store2;
      }
      read() {
        try {
          const store2 = JSON.parse(fs8.readFileSync(this.storePath, "utf8"));
          if (!isObject4(store2))
            return {};
          return this.cleanup(store2);
        } catch (error) {
          this.logger.prefixed.debug(String(error));
          return {};
        }
      }
      write() {
        if (!this.dirty)
          return;
        try {
          const store2 = JSON.stringify(this.store);
          fs8.mkdirSync(path11.dirname(this.storePath), { recursive: true });
          fs8.writeFileSync(this.storePath, store2);
        } catch (error) {
          this.logger.prefixed.debug(String(error));
        }
      }
      get(filePath) {
        const fileRelativePath = fastRelativePath(this.rootPath, filePath);
        const save = this.set.bind(this, filePath, fileRelativePath);
        try {
          const file = this.store[this.version]?.files?.[fileRelativePath];
          if (!file || !isArray3(file) || file.length !== 2)
            return { save };
          const [hash, formatted] = file;
          if (!isString5(hash) || !isBoolean2(formatted))
            return { save };
          const content = fs8.readFileSync(filePath);
          const fileHash = sha1base64(content);
          if (hash !== fileHash)
            return { content, save };
          return { formatted, content, save };
        } catch (error) {
          this.logger.prefixed.debug(String(error));
          return { save };
        }
      }
      set(filePath, fileRelativePath, fileFormatted, fileContentExpected) {
        var _a, _b;
        try {
          const version = (_a = this.store)[_b = this.version] || (_a[_b] = {});
          const files = version.files || (version.files = {});
          const hash = sha1base64(fileContentExpected);
          version.modified = Date.now();
          files[fileRelativePath] = [hash, fileFormatted];
          this.dirty = true;
        } catch (error) {
          this.logger.prefixed.debug(String(error));
        }
      }
      async has(filePath, isIgnored) {
        var _a, _b;
        const fileRelativePath = fastRelativePath(this.rootPath, filePath);
        const file = this.store[this.version]?.files?.[fileRelativePath];
        if (isUndefined4(file)) {
          const ignored = await isIgnored();
          if (ignored) {
            const version = (_a = this.store)[_b = this.version] || (_a[_b] = {});
            const files = version.files || (version.files = {});
            files[fileRelativePath] = false;
            this.dirty = true;
            return false;
          } else {
            return true;
          }
        } else {
          return !!file;
        }
      }
    };
    cache_default = Cache;
  }
});

// node_modules/ini-simple-parser/dist/utils.js
var inferBoolean, inferNull, inferNumber, inferString, isString6, stripComments;
var init_utils16 = __esm({
  "node_modules/ini-simple-parser/dist/utils.js"() {
    inferBoolean = (value) => {
      if (!isString6(value) || !value.length)
        return value;
      if (value === "true" || value === "TRUE")
        return true;
      if (value === "false" || value === "FALSE")
        return false;
      return value;
    };
    inferNull = (value) => {
      if (!isString6(value) || !value.length)
        return value;
      if (value === "null" || value === "NULL")
        return null;
      return value;
    };
    inferNumber = (value) => {
      if (!isString6(value) || !value.length)
        return value;
      const firstChar = value.charCodeAt(0);
      if (firstChar !== 43 && firstChar !== 45 && firstChar !== 46 && (firstChar < 48 || firstChar > 57))
        return value;
      const number = Number(value);
      if (!Number.isNaN(number))
        value = number;
      return value;
    };
    inferString = (value) => {
      if (!isString6(value) || !value.length)
        return value;
      const firstChar = value[0];
      const lastChar = value[value.length - 1];
      if (firstChar === "'" && lastChar === "'")
        return value.slice(1, -1);
      if (firstChar === '"' && lastChar === '"')
        return value.slice(1, -1);
      return value;
    };
    isString6 = (value) => {
      return typeof value === "string";
    };
    stripComments = (value) => {
      if (!isString6(value) || !value.length)
        return value;
      const comment1Index = value.indexOf("#");
      const comment2Index = value.indexOf(";");
      const commentIndex = comment1Index >= 0 ? comment2Index >= 0 ? Math.min(comment1Index, comment2Index) : comment1Index : comment2Index;
      if (commentIndex < 0)
        return value;
      value = value.slice(0, commentIndex).trimEnd();
      return value;
    };
  }
});

// node_modules/ini-simple-parser/dist/index.js
var parse2, dist_default25;
var init_dist29 = __esm({
  "node_modules/ini-simple-parser/dist/index.js"() {
    init_utils16();
    parse2 = (input, options = {}) => {
      const COMMENT1 = 35;
      const COMMENT2 = 59;
      const SECTION_START = 91;
      const SECTION_END = 93;
      const INFER_BOOLEANS = !!options.inferBooleans;
      const INFER_NULLS = !!options.inferNulls;
      const INFER_NUMBERS = !!options.inferNumbers;
      const INFER_STRINGS = !!options.inferStrings;
      const INLINE_COMMENTS = !!options.inlineComments;
      const results = {};
      const lines = input.split(/\r?\n|\r/g);
      let section = results;
      for (let i = 0, l = lines.length; i < l; i++) {
        const line2 = lines[i].trim();
        if (!line2.length)
          continue;
        const firstChar = line2.charCodeAt(0);
        if (firstChar === COMMENT1 || firstChar === COMMENT2)
          continue;
        const lastChar = line2.charCodeAt(line2.length - 1);
        if (firstChar === SECTION_START) {
          if (lastChar === SECTION_END) {
            const key2 = line2.slice(1, -1);
            section = results[key2] = {};
            continue;
          } else {
            throw new Error(`Unexpected unclosed section at line ${i + 1}`);
          }
        }
        const delimiterIndex = line2.indexOf("=");
        if (delimiterIndex >= 0) {
          let key2 = line2.slice(0, delimiterIndex).trim();
          let value = line2.slice(delimiterIndex + 1).trim();
          if (INLINE_COMMENTS) {
            value = stripComments(value);
          }
          if (INFER_BOOLEANS) {
            value = inferBoolean(value);
          }
          if (INFER_NULLS) {
            value = inferNull(value);
          }
          if (INFER_NUMBERS) {
            value = inferNumber(value);
          }
          if (INFER_STRINGS) {
            key2 = inferString(key2);
            value = inferString(value);
          }
          section[`${key2}`] = value;
          continue;
        }
        throw new Error(`Unexpected characters at line ${i + 1}`);
      }
      return results;
    };
    dist_default25 = parse2;
  }
});

// node_modules/tiny-editorconfig/dist/utils.js
var isBoolean3, isInteger2, isObject5, isObjectEmpty, isString7, isUndefined5;
var init_utils17 = __esm({
  "node_modules/tiny-editorconfig/dist/utils.js"() {
    isBoolean3 = (value) => {
      return typeof value === "boolean";
    };
    isInteger2 = (value) => {
      return Number.isInteger(value);
    };
    isObject5 = (value) => {
      if (value === null)
        return false;
      const type = typeof value;
      return type === "object" || type === "function";
    };
    isObjectEmpty = (value) => {
      for (const _ in value)
        return false;
      return true;
    };
    isString7 = (value) => {
      return typeof value === "string";
    };
    isUndefined5 = (value) => {
      return typeof value === "undefined";
    };
  }
});

// node_modules/tiny-editorconfig/dist/cast.js
var CHARSETS, END_OF_LINES, INDENT_STYLES, isCharset, isEndOfLine, isIndentStyle, cast, cast_default;
var init_cast = __esm({
  "node_modules/tiny-editorconfig/dist/cast.js"() {
    init_utils17();
    CHARSETS = /* @__PURE__ */ new Set(["latin1", "utf-8", "utf-8-bom", "utf-16be", "utf-16le"]);
    END_OF_LINES = /* @__PURE__ */ new Set(["cr", "lf", "crlf"]);
    INDENT_STYLES = /* @__PURE__ */ new Set(["space", "tab"]);
    isCharset = (value) => {
      return CHARSETS.has(value);
    };
    isEndOfLine = (value) => {
      return END_OF_LINES.has(value);
    };
    isIndentStyle = (value) => {
      return INDENT_STYLES.has(value);
    };
    cast = (results, config = {}, includeOverrides = true) => {
      var _a;
      for (const prop in results) {
        let value = results[prop];
        if (isString7(value)) {
          value = value.toLowerCase();
          if (prop === "charset") {
            if (!isCharset(value))
              continue;
            config.charset = value;
          } else if (prop === "end_of_line") {
            if (!isEndOfLine(value))
              continue;
            config.endOfLine = value;
          } else if (prop === "indent_style") {
            if (!isIndentStyle(value))
              continue;
            config.indentStyle = value;
          }
        } else if (isBoolean3(value)) {
          if (prop === "insert_final_newline") {
            config.insertFinalNewline = value;
          } else if (prop === "root") {
            config.root = value;
          } else if (prop === "trim_trailing_whitespace") {
            config.trimTrailingWhitespace = value;
          }
        } else if (isInteger2(value)) {
          if (value >= 0) {
            if (prop === "indent_size") {
              config.indentSize = value;
            } else if (prop === "tab_width") {
              config.tabWidth = value;
            }
          }
        } else if (isObject5(value)) {
          if (includeOverrides) {
            config.overrides || (config.overrides = {});
            const override = (_a = config.overrides)[prop] || (_a[prop] = {});
            cast(value, override, false);
            if (isObjectEmpty(override)) {
              delete config.overrides[prop];
              if (isObjectEmpty(config.overrides)) {
                delete config.overrides;
              }
            }
          }
        }
      }
      return config;
    };
    cast_default = cast;
  }
});

// node_modules/tiny-editorconfig/dist/parse.js
var parse3, parse_default2;
var init_parse2 = __esm({
  "node_modules/tiny-editorconfig/dist/parse.js"() {
    init_dist29();
    init_cast();
    parse3 = (input) => {
      return cast_default(dist_default25(input, {
        inferBooleans: true,
        inferNumbers: true,
        inferStrings: true,
        inlineComments: true
      }));
    };
    parse_default2 = parse3;
  }
});

// node_modules/tiny-editorconfig/dist/extend.js
var extend, extend_default;
var init_extend = __esm({
  "node_modules/tiny-editorconfig/dist/extend.js"() {
    init_utils17();
    extend = (target, source2) => {
      for (const prop in source2) {
        if (prop === "overrides")
          continue;
        const value = source2[prop];
        if (isUndefined5(value))
          continue;
        target[prop] = value;
      }
      return target;
    };
    extend_default = extend;
  }
});

// node_modules/tiny-editorconfig/dist/resolve.js
var GLOBS_MATCH_ALL, resolve3, resolve_default;
var init_resolve2 = __esm({
  "node_modules/tiny-editorconfig/dist/resolve.js"() {
    init_dist22();
    init_extend();
    GLOBS_MATCH_ALL = /* @__PURE__ */ new Set(["*", "**", "**/*"]);
    resolve3 = (configs, filePath) => {
      const resolved = {};
      for (let i = 0, l = configs.length; i < l; i++) {
        const config = configs[i];
        extend_default(resolved, config);
        const overrides = config.overrides;
        for (const override in overrides) {
          const config2 = overrides[override];
          if (!config2)
            continue;
          const glob = `**/${override}`;
          if (!GLOBS_MATCH_ALL.has(override) && !dist_default19(glob, filePath))
            continue;
          extend_default(resolved, config2);
        }
      }
      return resolved;
    };
    resolve_default = resolve3;
  }
});

// node_modules/tiny-editorconfig/dist/index.js
var init_dist30 = __esm({
  "node_modules/tiny-editorconfig/dist/index.js"() {
    init_parse2();
    init_resolve2();
  }
});

// node_modules/@prettier/cli/dist/known.js
var Known, known_default;
var init_known = __esm({
  "node_modules/@prettier/cli/dist/known.js"() {
    Known = class {
      constructor() {
        this.filesPaths = /* @__PURE__ */ new Set();
        this.filesNames = /* @__PURE__ */ new Set();
        this.addFilesPaths = (filesPaths) => {
          if (!this.filesPaths.size) {
            this.filesPaths = new Set(filesPaths);
          } else {
            for (const filePath of filesPaths) {
              this.filesPaths.add(filePath);
            }
          }
        };
        this.addFilesNames = (filesNames) => {
          if (!this.filesNames.size) {
            this.filesNames = new Set(filesNames);
          } else {
            for (const fileName of filesNames) {
              this.filesNames.add(fileName);
            }
          }
        };
        this.hasFilePath = (filePath) => {
          return this.filesPaths.has(filePath);
        };
        this.hasFileName = (fileName) => {
          return this.filesNames.has(fileName);
        };
        this.reset = () => {
          this.filesPaths = /* @__PURE__ */ new Set();
          this.filesNames = /* @__PURE__ */ new Set();
        };
      }
    };
    known_default = new Known();
  }
});

// node_modules/@prettier/cli/dist/config_editorconfig.js
import fs9 from "fs/promises";
import path12 from "path";
var getEditorConfig, getEditorConfigsMap, getEditorConfigsUp, getEditorConfigResolved, getEditorConfigFormatOptions;
var init_config_editorconfig = __esm({
  "node_modules/@prettier/cli/dist/config_editorconfig.js"() {
    init_dist30();
    init_known();
    init_utils15();
    getEditorConfig = dist_default13((folderPath, filesNames) => {
      for (let i = 0, l = filesNames.length; i < l; i++) {
        const fileName = filesNames[i];
        const filePath = fastJoinedPath(folderPath, fileName);
        if (!known_default.hasFilePath(filePath))
          continue;
        return fs9.readFile(filePath, "utf8").then(parse_default2).catch(noop3);
      }
    });
    getEditorConfigsMap = async (foldersPaths, filesNames) => {
      const configs = await Promise.all(foldersPaths.map((folderPath) => getEditorConfig(folderPath, filesNames)));
      const map = zipObjectUnless(foldersPaths, configs, isUndefined4);
      return map;
    };
    getEditorConfigsUp = dist_default13(async (folderPath, filesNames) => {
      const config = await getEditorConfig(folderPath, filesNames);
      const folderPathUp = path12.dirname(folderPath);
      const configsUp = folderPath !== folderPathUp ? await getEditorConfigsUp(folderPathUp, filesNames) : [];
      const configs = config ? [...configsUp, config] : configsUp;
      const lastRootIndex = findLastIndex(configs, (config2) => config2.root);
      return lastRootIndex > 0 ? configs.slice(lastRootIndex) : configs;
    });
    getEditorConfigResolved = async (filePath, filesNames) => {
      const folderPath = path12.dirname(filePath);
      const configs = await getEditorConfigsUp(folderPath, filesNames);
      const config = resolve_default(configs, filePath);
      return config;
    };
    getEditorConfigFormatOptions = (config) => {
      const formatOptions = {};
      if ("endOfLine" in config) {
        formatOptions.endOfLine = config.endOfLine;
      }
      if ("indentSize" in config || "tabWidth" in config) {
        formatOptions.tabWidth = config.indentSize ?? config.tabWidth;
      }
      if ("indentStyle" in config) {
        formatOptions.useTabs = config.indentStyle === "tab";
      }
      return formatOptions;
    };
  }
});

// node_modules/string-escape-regex/dist/index.js
var unescapedRe, escape2, dist_default26;
var init_dist31 = __esm({
  "node_modules/string-escape-regex/dist/index.js"() {
    unescapedRe = /[\\^$.*+?()[\]{}|]/g;
    escape2 = (str) => {
      return str.replace(unescapedRe, (char) => `\\${char}`);
    };
    dist_default26 = escape2;
  }
});

// node_modules/fast-ignore/dist/glob/grammar.js
var escape3, passthrough, Escaped3, Escape2, Passthrough3, Star2, Question2, ClassOpen2, ClassClose2, ClassNegation2, ClassRange2, ClassEscape2, ClassPassthrough2, ClassValue2, Class2, Grammar3, grammar_default3;
var init_grammar3 = __esm({
  "node_modules/fast-ignore/dist/glob/grammar.js"() {
    init_dist21();
    escape3 = (char) => `\\${char}`;
    passthrough = (match2) => match2;
    Escaped3 = match(/\\./, passthrough);
    Escape2 = match(/[$.*+?^(){}[\]\|]/, escape3);
    Passthrough3 = match(/./, passthrough);
    Star2 = match(/\*+/, ".*");
    Question2 = match("?", "[^/]");
    ClassOpen2 = match("[", passthrough);
    ClassClose2 = match("]", passthrough);
    ClassNegation2 = match(/[!^]/, "^");
    ClassRange2 = match(/[0-9a-z]-[0-9a-z]/i, passthrough);
    ClassEscape2 = match(/[$.*+?^(){}[\|]/, escape3);
    ClassPassthrough2 = match(/[^\]]/, passthrough);
    ClassValue2 = or([Escaped3, ClassEscape2, ClassRange2, ClassPassthrough2]);
    Class2 = and([ClassOpen2, optional(ClassNegation2), star(ClassValue2), ClassClose2]);
    Grammar3 = star(or([Star2, Question2, Class2, Escaped3, Escape2, Passthrough3]));
    grammar_default3 = Grammar3;
  }
});

// node_modules/fast-ignore/dist/glob/parse.js
var _parse2, parse_default3;
var init_parse3 = __esm({
  "node_modules/fast-ignore/dist/glob/parse.js"() {
    init_dist21();
    init_grammar3();
    _parse2 = (glob, caseSensitive) => {
      const source2 = parse(glob, grammar_default3, { memoization: false }).join("");
      const flags = caseSensitive ? "" : "i";
      const re = new RegExp(`^${source2}$`, flags);
      return re;
    };
    parse_default3 = _parse2;
  }
});

// node_modules/fast-ignore/dist/glob/matcher.js
var STAR_RE, STATIC_RE, FLEXIBLE_START_RE, FLEXIBLE_END_RE, matcher, matcher_default;
var init_matcher = __esm({
  "node_modules/fast-ignore/dist/glob/matcher.js"() {
    init_dist31();
    init_parse3();
    STAR_RE = /^\*+$/;
    STATIC_RE = /^[ a-zA-Z0-9/._-]*$/;
    FLEXIBLE_START_RE = /^\*+([ a-zA-Z0-9/._-]*)$/;
    FLEXIBLE_END_RE = /^([ a-zA-Z0-9/._-]*)\*+$/;
    matcher = (glob, caseSensitive) => {
      if (STAR_RE.test(glob)) {
        return () => true;
      }
      if (STATIC_RE.test(glob)) {
        if (caseSensitive) {
          return (segment) => segment === glob;
        } else {
          const re2 = new RegExp(`^${dist_default26(glob)}$`, "i");
          const globLength = glob.length;
          return (segment) => segment.length === globLength && re2.test(segment);
        }
      }
      const end = FLEXIBLE_START_RE.exec(glob)?.[1];
      if (end) {
        if (caseSensitive) {
          return (segment) => segment.endsWith(end);
        } else {
          const re2 = new RegExp(`${dist_default26(end)}$`, "i");
          const endLength = end.length;
          return (segment) => segment.length >= endLength && re2.test(segment);
        }
      }
      const start = FLEXIBLE_END_RE.exec(glob)?.[1];
      if (start) {
        if (caseSensitive) {
          return (segment) => segment.startsWith(start);
        } else {
          const re2 = new RegExp(`^${dist_default26(start)}`, "i");
          const startLength = start.length;
          return (segment) => segment.length >= startLength && re2.test(segment);
        }
      }
      const re = parse_default3(glob, caseSensitive);
      return (segment) => re.test(segment);
    };
    matcher_default = matcher;
  }
});

// node_modules/fast-ignore/dist/ignore/compile.js
var compile2, compile_default2;
var init_compile2 = __esm({
  "node_modules/fast-ignore/dist/ignore/compile.js"() {
    init_matcher();
    compile2 = (tiers, options) => {
      const caseSensitive = options.caseSensitive ?? false;
      const root2 = { id: "", directory: false, globstar: false, negative: false, strength: -1, tier: -1, match: () => false, children: [] };
      let strengthCounter = 0;
      for (let ti = 0, tl = tiers.length; ti < tl; ti++) {
        const globs = tiers[ti];
        const tier = ti;
        for (let gi = 0, gl = globs.length; gi < gl; gi++) {
          let parent = root2;
          const glob = globs[gi];
          const content = glob.content;
          const segments = content.split("/");
          for (let si = 0, sl = segments.length; si < sl; si++) {
            const id = segments[si];
            const terminal = si === sl - 1;
            const directory = terminal ? glob.directory : false;
            const globstar = id === "**";
            const negative = glob.negative;
            const strength = terminal ? strengthCounter++ : -1;
            const match2 = matcher_default(id, caseSensitive);
            const children = [];
            const node = { id, directory, globstar, negative, strength, tier, match: match2, children };
            const nodeExisting = parent.children.find((node2) => node2.id === id);
            if (nodeExisting) {
              if (tier === nodeExisting.tier && strength >= nodeExisting.strength || tier > nodeExisting.tier && (nodeExisting.strength < 0 || nodeExisting.negative)) {
                nodeExisting.directory && (nodeExisting.directory = directory);
                nodeExisting.negative = negative;
                nodeExisting.strength = strength;
                nodeExisting.tier = tier;
              }
              parent = nodeExisting;
            } else {
              parent.children.push(node);
              parent = node;
            }
          }
        }
      }
      return root2;
    };
    compile_default2 = compile2;
  }
});

// node_modules/fast-ignore/dist/glob/normalize.js
var normalize2, normalize_default2;
var init_normalize2 = __esm({
  "node_modules/fast-ignore/dist/glob/normalize.js"() {
    init_method_replace_all();
    normalize2 = (glob) => {
      glob = glob.replace(/((?:\\\s)*)\s*$/, ($0, $1) => method_replace_all_default(
        /* OPTIONAL_OBJECT: false */
        0,
        $1,
        "\\",
        ""
      ));
      glob = glob.replace(/\\([^*?\[\]])/g, "$1");
      glob = glob.replace(/(^|\/)\*\*\/(?:\*\*(\/|$))+/g, "$1**$2");
      glob = glob.startsWith("/") ? glob.slice(1) : glob.startsWith("**/") || glob.slice(0, -1).includes("/") ? glob : `**/${glob}`;
      return glob;
    };
    normalize_default2 = normalize2;
  }
});

// node_modules/fast-ignore/dist/ignore/parse.js
var parse4, parse_default4;
var init_parse4 = __esm({
  "node_modules/fast-ignore/dist/ignore/parse.js"() {
    init_normalize2();
    parse4 = (ignore) => {
      const lines = ignore.split(/\r?\n|\r/g);
      const globs = [];
      for (let i = 0, l = lines.length; i < l; i++) {
        let content = lines[i];
        if (!content.trim())
          continue;
        if (content.startsWith("#"))
          continue;
        const negative = content.startsWith("!");
        const directory = content.endsWith("/");
        content = negative ? content.slice(1) : content;
        content = directory ? content.slice(0, -1) : content;
        content = normalize_default2(content);
        const glob = { content, directory, negative };
        globs.push(glob);
      }
      return globs;
    };
    parse_default4 = parse4;
  }
});

// node_modules/fast-ignore/dist/ignore/tick.js
var tickNode, tick, tick_default;
var init_tick = __esm({
  "node_modules/fast-ignore/dist/ignore/tick.js"() {
    tickNode = (result, node, segment, isSegmentDirectory) => {
      const { children } = node;
      for (let i = 0, l = children.length; i < l; i++) {
        const child = children[i];
        if (!child.match(segment))
          continue;
        if (child.strength >= result.strength && (!child.directory || isSegmentDirectory)) {
          result.negative = child.negative;
          result.strength = child.strength;
        }
        if (child.children.length) {
          if (child.globstar) {
            tickNode(result, child, segment, isSegmentDirectory);
          } else {
            result.nodes.push(child);
          }
        }
      }
      if (node.globstar) {
        if (node.strength >= result.strength && (!node.directory || isSegmentDirectory)) {
          result.negative = node.negative;
          result.strength = node.strength;
        }
        result.nodes.push(node);
      }
    };
    tick = (nodes, segment, isSegmentDirectory) => {
      const result = { nodes: [], negative: false, strength: -1 };
      for (let i = 0, l = nodes.length; i < l; i++) {
        tickNode(result, nodes[i], segment, isSegmentDirectory);
      }
      return result;
    };
    tick_default = tick;
  }
});

// node_modules/fast-ignore/dist/ignore/matcher.js
var matcher2, matcher_default2;
var init_matcher2 = __esm({
  "node_modules/fast-ignore/dist/ignore/matcher.js"() {
    init_compile2();
    init_parse4();
    init_tick();
    matcher2 = (ignore, options = {}) => {
      const ignores = Array.isArray(ignore) ? ignore : [ignore];
      const tiers = ignores.map(parse_default4).filter((tier) => !!tier.length);
      if (!tiers.length)
        return () => false;
      const root2 = compile_default2(tiers, options);
      const cache3 = [];
      return (relativePath, options2) => {
        const isDirectory = options2?.isDirectory ?? false;
        const sep = relativePath.includes("/") ? "/" : "\\";
        const length = relativePath.length;
        let nodes = [root2];
        let cacheable = true;
        let segmentIndex = 0;
        let segmentIndexNext = 0;
        let segmentNth = -1;
        let segment = "";
        let isSegmentDirectory = false;
        while (segmentIndex < length) {
          segmentIndexNext = relativePath.indexOf(sep, segmentIndex);
          segmentIndexNext = segmentIndexNext === -1 ? length : segmentIndexNext;
          segment = relativePath.slice(segmentIndex, segmentIndexNext);
          segmentIndex = segmentIndexNext + 1;
          isSegmentDirectory = segmentIndex < length || isDirectory;
          if (!segment.length)
            continue;
          segmentNth += 1;
          const cached = segmentNth < cache3.length - 1 ? cache3[segmentNth] : void 0;
          const cachedResult = cacheable && cached && cached.segment === segment && cached.isSegmentDirectory === isSegmentDirectory ? cached.result : void 0;
          const result = cachedResult || tick_default(nodes, segment, isSegmentDirectory);
          cacheable = !!cachedResult;
          if (!cachedResult) {
            if (cached) {
              cached.result = result;
              cached.segment = segment;
              cached.isSegmentDirectory = isSegmentDirectory;
            } else {
              cache3[segmentNth] = { result, segment, isSegmentDirectory };
            }
          }
          if (result.strength >= 0 && !result.negative)
            return true;
          nodes = result.nodes;
          if (!nodes.length)
            return false;
        }
        return false;
      };
    };
    matcher_default2 = matcher2;
  }
});

// node_modules/fast-ignore/dist/index.js
var dist_default27;
var init_dist32 = __esm({
  "node_modules/fast-ignore/dist/index.js"() {
    init_matcher2();
    dist_default27 = matcher_default2;
  }
});

// node_modules/@prettier/cli/dist/config_ignore.js
import fs10 from "fs/promises";
import path13 from "path";
var getIgnoreContent, getIgnoresContent, getIgnoresContentMap, getIgnoreBy, getIgnoreBys, getIgnores, getIgnoresUp, getIgnoreResolved;
var init_config_ignore = __esm({
  "node_modules/@prettier/cli/dist/config_ignore.js"() {
    init_dist32();
    init_known();
    init_utils15();
    getIgnoreContent = (folderPath, fileName) => {
      const filePath = fastJoinedPath(folderPath, fileName);
      if (!known_default.hasFilePath(filePath))
        return;
      return fs10.readFile(filePath, "utf8").catch(noop3);
    };
    getIgnoresContent = dist_default13(async (folderPath, filesNames) => {
      const contentsRaw = await Promise.all(filesNames.map((fileName) => getIgnoreContent(folderPath, fileName)));
      const contents = contentsRaw.filter(isString5);
      if (!contents.length)
        return;
      return contents;
    });
    getIgnoresContentMap = async (foldersPaths, filesNames) => {
      const contents = await Promise.all(foldersPaths.map((folderPath) => getIgnoresContent(folderPath, filesNames)));
      const map = zipObjectUnless(foldersPaths, contents, isUndefined4);
      return map;
    };
    getIgnoreBy = (folderPath, filesContents) => {
      const ignore = dist_default27(filesContents);
      return (filePath) => {
        const fileRelativePath = fastRelativePath(folderPath, filePath);
        return !!fileRelativePath && ignore(fileRelativePath);
      };
    };
    getIgnoreBys = (foldersPaths, filesContents) => {
      if (!foldersPaths.length)
        return;
      const ignores = foldersPaths.map((folderPath, index) => getIgnoreBy(folderPath, filesContents[index]));
      const ignore = someOf(ignores);
      return ignore;
    };
    getIgnores = dist_default13(async (folderPath, filesNames) => {
      const contents = await getIgnoresContent(folderPath, filesNames);
      if (!contents?.length)
        return;
      const ignore = getIgnoreBy(folderPath, contents);
      return ignore;
    });
    getIgnoresUp = dist_default13(async (folderPath, filesNames) => {
      const ignore = await getIgnores(folderPath, filesNames);
      const folderPathUp = path13.dirname(folderPath);
      const ignoreUp = folderPath !== folderPathUp ? await getIgnoresUp(folderPathUp, filesNames) : void 0;
      const ignores = ignore ? ignoreUp ? [ignore, ignoreUp] : [ignore] : ignoreUp ? [ignoreUp] : [];
      if (!ignores.length)
        return;
      const ignoreAll = someOf(ignores);
      return ignoreAll;
    });
    getIgnoreResolved = async (filePath, filesNames) => {
      const folderPath = path13.dirname(filePath);
      const ignore = await getIgnoresUp(folderPath, filesNames);
      const ignored = !!ignore?.(filePath);
      return ignored;
    };
  }
});

// node_modules/json5/dist/index.mjs
var dist_exports2 = {};
__export(dist_exports2, {
  default: () => dist_default28
});
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
function read2() {
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
      throw invalidChar(read2());
    }
    read2();
  }
}
function escape4() {
  const c2 = peek();
  switch (c2) {
    case "b":
      read2();
      return "\b";
    case "f":
      read2();
      return "\f";
    case "n":
      read2();
      return "\n";
    case "r":
      read2();
      return "\r";
    case "t":
      read2();
      return "	";
    case "v":
      read2();
      return "\v";
    case "0":
      read2();
      if (util.isDigit(peek())) {
        throw invalidChar(read2());
      }
      return "\0";
    case "x":
      read2();
      return hexEscape();
    case "u":
      read2();
      return unicodeEscape();
    case "\n":
    case "\u2028":
    case "\u2029":
      read2();
      return "";
    case "\r":
      read2();
      if (peek() === "\n") {
        read2();
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
      throw invalidChar(read2());
    case void 0:
      throw invalidChar(read2());
  }
  return read2();
}
function hexEscape() {
  let buffer2 = "";
  let c2 = peek();
  if (!util.isHexDigit(c2)) {
    throw invalidChar(read2());
  }
  buffer2 += read2();
  c2 = peek();
  if (!util.isHexDigit(c2)) {
    throw invalidChar(read2());
  }
  buffer2 += read2();
  return String.fromCodePoint(parseInt(buffer2, 16));
}
function unicodeEscape() {
  let buffer2 = "";
  let count = 4;
  while (count-- > 0) {
    const c2 = peek();
    if (!util.isHexDigit(c2)) {
      throw invalidChar(read2());
    }
    buffer2 += read2();
  }
  return String.fromCodePoint(parseInt(buffer2, 16));
}
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
var Space_Separator, ID_Start, ID_Continue, unicode, util, source, parseState, stack, pos, line, column, token, key, root, parse5, lexState, buffer, doubleQuote, sign, c, lexStates, parseStates, dist_default28;
var init_dist33 = __esm({
  "node_modules/json5/dist/index.mjs"() {
    Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/;
    ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;
    ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;
    unicode = {
      Space_Separator,
      ID_Start,
      ID_Continue
    };
    util = {
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
    parse5 = function parse6(text, reviver) {
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
    lexStates = {
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
            read2();
            return;
          case "/":
            read2();
            lexState = "comment";
            return;
          case void 0:
            read2();
            return newToken("eof");
        }
        if (util.isSpaceSeparator(c)) {
          read2();
          return;
        }
        return lexStates[parseState]();
      },
      comment() {
        switch (c) {
          case "*":
            read2();
            lexState = "multiLineComment";
            return;
          case "/":
            read2();
            lexState = "singleLineComment";
            return;
        }
        throw invalidChar(read2());
      },
      multiLineComment() {
        switch (c) {
          case "*":
            read2();
            lexState = "multiLineCommentAsterisk";
            return;
          case void 0:
            throw invalidChar(read2());
        }
        read2();
      },
      multiLineCommentAsterisk() {
        switch (c) {
          case "*":
            read2();
            return;
          case "/":
            read2();
            lexState = "default";
            return;
          case void 0:
            throw invalidChar(read2());
        }
        read2();
        lexState = "multiLineComment";
      },
      singleLineComment() {
        switch (c) {
          case "\n":
          case "\r":
          case "\u2028":
          case "\u2029":
            read2();
            lexState = "default";
            return;
          case void 0:
            read2();
            return newToken("eof");
        }
        read2();
      },
      value() {
        switch (c) {
          case "{":
          case "[":
            return newToken("punctuator", read2());
          case "n":
            read2();
            literal("ull");
            return newToken("null", null);
          case "t":
            read2();
            literal("rue");
            return newToken("boolean", true);
          case "f":
            read2();
            literal("alse");
            return newToken("boolean", false);
          case "-":
          case "+":
            if (read2() === "-") {
              sign = -1;
            }
            lexState = "sign";
            return;
          case ".":
            buffer = read2();
            lexState = "decimalPointLeading";
            return;
          case "0":
            buffer = read2();
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
            buffer = read2();
            lexState = "decimalInteger";
            return;
          case "I":
            read2();
            literal("nfinity");
            return newToken("numeric", Infinity);
          case "N":
            read2();
            literal("aN");
            return newToken("numeric", NaN);
          case '"':
          case "'":
            doubleQuote = read2() === '"';
            buffer = "";
            lexState = "string";
            return;
        }
        throw invalidChar(read2());
      },
      identifierNameStartEscape() {
        if (c !== "u") {
          throw invalidChar(read2());
        }
        read2();
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
            buffer += read2();
            return;
          case "\\":
            read2();
            lexState = "identifierNameEscape";
            return;
        }
        if (util.isIdContinueChar(c)) {
          buffer += read2();
          return;
        }
        return newToken("identifier", buffer);
      },
      identifierNameEscape() {
        if (c !== "u") {
          throw invalidChar(read2());
        }
        read2();
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
            buffer = read2();
            lexState = "decimalPointLeading";
            return;
          case "0":
            buffer = read2();
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
            buffer = read2();
            lexState = "decimalInteger";
            return;
          case "I":
            read2();
            literal("nfinity");
            return newToken("numeric", sign * Infinity);
          case "N":
            read2();
            literal("aN");
            return newToken("numeric", NaN);
        }
        throw invalidChar(read2());
      },
      zero() {
        switch (c) {
          case ".":
            buffer += read2();
            lexState = "decimalPoint";
            return;
          case "e":
          case "E":
            buffer += read2();
            lexState = "decimalExponent";
            return;
          case "x":
          case "X":
            buffer += read2();
            lexState = "hexadecimal";
            return;
        }
        return newToken("numeric", sign * 0);
      },
      decimalInteger() {
        switch (c) {
          case ".":
            buffer += read2();
            lexState = "decimalPoint";
            return;
          case "e":
          case "E":
            buffer += read2();
            lexState = "decimalExponent";
            return;
        }
        if (util.isDigit(c)) {
          buffer += read2();
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      decimalPointLeading() {
        if (util.isDigit(c)) {
          buffer += read2();
          lexState = "decimalFraction";
          return;
        }
        throw invalidChar(read2());
      },
      decimalPoint() {
        switch (c) {
          case "e":
          case "E":
            buffer += read2();
            lexState = "decimalExponent";
            return;
        }
        if (util.isDigit(c)) {
          buffer += read2();
          lexState = "decimalFraction";
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      decimalFraction() {
        switch (c) {
          case "e":
          case "E":
            buffer += read2();
            lexState = "decimalExponent";
            return;
        }
        if (util.isDigit(c)) {
          buffer += read2();
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      decimalExponent() {
        switch (c) {
          case "+":
          case "-":
            buffer += read2();
            lexState = "decimalExponentSign";
            return;
        }
        if (util.isDigit(c)) {
          buffer += read2();
          lexState = "decimalExponentInteger";
          return;
        }
        throw invalidChar(read2());
      },
      decimalExponentSign() {
        if (util.isDigit(c)) {
          buffer += read2();
          lexState = "decimalExponentInteger";
          return;
        }
        throw invalidChar(read2());
      },
      decimalExponentInteger() {
        if (util.isDigit(c)) {
          buffer += read2();
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      hexadecimal() {
        if (util.isHexDigit(c)) {
          buffer += read2();
          lexState = "hexadecimalInteger";
          return;
        }
        throw invalidChar(read2());
      },
      hexadecimalInteger() {
        if (util.isHexDigit(c)) {
          buffer += read2();
          return;
        }
        return newToken("numeric", sign * Number(buffer));
      },
      string() {
        switch (c) {
          case "\\":
            read2();
            buffer += escape4();
            return;
          case '"':
            if (doubleQuote) {
              read2();
              return newToken("string", buffer);
            }
            buffer += read2();
            return;
          case "'":
            if (!doubleQuote) {
              read2();
              return newToken("string", buffer);
            }
            buffer += read2();
            return;
          case "\n":
          case "\r":
            throw invalidChar(read2());
          case "\u2028":
          case "\u2029":
            separatorChar(c);
            break;
          case void 0:
            throw invalidChar(read2());
        }
        buffer += read2();
      },
      start() {
        switch (c) {
          case "{":
          case "[":
            return newToken("punctuator", read2());
        }
        lexState = "value";
      },
      beforePropertyName() {
        switch (c) {
          case "$":
          case "_":
            buffer = read2();
            lexState = "identifierName";
            return;
          case "\\":
            read2();
            lexState = "identifierNameStartEscape";
            return;
          case "}":
            return newToken("punctuator", read2());
          case '"':
          case "'":
            doubleQuote = read2() === '"';
            lexState = "string";
            return;
        }
        if (util.isIdStartChar(c)) {
          buffer += read2();
          lexState = "identifierName";
          return;
        }
        throw invalidChar(read2());
      },
      afterPropertyName() {
        if (c === ":") {
          return newToken("punctuator", read2());
        }
        throw invalidChar(read2());
      },
      beforePropertyValue() {
        lexState = "value";
      },
      afterPropertyValue() {
        switch (c) {
          case ",":
          case "}":
            return newToken("punctuator", read2());
        }
        throw invalidChar(read2());
      },
      beforeArrayValue() {
        if (c === "]") {
          return newToken("punctuator", read2());
        }
        lexState = "value";
      },
      afterArrayValue() {
        switch (c) {
          case ",":
          case "]":
            return newToken("punctuator", read2());
        }
        throw invalidChar(read2());
      },
      end() {
        throw invalidChar(read2());
      }
    };
    parseStates = {
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
    dist_default28 = { parse: parse5 };
  }
});

// node_modules/smol-toml/dist/date.js
var DATE_TIME_RE, TomlDate;
var init_date = __esm({
  "node_modules/smol-toml/dist/date.js"() {
    DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;
    TomlDate = class _TomlDate extends Date {
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
  }
});

// node_modules/smol-toml/dist/error.js
function getLineColFromPtr(string2, ptr) {
  let lines = string2.slice(0, ptr).split(/\r\n|\n|\r/g);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string2, line2, column2) {
  let lines = string2.split(/\r\n|\n|\r/g);
  let codeblock = "";
  let numberLen = (Math.log10(line2 + 1) | 0) + 1;
  for (let i = line2 - 1; i <= line2 + 1; i++) {
    let l = lines[i - 1];
    if (!l)
      continue;
    codeblock += i.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l;
    codeblock += "\n";
    if (i === line2) {
      codeblock += " ".repeat(numberLen + column2 + 2);
      codeblock += "^\n";
    }
  }
  return codeblock;
}
var TomlError;
var init_error = __esm({
  "node_modules/smol-toml/dist/error.js"() {
    TomlError = class extends Error {
      line;
      column;
      codeblock;
      constructor(message, options) {
        const [line2, column2] = getLineColFromPtr(options.toml, options.ptr);
        const codeblock = makeCodeBlock(options.toml, line2, column2);
        super(`Invalid TOML document: ${message}

${codeblock}`, options);
        this.line = line2;
        this.column = column2;
        this.codeblock = codeblock;
      }
    };
  }
});

// node_modules/smol-toml/dist/primitive.js
function parseString(str, ptr) {
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
function parseValue2(value, toml, ptr, integersAsBigInt) {
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
  let isInt = INT_REGEX.test(value);
  if (isInt || FLOAT_REGEX.test(value)) {
    if (LEADING_ZERO.test(value)) {
      throw new TomlError("leading zeroes are not allowed", {
        toml,
        ptr
      });
    }
    value = value.replace(/_/g, "");
    let numeric = +value;
    if (isNaN(numeric)) {
      throw new TomlError("invalid number", {
        toml,
        ptr
      });
    }
    if (isInt) {
      if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) {
        throw new TomlError("integer value cannot be represented losslessly", {
          toml,
          ptr
        });
      }
      if (isInt || integersAsBigInt === true)
        numeric = BigInt(value);
    }
    return numeric;
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
var INT_REGEX, FLOAT_REGEX, LEADING_ZERO;
var init_primitive = __esm({
  "node_modules/smol-toml/dist/primitive.js"() {
    init_date();
    init_error();
    INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
    FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
    LEADING_ZERO = /^[+-]?0[0-9_]/;
  }
});

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
function skipUntil(str, ptr, sep, end, banNewLines = false) {
  if (!end) {
    ptr = indexOfNewline(str, ptr);
    return ptr < 0 ? str.length : ptr;
  }
  for (let i = ptr; i < str.length; i++) {
    let c2 = str[i];
    if (c2 === "#") {
      i = indexOfNewline(str, i);
    } else if (c2 === sep) {
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
var init_util = __esm({
  "node_modules/smol-toml/dist/util.js"() {
    init_error();
  }
});

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
    let [parsed, endPtr2] = parseString(str, ptr);
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
    parseValue2(slice[0], str, ptr, integersAsBigInt),
    endPtr
  ];
}
var init_extract = __esm({
  "node_modules/smol-toml/dist/extract.js"() {
    init_primitive();
    init_struct();
    init_util();
    init_error();
  }
});

// node_modules/smol-toml/dist/struct.js
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
        let [part, eos] = parseString(str, ptr);
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
      let hasOwn = false;
      let [key2, keyEndPtr] = parseKey(str, ptr - 1);
      for (let i = 0; i < key2.length; i++) {
        if (i)
          t = hasOwn ? t[k] : t[k] = {};
        k = key2[i];
        if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) {
          throw new TomlError("trying to redefine an already defined value", {
            toml: str,
            ptr
          });
        }
        if (!hasOwn && k === "__proto__") {
          Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
        }
      }
      if (hasOwn) {
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
var KEY_PART_RE;
var init_struct = __esm({
  "node_modules/smol-toml/dist/struct.js"() {
    init_primitive();
    init_extract();
    init_util();
    init_error();
    KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
  }
});

// node_modules/smol-toml/dist/parse.js
var parse_exports = {};
__export(parse_exports, {
  parse: () => parse7
});
function peekTable(key2, table, meta, type) {
  let t = table;
  let m = meta;
  let k;
  let hasOwn = false;
  let state;
  for (let i = 0; i < key2.length; i++) {
    if (i) {
      t = hasOwn ? t[k] : t[k] = {};
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
    if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) {
      return null;
    }
    if (!hasOwn) {
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
    t = hasOwn ? t[k] : t[k] = {};
  } else if (type === 0 && hasOwn) {
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
var init_parse5 = __esm({
  "node_modules/smol-toml/dist/parse.js"() {
    init_struct();
    init_extract();
    init_util();
    init_error();
  }
});

// node_modules/js-yaml/dist/js-yaml.mjs
var js_yaml_exports = {};
__export(js_yaml_exports, {
  JSON_SCHEMA: () => JSON_SCHEMA,
  load: () => load
});
function defineScalarTag(tagName, options) {
  return {
    tagName,
    nodeKind: "scalar",
    implicit: options.implicit ?? false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    implicitFirstChars: options.implicitFirstChars ?? null,
    resolve: options.resolve,
    identify: options.identify ?? null,
    represent: options.represent ?? ((data) => String(data)),
    representTagName: options.representTagName ?? null
  };
}
function defineSequenceTag(tagName, options) {
  const carrierIsResult = options.finalize === void 0;
  return {
    tagName,
    nodeKind: "sequence",
    implicit: false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    create: options.create,
    addItem: options.addItem,
    finalize: options.finalize ?? ((carrier) => carrier),
    carrierIsResult,
    identify: options.identify ?? null,
    represent: options.represent ?? ((data) => data),
    representTagName: options.representTagName ?? null
  };
}
function defineMappingTag(tagName, options) {
  const carrierIsResult = options.finalize === void 0;
  return {
    tagName,
    nodeKind: "mapping",
    implicit: false,
    matchByTagPrefix: options.matchByTagPrefix ?? false,
    create: options.create,
    addPair: options.addPair,
    has: options.has,
    keys: options.keys,
    get: options.get,
    finalize: options.finalize ?? ((carrier) => carrier),
    carrierIsResult,
    identify: options.identify ?? null,
    represent: options.represent ?? ((data) => data),
    representTagName: options.representTagName ?? null
  };
}
function parseYamlInteger$2(source2) {
  let value = source2;
  let sign2 = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign2 = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign2 * parseInt(value.slice(2), 2);
  if (value.startsWith("0o")) return sign2 * parseInt(value.slice(2), 8);
  if (value.startsWith("0x")) return sign2 * parseInt(value.slice(2), 16);
  return sign2 * parseInt(value, 10);
}
function resolveYamlInteger$2(source2, isExplicit) {
  if (isExplicit) {
    if (!YAML_INTEGER_EXPLICIT_PATTERN$1.test(source2)) return NOT_RESOLVED;
  } else if (!YAML_INTEGER_IMPLICIT_PATTERN$1.test(source2)) return NOT_RESOLVED;
  const result = parseYamlInteger$2(source2);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
function parseYamlInteger$1(source2) {
  let value = source2;
  let sign2 = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign2 = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign2 * parseInt(value.slice(2), 2);
  if (value.startsWith("0o")) return sign2 * parseInt(value.slice(2), 8);
  if (value.startsWith("0x")) return sign2 * parseInt(value.slice(2), 16);
  return sign2 * parseInt(value, 10);
}
function resolveYamlInteger$1(source2, isExplicit) {
  if (isExplicit) {
    if (!YAML_INTEGER_EXPLICIT_PATTERN.test(source2)) return NOT_RESOLVED;
  } else if (!YAML_INTEGER_IMPLICIT_PATTERN.test(source2)) return NOT_RESOLVED;
  const result = parseYamlInteger$1(source2);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
function parseYamlInteger(source2) {
  let value = source2.replace(/_/g, "");
  let sign2 = 1;
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign2 = -1;
    value = value.slice(1);
  }
  if (value.startsWith("0b")) return sign2 * parseInt(value.slice(2), 2);
  if (value.startsWith("0x")) return sign2 * parseInt(value.slice(2), 16);
  if (value.includes(":")) {
    let result = 0;
    for (const part of value.split(":")) result = result * 60 + Number(part);
    return sign2 * result;
  }
  if (value !== "0" && value[0] === "0") return sign2 * parseInt(value, 8);
  return sign2 * parseInt(value, 10);
}
function resolveYamlInteger(source2) {
  if (!YAML_INTEGER_PATTERN.test(source2)) return NOT_RESOLVED;
  const result = parseYamlInteger(source2);
  return Number.isFinite(result) ? result : NOT_RESOLVED;
}
function resolveYamlFloat$2(source2) {
  if (!YAML_FLOAT_PATTERN$1.test(source2)) return NOT_RESOLVED;
  let value = source2.toLowerCase();
  const sign2 = value[0] === "-" ? -1 : 1;
  if ("+-".includes(value[0])) value = value.slice(1);
  if (value === ".inf") return sign2 === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  if (value === ".nan") return NaN;
  const result = sign2 * parseFloat(value);
  if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN$1.test(source2)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat$2(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
function resolveYamlFloat$1(source2, isExplicit) {
  if (isExplicit) {
    if (!YAML_FLOAT_EXPLICIT_PATTERN.test(source2)) return NOT_RESOLVED;
    let value = source2.toLowerCase();
    const sign2 = value[0] === "-" ? -1 : 1;
    if ("+-".includes(value[0])) value = value.slice(1);
    if (value === ".inf") return sign2 === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    if (value === ".nan") return NaN;
    const result2 = sign2 * parseFloat(value);
    return Number.isFinite(result2) ? result2 : NOT_RESOLVED;
  }
  if (!YAML_FLOAT_IMPLICIT_PATTERN.test(source2)) return NOT_RESOLVED;
  const result = Number(source2);
  if (Number.isFinite(result)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat$1(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
function resolveYamlFloat(source2) {
  if (!YAML_FLOAT_PATTERN.test(source2)) return NOT_RESOLVED;
  let value = source2.toLowerCase().replace(/_/g, "");
  const sign2 = value[0] === "-" ? -1 : 1;
  if ("+-".includes(value[0])) value = value.slice(1);
  if (value === ".inf") return sign2 === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  if (value === ".nan") return NaN;
  let result = 0;
  if (value.includes(":")) {
    for (const part of value.split(":")) result = result * 60 + Number(part);
    result *= sign2;
  } else result = sign2 * parseFloat(value);
  if (Number.isFinite(result) || YAML_FLOAT_SPECIAL_PATTERN.test(source2)) return result;
  return NOT_RESOLVED;
}
function representYamlFloat(object) {
  if (isNaN(object)) return ".nan";
  if (object === Number.POSITIVE_INFINITY) return ".inf";
  if (object === Number.NEGATIVE_INFINITY) return "-.inf";
  if (Object.is(object, -0)) return "-0.0";
  const result = object.toString(10);
  return /^[-+]?[0-9]+e/.test(result) ? result.replace("e", ".e") : result;
}
function resolveYamlBinary(source2) {
  const input = source2.replace(/\s/g, "");
  if (input.length % 4 !== 0 || !BASE64_PATTERN.test(input)) return NOT_RESOLVED;
  const binary = atob(input);
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) result[index] = binary.charCodeAt(index);
  return result;
}
function representYamlBinary(object) {
  let binary = "";
  for (let index = 0; index < object.length; index++) binary += String.fromCharCode(object[index]);
  return btoa(binary);
}
function resolveYamlTimestamp(source2) {
  let match2 = YAML_DATE_REGEXP.exec(source2);
  if (match2 === null) match2 = YAML_TIMESTAMP_REGEXP.exec(source2);
  if (match2 === null) return NOT_RESOLVED;
  const year = +match2[1];
  const month = +match2[2] - 1;
  const day = +match2[3];
  if (!match2[4]) {
    const date2 = new Date(Date.UTC(year, month, day));
    if (date2.getUTCFullYear() !== year || date2.getUTCMonth() !== month || date2.getUTCDate() !== day) return NOT_RESOLVED;
    return date2;
  }
  const hour = +match2[4];
  const minute = +match2[5];
  const second = +match2[6];
  let fraction = 0;
  if (hour > 23 || minute > 59 || second > 59) return NOT_RESOLVED;
  if (match2[7]) {
    let value = match2[7].slice(0, 3);
    while (value.length < 3) value += "0";
    fraction = +value;
  }
  const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) return NOT_RESOLVED;
  if (match2[9]) {
    const offsetHour = +match2[10];
    const offsetMinute = +(match2[11] || 0);
    if (offsetHour > 23 || offsetMinute > 59) return NOT_RESOLVED;
    const offset = (offsetHour * 60 + offsetMinute) * 6e4;
    date.setTime(date.getTime() - (match2[9] === "-" ? -offset : offset));
  }
  return date;
}
function isPlainObject(data) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return false;
  const prototype = Object.getPrototypeOf(data);
  return prototype === null || prototype === Object.prototype;
}
function pick(object, keys) {
  const result = {};
  for (const key2 of keys) if (object[key2] !== void 0) result[key2] = object[key2];
  return result;
}
function createTagDefinitionMap() {
  return {
    scalar: {},
    sequence: {},
    mapping: {}
  };
}
function createTagDefinitionListMap() {
  return {
    scalar: [],
    sequence: [],
    mapping: []
  };
}
function compileTags(tags) {
  const result = [];
  for (const tag of tags) {
    let index = result.length;
    for (let previousIndex = 0; previousIndex < result.length; previousIndex++) {
      const previous = result[previousIndex];
      if (previous.nodeKind === tag.nodeKind && previous.tagName === tag.tagName && previous.matchByTagPrefix === tag.matchByTagPrefix) {
        index = previousIndex;
        break;
      }
    }
    result[index] = tag;
  }
  return result;
}
function normalizeKey(key2) {
  if (Array.isArray(key2)) {
    const array = Array.prototype.slice.call(key2);
    for (let index = 0; index < array.length; index++) {
      if (Array.isArray(array[index])) return null;
      if (typeof array[index] === "object" && Object.prototype.toString.call(array[index]) === "[object Object]") array[index] = "[object Object]";
    }
    return String(array);
  }
  if (typeof key2 === "object" && Object.prototype.toString.call(key2) === "[object Object]") return "[object Object]";
  return String(key2);
}
function getLine(buffer2, lineStart, lineEnd, position, maxLineLength) {
  let head = "";
  let tail = "";
  const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer2.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
    pos: position - lineStart + head.length
  };
}
function padStart(string2, max) {
  return " ".repeat(Math.max(max - string2.length, 0)) + string2;
}
function makeSnippet(mark, options) {
  if (!mark.buffer) return null;
  const opts = {
    ...DEFAULT_SNIPPET_OPTIONS,
    ...options
  };
  const re = /\r?\n|\r|\0/g;
  const lineStarts = [0];
  const lineEnds = [];
  let match2;
  let foundLineNo = -1;
  while (match2 = re.exec(mark.buffer)) {
    lineEnds.push(match2.index);
    lineStarts.push(match2.index + match2[0].length);
    if (mark.position <= match2.index && foundLineNo < 0) foundLineNo = lineStarts.length - 2;
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  let result = "";
  const lineNoLength = Math.min(mark.line + opts.linesAfter, lineEnds.length).toString().length;
  const maxLineLength = opts.maxLength - (opts.indent + lineNoLength + 3);
  for (let i = 1; i <= opts.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    const line3 = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
    result = `${" ".repeat(opts.indent)}${padStart((mark.line - i + 1).toString(), lineNoLength)} | ${line3.str}
${result}`;
  }
  const line2 = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += `${" ".repeat(opts.indent)}${padStart((mark.line + 1).toString(), lineNoLength)} | ${line2.str}
`;
  result += `${"-".repeat(opts.indent + lineNoLength + 3 + line2.pos)}^
`;
  for (let i = 1; i <= opts.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    const line3 = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
    result += `${" ".repeat(opts.indent)}${padStart((mark.line + i + 1).toString(), lineNoLength)} | ${line3.str}
`;
  }
  return result.replace(/\n$/, "");
}
function formatError(exception, compact) {
  let where = "";
  if (!exception.mark) return exception.reason;
  if (exception.mark.name) where += `in "${exception.mark.name}" `;
  where += `(${exception.mark.line + 1}:${exception.mark.column + 1})`;
  if (!compact && exception.mark.snippet) where += `

${exception.mark.snippet}`;
  return `${exception.reason} ${where}`;
}
function throwErrorAt(source2, position, message, filename = "") {
  let line2 = 0;
  let lineStart = 0;
  for (let index = 0; index < position; index++) {
    const ch = source2.charCodeAt(index);
    if (ch === 10) {
      line2++;
      lineStart = index + 1;
    } else if (ch === 13) {
      line2++;
      if (source2.charCodeAt(index + 1) === 10) index++;
      lineStart = index + 1;
    }
  }
  const mark = {
    name: filename,
    buffer: source2,
    position,
    line: line2,
    column: position - lineStart
  };
  mark.snippet = makeSnippet(mark);
  throw new YAMLException(message, mark);
}
function simpleEscapeSequence(c2) {
  switch (c2) {
    case 48:
      return "\0";
    case 97:
      return "\x07";
    case 98:
      return "\b";
    case 116:
      return "	";
    case 9:
      return "	";
    case 110:
      return "\n";
    case 118:
      return "\v";
    case 102:
      return "\f";
    case 114:
      return "\r";
    case 101:
      return "\x1B";
    case 32:
      return " ";
    case 34:
      return '"';
    case 47:
      return "/";
    case 92:
      return "\\";
    case 78:
      return "\x85";
    case 95:
      return "\xA0";
    case 76:
      return "\u2028";
    case 80:
      return "\u2029";
    default:
      return "";
  }
}
function charFromCodepoint(c2) {
  if (c2 <= 65535) return String.fromCharCode(c2);
  return String.fromCharCode((c2 - 65536 >> 10) + 55296, (c2 - 65536 & 1023) + 56320);
}
function fromHexCode$1(c2) {
  if (c2 >= 48 && c2 <= 57) return c2 - 48;
  return (c2 | 32) - 97 + 10;
}
function escapedHexLen$1(c2) {
  if (c2 === 120) return 2;
  if (c2 === 117) return 4;
  return 8;
}
function skipFoldedBreaks(input, position, end) {
  let breaks = 0;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 10) {
      breaks++;
      position++;
    } else if (ch === 13) {
      breaks++;
      position++;
      if (input.charCodeAt(position) === 10) position++;
    } else if (ch === 32 || ch === 9) position++;
    else break;
  }
  return {
    position,
    breaks
  };
}
function foldedBreaks(count) {
  if (count === 1) return " ";
  return "\n".repeat(count - 1);
}
function getPlainValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, captureEnd);
}
function getSingleQuotedValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 39) {
      result += input.slice(captureStart, position) + "'";
      position += 2;
      captureStart = captureEnd = position;
    } else if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, end);
}
function getDoubleQuotedValue(input, start, end) {
  let result = "";
  let position = start;
  let captureStart = start;
  let captureEnd = start;
  while (position < end) {
    const ch = input.charCodeAt(position);
    if (ch === 92) {
      result += input.slice(captureStart, position);
      position++;
      const escaped = input.charCodeAt(position);
      if (escaped === 10 || escaped === 13) position = skipFoldedBreaks(input, position, end).position;
      else if (escaped < 256 && simpleEscapeCheck[escaped]) {
        result += simpleEscapeMap[escaped];
        position++;
      } else {
        let hexLength = escapedHexLen$1(escaped);
        let hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          position++;
          const digit = fromHexCode$1(input.charCodeAt(position));
          hexResult = (hexResult << 4) + digit;
        }
        result += charFromCodepoint(hexResult);
        position++;
      }
      captureStart = captureEnd = position;
    } else if (ch === 10 || ch === 13) {
      result += input.slice(captureStart, captureEnd);
      const fold = skipFoldedBreaks(input, position, end);
      result += foldedBreaks(fold.breaks);
      position = captureStart = captureEnd = fold.position;
    } else {
      position++;
      if (ch !== 32 && ch !== 9) captureEnd = position;
    }
  }
  return result + input.slice(captureStart, end);
}
function getBlockValue(input, start, end, indent, chomping, folded) {
  const textIndent = indent < 0 ? 0 : indent;
  const region = input.slice(start, end).replace(/\r\n?/g, "\n");
  const lines = region === "" ? [] : (region.endsWith("\n") ? region.slice(0, -1) : region).split("\n");
  let result = "";
  let didReadContent = false;
  let emptyLines = 0;
  let atMoreIndented = false;
  for (const line2 of lines) {
    let column2 = 0;
    while (column2 < textIndent && line2.charCodeAt(column2) === 32) column2++;
    if (indent < 0 || column2 >= line2.length) {
      emptyLines++;
      continue;
    }
    const content = line2.slice(textIndent);
    const first = content.charCodeAt(0);
    if (folded) {
      if (first === 32 || first === 9) {
        atMoreIndented = true;
        result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        result += "\n".repeat(emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) result += " ";
      } else result += "\n".repeat(emptyLines);
    } else result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
    result += content;
    didReadContent = true;
    emptyLines = 0;
  }
  if (chomping === 3) result += "\n".repeat(didReadContent ? 1 + emptyLines : emptyLines);
  else if (chomping !== 2) {
    if (didReadContent) result += "\n";
  }
  return result;
}
function getScalarValue(input, scalar) {
  if (scalar.valueStart === NO_RANGE$3) return "";
  const {
    valueStart,
    valueEnd
  } = scalar;
  if (scalar.fast) return input.slice(valueStart, valueEnd);
  switch (scalar.style) {
    case 2:
      return getSingleQuotedValue(input, valueStart, valueEnd);
    case 3:
      return getDoubleQuotedValue(input, valueStart, valueEnd);
    case 4:
      return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, false);
    case 5:
      return getBlockValue(input, valueStart, valueEnd, scalar.indent, scalar.chomping, true);
    default:
      return getPlainValue(input, valueStart, valueEnd);
  }
}
function tagNameFull(rawTag, tagHandlers) {
  if (rawTag.startsWith("!<") && rawTag.endsWith(">")) return decodeURIComponent(rawTag.slice(2, -1));
  const handleEnd = rawTag.indexOf("!", 1);
  const handle = handleEnd === -1 ? "!" : rawTag.slice(0, handleEnd + 1);
  const prefix = tagHandlers?.[handle] ?? DEFAULT_TAG_HANDLERS[handle] ?? handle;
  return decodeURIComponent(prefix) + decodeURIComponent(rawTag.slice(handle.length));
}
function eventPosition$1(event) {
  if ("tagStart" in event && event.tagStart !== NO_RANGE$2) return event.tagStart;
  if ("anchorStart" in event && event.anchorStart !== NO_RANGE$2) return event.anchorStart;
  if ("valueStart" in event && event.valueStart !== NO_RANGE$2) return event.valueStart;
  if ("start" in event) return event.start;
  return 0;
}
function throwError$1(state, message) {
  throwErrorAt(state.source, state.position, message, state.filename);
}
function finalizeCollection(state, position, tag, carrier) {
  try {
    return tag.finalize(carrier);
  } catch (error) {
    if (error instanceof YAMLException) throw error;
    throwErrorAt(state.source, position, error instanceof Error ? error.message : String(error), state.filename);
  }
}
function lookupTag(exact, prefix, tagName) {
  const exactTag = exact[tagName];
  if (exactTag) return exactTag;
  for (const tag of prefix) if (tagName.startsWith(tag.tagName)) return tag;
}
function findExplicitTag(state, exact, prefix, tagName, nodeKind) {
  const tag = lookupTag(exact, prefix, tagName);
  if (tag) return tag;
  throwError$1(state, `unknown ${nodeKind} tag !<${tagName}>`);
}
function constructScalar(state, event) {
  const source2 = getScalarValue(state.source, event);
  const rawTag = event.tagStart === NO_RANGE$2 ? "" : state.source.slice(event.tagStart, event.tagEnd);
  const strTag2 = state.schema.defaultScalarTag;
  if (rawTag !== "") {
    if (rawTag === "!") return {
      value: source2,
      tag: strTag2
    };
    const tagName = tagNameFull(rawTag, state.tagHandlers);
    const scalarTag = lookupTag(state.schema.exact.scalar, state.schema.prefix.scalar, tagName);
    if (scalarTag) {
      const result = scalarTag.resolve(source2, true, tagName);
      if (result === NOT_RESOLVED) throwError$1(state, `cannot resolve a node with !<${tagName}> explicit tag`);
      return {
        value: result,
        tag: scalarTag
      };
    }
    const collectionTagDef = lookupTag(state.schema.exact.mapping, state.schema.prefix.mapping, tagName) ?? lookupTag(state.schema.exact.sequence, state.schema.prefix.sequence, tagName);
    if (collectionTagDef) {
      if (source2 !== "") throwError$1(state, `cannot resolve a node with !<${tagName}> explicit tag`);
      const carrier = collectionTagDef.create(tagName);
      return {
        value: collectionTagDef.carrierIsResult ? carrier : finalizeCollection(state, state.position, collectionTagDef, carrier),
        tag: collectionTagDef
      };
    }
    throwError$1(state, `unknown scalar tag !<${tagName}>`);
  }
  if (event.style === 1) {
    const candidates = state.schema.implicitScalarByFirstChar.get(source2.charAt(0)) ?? state.schema.implicitScalarAnyFirstChar;
    for (const tag of candidates) {
      const result = tag.resolve(source2, false, tag.tagName);
      if (result !== NOT_RESOLVED) return {
        value: result,
        tag
      };
    }
  }
  return {
    value: strTag2.resolve(source2, false, strTag2.tagName),
    tag: strTag2
  };
}
function collectionTag(state, event, exact, prefix, defaultTagName, nodeKind) {
  const rawTag = event.tagStart === NO_RANGE$2 ? "" : state.source.slice(event.tagStart, event.tagEnd);
  const tagName = rawTag === "" || rawTag === "!" ? defaultTagName : tagNameFull(rawTag, state.tagHandlers);
  return {
    tagName,
    tag: findExplicitTag(state, exact, prefix, tagName, nodeKind)
  };
}
function isMappingTag(tag) {
  return tag.nodeKind === "mapping";
}
function mergeKeys(state, frame, source2, sourceTag) {
  for (const sourceKey of sourceTag.keys(source2)) {
    if (frame.tag.has(frame.value, sourceKey)) continue;
    const err = frame.tag.addPair(frame.value, sourceKey, sourceTag.get(source2, sourceKey));
    if (err) throwError$1(state, err);
    (frame.overridable ?? (frame.overridable = /* @__PURE__ */ new Set())).add(sourceKey);
  }
}
function mergeSource(state, frame, source2, sourceTag) {
  state.position = frame.keyPosition;
  if (isMappingTag(sourceTag)) mergeKeys(state, frame, source2, sourceTag);
  else if (sourceTag.nodeKind === "sequence" && Array.isArray(source2)) {
    const seen = /* @__PURE__ */ new Set();
    for (const element of source2) {
      if (seen.has(element)) continue;
      seen.add(element);
      mergeKeys(state, frame, element, frame.tag);
    }
  } else throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
}
function addMappingValue(state, frame, key2, value, tag) {
  state.position = frame.keyPosition;
  if (key2 === MERGE_KEY) {
    mergeSource(state, frame, value, tag);
    return;
  }
  if (!state.json && frame.tag.has(frame.value, key2) && !frame.overridable?.has(key2)) throwError$1(state, "duplicated mapping key");
  const err = frame.tag.addPair(frame.value, key2, value);
  if (err) throwError$1(state, err);
  frame.overridable?.delete(key2);
}
function addValue(state, value, tag) {
  const frame = state.frames[state.frames.length - 1];
  if (frame.kind === "document") {
    frame.value = value;
    frame.hasValue = true;
  } else if (frame.kind === "sequence") {
    if (frame.merge) {
      if (!isMappingTag(tag)) throwError$1(state, "cannot merge mappings; the provided source object is unacceptable");
      if (frame.index >= state.maxMergeSeqLength) throwError$1(state, `merge sequence length exceeded maxMergeSeqLength (${state.maxMergeSeqLength})`);
    }
    const err = frame.tag.addItem(frame.value, value, frame.index++);
    if (err) throwError$1(state, err);
  } else if (frame.hasKey) {
    const key2 = frame.key;
    frame.key = void 0;
    frame.hasKey = false;
    addMappingValue(state, frame, key2, value, tag);
  } else {
    frame.key = value;
    frame.keyPosition = state.position;
    frame.hasKey = true;
  }
}
function storeAnchor(state, event, value, tag, isValueFinal) {
  if (event.anchorStart !== NO_RANGE$2) {
    const anchor = {
      value,
      tag,
      isValueFinal
    };
    state.anchors.set(state.source.slice(event.anchorStart, event.anchorEnd), anchor);
    return anchor;
  }
  return null;
}
function constructFromEvents(events, options) {
  const state = {
    ...DEFAULT_CONSTRUCTOR_OPTIONS,
    ...options,
    events,
    documents: [],
    eventIndex: 0,
    position: 0,
    frames: [],
    anchors: /* @__PURE__ */ new Map(),
    tagHandlers: /* @__PURE__ */ Object.create(null)
  };
  while (state.eventIndex < state.events.length) {
    const event = state.events[state.eventIndex++];
    state.position = eventPosition$1(event);
    switch (event.type) {
      case 1:
        state.anchors = /* @__PURE__ */ new Map();
        state.tagHandlers = /* @__PURE__ */ Object.create(null);
        for (const directive of event.directives) if (directive.kind === "tag") state.tagHandlers[directive.handle] = directive.prefix;
        state.frames.push({
          kind: "document",
          position: state.position,
          value: void 0,
          hasValue: false
        });
        break;
      case 4: {
        const {
          value,
          tag
        } = constructScalar(state, event);
        storeAnchor(state, event, value, tag, true);
        addValue(state, value, tag);
        break;
      }
      case 2: {
        const definition = collectionTag(state, event, state.schema.exact.sequence, state.schema.prefix.sequence, "tag:yaml.org,2002:seq", "sequence");
        const value = definition.tag.create(definition.tagName);
        const anchor = storeAnchor(state, event, value, definition.tag, definition.tag.carrierIsResult);
        const parent = state.frames[state.frames.length - 1];
        const merge2 = parent !== void 0 && parent.kind === "mapping" && parent.hasKey && parent.key === MERGE_KEY;
        state.frames.push({
          kind: "sequence",
          position: state.position,
          value,
          tag: definition.tag,
          anchor,
          index: 0,
          merge: merge2
        });
        break;
      }
      case 3: {
        const definition = collectionTag(state, event, state.schema.exact.mapping, state.schema.prefix.mapping, "tag:yaml.org,2002:map", "mapping");
        const value = definition.tag.create(definition.tagName);
        const anchor = storeAnchor(state, event, value, definition.tag, definition.tag.carrierIsResult);
        state.frames.push({
          kind: "mapping",
          position: state.position,
          value,
          tag: definition.tag,
          anchor,
          key: void 0,
          keyPosition: state.position,
          hasKey: false,
          overridable: null
        });
        break;
      }
      case 5: {
        const name = state.source.slice(event.anchorStart, event.anchorEnd);
        const anchor = state.anchors.get(name);
        if (!anchor) throwError$1(state, `unidentified alias "${name}"`);
        if (!anchor.isValueFinal) throwError$1(state, `recursive alias "${name}" is not supported for tag ${anchor.tag.tagName} because it uses finalize()`);
        addValue(state, anchor.value, anchor.tag);
        break;
      }
      case 6: {
        const frame = state.frames.pop();
        if (frame.kind === "document") state.documents.push(frame.value);
        else {
          const value = frame.tag.carrierIsResult ? frame.value : finalizeCollection(state, frame.position, frame.tag, frame.value);
          if (frame.anchor) {
            frame.anchor.value = value;
            frame.anchor.isValueFinal = true;
          }
          addValue(state, value, frame.tag);
        }
        break;
      }
    }
  }
  return state.documents;
}
function addDocumentEvent(state, explicitStart, explicitEnd) {
  state.events.push({
    type: 1,
    explicitStart,
    explicitEnd,
    directives: state.directives
  });
}
function addSequenceEvent(state, start, anchorStart, anchorEnd, tagStart, tagEnd, style) {
  state.events.push({
    type: 2,
    start,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style
  });
}
function addMappingEvent(state, start, anchorStart, anchorEnd, tagStart, tagEnd, style) {
  state.events.push({
    type: 3,
    start,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style
  });
}
function addScalarEvent(state, valueStart, valueEnd, anchorStart, anchorEnd, tagStart, tagEnd, style, chomping = 1, indent = -1, fast = false) {
  state.events.push({
    type: 4,
    valueStart,
    valueEnd,
    anchorStart,
    anchorEnd,
    tagStart,
    tagEnd,
    style,
    chomping,
    indent,
    fast
  });
}
function addAliasEvent(state, anchorStart, anchorEnd) {
  state.events.push({
    type: 5,
    anchorStart,
    anchorEnd
  });
}
function addPopEvent(state) {
  state.events.push({
    type: 6
  });
}
function addEmptyScalarEvent(state) {
  addScalarEvent(state, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, 1);
}
function emptyProperties() {
  return {
    anchorStart: NO_RANGE$1,
    anchorEnd: NO_RANGE$1,
    tagStart: NO_RANGE$1,
    tagEnd: NO_RANGE$1
  };
}
function snapshotState(state) {
  return {
    position: state.position,
    line: state.line,
    lineStart: state.lineStart,
    lineIndent: state.lineIndent,
    firstTabInLine: state.firstTabInLine,
    eventsLength: state.events.length
  };
}
function restoreState(state, snapshot) {
  state.position = snapshot.position;
  state.line = snapshot.line;
  state.lineStart = snapshot.lineStart;
  state.lineIndent = snapshot.lineIndent;
  state.firstTabInLine = snapshot.firstTabInLine;
  state.events.length = snapshot.eventsLength;
}
function throwError(state, message) {
  throwErrorAt(state.input.slice(0, state.length), state.position, message, state.filename);
}
function isEol(c2) {
  return c2 === 10 || c2 === 13;
}
function isWhiteSpace(c2) {
  return c2 === 9 || c2 === 32;
}
function isWsOrEol(c2) {
  return isWhiteSpace(c2) || isEol(c2);
}
function isWsOrEolOrEnd(c2) {
  return c2 === 0 || isWsOrEol(c2);
}
function isFlowIndicator(c2) {
  return c2 === 44 || c2 === 91 || c2 === 93 || c2 === 123 || c2 === 125;
}
function fromDecimalCode(c2) {
  return c2 >= 48 && c2 <= 57 ? c2 - 48 : -1;
}
function fromHexCode(c2) {
  if (c2 >= 48 && c2 <= 57) return c2 - 48;
  const lc = c2 | 32;
  if (lc >= 97 && lc <= 102) return lc - 97 + 10;
  return -1;
}
function escapedHexLen(c2) {
  if (c2 === 120) return 2;
  if (c2 === 117) return 4;
  if (c2 === 85) return 8;
  return 0;
}
function isSimpleEscape(c2) {
  return c2 === 48 || c2 === 97 || c2 === 98 || c2 === 116 || c2 === 9 || c2 === 110 || c2 === 118 || c2 === 102 || c2 === 114 || c2 === 101 || c2 === 32 || c2 === 34 || c2 === 47 || c2 === 92 || c2 === 78 || c2 === 95 || c2 === 76 || c2 === 80;
}
function consumeLineBreak(state) {
  if (state.input.charCodeAt(state.position) === 10) state.position++;
  else {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) state.position++;
  }
  state.line++;
  state.lineStart = state.position;
  state.lineIndent = 0;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments) {
  let lineBreaks = 0;
  let ch = state.input.charCodeAt(state.position);
  let hasSeparation = state.position === state.lineStart || isWsOrEol(state.input.charCodeAt(state.position - 1));
  while (ch !== 0) {
    while (isWhiteSpace(ch)) {
      hasSeparation = true;
      if (ch === 9 && state.firstTabInLine === -1) state.firstTabInLine = state.position;
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && hasSeparation && ch === 35) do
      ch = state.input.charCodeAt(++state.position);
    while (!isEol(ch) && ch !== 0);
    if (!isEol(ch)) break;
    consumeLineBreak(state);
    lineBreaks++;
    hasSeparation = true;
    ch = state.input.charCodeAt(state.position);
    while (ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
  }
  return lineBreaks;
}
function testDocumentSeparator(state, position = state.position) {
  const ch = state.input.charCodeAt(position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(position + 1) && ch === state.input.charCodeAt(position + 2)) {
    const following = state.input.charCodeAt(position + 3);
    return following === 0 || isWsOrEol(following);
  }
  return false;
}
function skipUntilLineEnd(state) {
  let ch = state.input.charCodeAt(state.position);
  while (ch !== 0 && !isEol(ch)) ch = state.input.charCodeAt(++state.position);
}
function checkPrintable(state, start, end) {
  if (PATTERN_NON_PRINTABLE.test(state.input.slice(start, end))) throwError(state, "the stream contains non-printable characters");
}
function readTagProperty(state, props, inFlow) {
  if (state.input.charCodeAt(state.position) !== 33) return false;
  if (props.tagStart !== NO_RANGE$1) throwError(state, "duplication of a tag property");
  const start = state.position;
  let isVerbatim = false;
  let isNamed = false;
  let tagHandle = "!";
  let ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  }
  let suffixStart = state.position;
  let tagName;
  if (isVerbatim) {
    while (ch !== 0 && ch !== 62) ch = state.input.charCodeAt(++state.position);
    if (ch !== 62) throwError(state, "unexpected end of the stream within a verbatim tag");
    tagName = state.input.slice(suffixStart, state.position);
    state.position++;
  } else {
    while (ch !== 0 && !isWsOrEol(ch) && !(inFlow && isFlowIndicator(ch))) {
      if (ch === 33) if (!isNamed) {
        tagHandle = state.input.slice(suffixStart - 1, state.position + 1);
        if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, "named tag handle cannot contain such characters");
        isNamed = true;
        suffixStart = state.position + 1;
      } else throwError(state, "tag suffix cannot contain exclamation marks");
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(suffixStart, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, "tag suffix cannot contain flow indicator characters");
  }
  if (tagName && !(isVerbatim ? PATTERN_TAG_URI.test(tagName) : PATTERN_TAG_SUFFIX.test(tagName))) throwError(state, `tag name cannot contain such characters: ${tagName}`);
  if (!isVerbatim && tagHandle !== "!" && tagHandle !== "!!" && !HAS_OWN.call(state.tagHandlers, tagHandle)) throwError(state, `undeclared tag handle "${tagHandle}"`);
  props.tagStart = start;
  props.tagEnd = state.position;
  return true;
}
function readAnchorProperty(state, props) {
  if (state.input.charCodeAt(state.position) !== 38) return false;
  if (props.anchorStart !== NO_RANGE$1) throwError(state, "duplication of an anchor property");
  state.position++;
  const start = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) state.position++;
  if (state.position === start) throwError(state, "name of an anchor node must contain at least one character");
  props.anchorStart = start;
  props.anchorEnd = state.position;
  return true;
}
function readAlias(state, props) {
  if (state.input.charCodeAt(state.position) !== 42) return false;
  if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) throwError(state, "alias node should not have any properties");
  state.position++;
  const start = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position)) && !isFlowIndicator(state.input.charCodeAt(state.position))) state.position++;
  if (state.position === start) throwError(state, "name of an alias node must contain at least one character");
  addAliasEvent(state, start, state.position);
  return true;
}
function readFlowScalarBreak(state, nodeIndent) {
  skipSeparationSpace(state, false);
  if (state.lineIndent < nodeIndent) throwError(state, "deficient indentation");
}
function readSingleQuotedScalar(state, nodeIndent, props) {
  if (state.input.charCodeAt(state.position) !== 39) return false;
  state.position++;
  const start = state.position;
  let simple = true;
  while (state.input.charCodeAt(state.position) !== 0) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 39) {
      if (state.input.charCodeAt(state.position + 1) === 39) {
        simple = false;
        state.position += 2;
        continue;
      }
      const end = state.position;
      state.position++;
      addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 2, 1, -1, simple);
      return true;
    }
    if (isEol(ch)) {
      simple = false;
      readFlowScalarBreak(state, nodeIndent);
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a single quoted scalar");
    else if (ch !== 9 && ch < 32) throwError(state, "expected valid JSON character");
    else state.position++;
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent, props) {
  if (state.input.charCodeAt(state.position) !== 34) return false;
  state.position++;
  const start = state.position;
  let simple = true;
  while (state.input.charCodeAt(state.position) !== 0) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 34) {
      const end = state.position;
      state.position++;
      addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 3, 1, -1, simple);
      return true;
    }
    if (ch === 92) {
      simple = false;
      const escaped = state.input.charCodeAt(++state.position);
      if (isEol(escaped)) readFlowScalarBreak(state, nodeIndent);
      else if (isSimpleEscape(escaped)) state.position++;
      else {
        let hexLength = escapedHexLen(escaped);
        if (hexLength === 0) throwError(state, "unknown escape sequence");
        while (hexLength-- > 0) {
          state.position++;
          if (fromHexCode(state.input.charCodeAt(state.position)) < 0) throwError(state, "expected hexadecimal character");
        }
        state.position++;
      }
    } else if (isEol(ch)) {
      simple = false;
      readFlowScalarBreak(state, nodeIndent);
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a double quoted scalar");
    else if (ch !== 9 && ch < 32) throwError(state, "expected valid JSON character");
    else state.position++;
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readBlockScalar(state, parentIndent, props) {
  const ch = state.input.charCodeAt(state.position);
  let chomping = 1;
  let indent = -1;
  let detectedIndent = false;
  if (ch !== 124 && ch !== 62) return false;
  const style = ch === 124 ? 4 : 5;
  state.position++;
  while (state.input.charCodeAt(state.position) !== 0) {
    const current = state.input.charCodeAt(state.position);
    const digit = fromDecimalCode(current);
    if (current === 43 || current === 45) {
      if (chomping !== 1) throwError(state, "repeat of a chomping mode identifier");
      chomping = current === 43 ? 3 : 2;
      state.position++;
    } else if (digit >= 0) {
      if (digit === 0) throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      if (detectedIndent) throwError(state, "repeat of an indentation width identifier");
      indent = parentIndent + digit - 1;
      detectedIndent = true;
      state.position++;
    } else break;
  }
  let hadWhitespace = false;
  while (isWhiteSpace(state.input.charCodeAt(state.position))) {
    hadWhitespace = true;
    state.position++;
  }
  if (hadWhitespace && state.input.charCodeAt(state.position) === 35) skipUntilLineEnd(state);
  if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state);
  else if (state.input.charCodeAt(state.position) !== 0) throwError(state, "a line break is expected");
  let contentIndent = detectedIndent ? indent : -1;
  let maxLeadingIndent = 0;
  const valueStart = state.position;
  let valueEnd = state.position;
  while (state.input.charCodeAt(state.position) !== 0) {
    const linePosition = state.position;
    let column2 = 0;
    while (state.input.charCodeAt(linePosition + column2) === 32) column2++;
    const first = state.input.charCodeAt(linePosition + column2);
    if (first === 0) {
      if (contentIndent >= 0) {
        if (column2 > contentIndent) valueEnd = linePosition + column2;
      } else if (column2 > 0) valueEnd = linePosition + column2;
      break;
    }
    if (linePosition === state.lineStart && testDocumentSeparator(state, linePosition)) break;
    if (!detectedIndent && contentIndent === -1 && isEol(first)) maxLeadingIndent = Math.max(maxLeadingIndent, column2);
    if (!detectedIndent && contentIndent === -1 && !isEol(first)) {
      if (first === 9 && column2 < parentIndent) {
        state.position = linePosition + column2;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (column2 < maxLeadingIndent) {
        state.position = linePosition + column2;
        throwError(state, "bad indentation of a mapping entry");
      }
    }
    if (contentIndent === -1 && first !== 0 && !isEol(first) && column2 < parentIndent) {
      state.lineIndent = column2;
      state.position = linePosition + column2;
      break;
    }
    if (!detectedIndent && first !== 0 && !isEol(first) && contentIndent === -1) contentIndent = column2;
    const requiredIndent = contentIndent === -1 ? parentIndent + 1 : contentIndent;
    if (first !== 0 && !isEol(first) && column2 < requiredIndent) {
      state.lineIndent = column2;
      state.position = linePosition + column2;
      break;
    }
    skipUntilLineEnd(state);
    valueEnd = state.position;
    if (isEol(state.input.charCodeAt(state.position))) {
      consumeLineBreak(state);
      valueEnd = state.position;
    }
  }
  checkPrintable(state, valueStart, valueEnd);
  addScalarEvent(state, valueStart, valueEnd, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, style, chomping, contentIndent);
  return true;
}
function canStartPlainScalar(state, nodeContext) {
  const ch = state.input.charCodeAt(state.position);
  const inFlow = nodeContext === CONTEXT_FLOW_IN;
  if (ch === 0 || isWsOrEol(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96 || inFlow && isFlowIndicator(ch)) return false;
  if (ch === 63 || ch === 45) {
    const following = state.input.charCodeAt(state.position + 1);
    if (isWsOrEolOrEnd(following) || inFlow && isFlowIndicator(following)) return false;
  }
  return true;
}
function readPlainScalar(state, nodeIndent, nodeContext, props) {
  if (!canStartPlainScalar(state, nodeContext)) return false;
  const start = state.position;
  let end = state.position;
  let ch = state.input.charCodeAt(state.position);
  const inFlow = nodeContext === CONTEXT_FLOW_IN;
  let multiline = false;
  while (ch !== 0) {
    if (state.position === state.lineStart && testDocumentSeparator(state)) break;
    if (ch === 58) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEolOrEnd(following) || inFlow && isFlowIndicator(following)) break;
    } else if (ch === 35) {
      if (isWsOrEol(state.input.charCodeAt(state.position - 1))) break;
    } else if (inFlow && isFlowIndicator(ch)) break;
    else if (isEol(ch)) {
      const savedPosition = state.position;
      const savedLine = state.line;
      const savedLineStart = state.lineStart;
      const savedLineIndent = state.lineIndent;
      skipSeparationSpace(state, false);
      if (state.lineIndent >= nodeIndent) {
        multiline = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      }
      state.position = savedPosition;
      state.line = savedLine;
      state.lineStart = savedLineStart;
      state.lineIndent = savedLineIndent;
      break;
    }
    if (!isWhiteSpace(ch)) end = state.position + 1;
    ch = state.input.charCodeAt(++state.position);
  }
  if (end === start) return false;
  checkPrintable(state, start, end);
  addScalarEvent(state, start, end, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 1, 1, -1, !multiline);
  return true;
}
function skipFlowSeparationSpace(state, nodeIndent) {
  const startLine = state.line;
  skipSeparationSpace(state, true);
  if (state.line > startLine && state.lineIndent < nodeIndent || state.firstTabInLine !== -1 && state.lineIndent < nodeIndent) throwError(state, "deficient indentation");
}
function readFlowCollection(state, nodeIndent, props) {
  const ch = state.input.charCodeAt(state.position);
  const isMapping = ch === 123;
  const start = state.position;
  let readNext = true;
  if (ch !== 91 && ch !== 123) return false;
  const terminator = isMapping ? 125 : 93;
  if (isMapping) addMappingEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 2);
  else addSequenceEvent(state, start, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 2);
  state.position++;
  while (state.input.charCodeAt(state.position) !== 0) {
    skipFlowSeparationSpace(state, nodeIndent);
    let ch2 = state.input.charCodeAt(state.position);
    if (ch2 === terminator) {
      state.position++;
      addPopEvent(state);
      return true;
    } else if (!readNext) throwError(state, "missed comma between flow collection entries");
    else if (ch2 === 44) throwError(state, "expected the node content, but found ','");
    let isPair = false;
    let isExplicitPair = false;
    if (ch2 === 63 && isWsOrEol(state.input.charCodeAt(state.position + 1))) {
      isPair = isExplicitPair = true;
      state.position += 1;
      skipFlowSeparationSpace(state, nodeIndent);
    }
    const entryLine = state.line;
    const entryStart = snapshotState(state);
    const keyWasRead = parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    skipFlowSeparationSpace(state, nodeIndent);
    ch2 = state.input.charCodeAt(state.position);
    if ((isMapping || isExplicitPair || state.line === entryLine) && ch2 === 58) {
      isPair = true;
      state.position++;
      skipFlowSeparationSpace(state, nodeIndent);
      if (!isMapping) {
        restoreState(state, entryStart);
        addMappingEvent(state, entryStart.position, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, 2);
        if (!parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true)) addEmptyScalarEvent(state);
        skipFlowSeparationSpace(state, nodeIndent);
        state.position++;
        skipFlowSeparationSpace(state, nodeIndent);
      } else if (!keyWasRead) addEmptyScalarEvent(state);
      if (!parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true)) addEmptyScalarEvent(state);
      skipFlowSeparationSpace(state, nodeIndent);
      if (!isMapping) addPopEvent(state);
    } else if (isMapping && isPair) {
      if (!keyWasRead) addEmptyScalarEvent(state);
      addEmptyScalarEvent(state);
    } else if (isMapping) addEmptyScalarEvent(state);
    else if (isPair) {
      restoreState(state, entryStart);
      addMappingEvent(state, entryStart.position, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, NO_RANGE$1, 2);
      parseNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      addEmptyScalarEvent(state);
      addPopEvent(state);
    }
    ch2 = state.input.charCodeAt(state.position);
    if (ch2 === 44) {
      readNext = true;
      state.position++;
    } else readNext = false;
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockSequence(state, nodeIndent, props) {
  if (state.firstTabInLine !== -1 || state.input.charCodeAt(state.position) !== 45 || !isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) return false;
  addSequenceEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 1);
  while (state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    const entryLine = state.line;
    state.position++;
    const hadBreak = skipSeparationSpace(state, true) > 0;
    if (state.firstTabInLine !== -1 && state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) throwError(state, "bad indentation of a sequence entry");
    if (hadBreak && state.lineIndent <= nodeIndent) addEmptyScalarEvent(state);
    else parseNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    skipSeparationSpace(state, true);
    if (state.lineIndent < nodeIndent || state.position >= state.length) break;
    if (state.lineIndent > nodeIndent) throwError(state, "bad indentation of a sequence entry");
    if (state.line === entryLine && state.input.charCodeAt(state.position) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 1))) throwError(state, "bad indentation of a sequence entry");
  }
  addPopEvent(state);
  return true;
}
function readBlockMapping(state, nodeIndent, flowIndent, props) {
  let atExplicitKey = false;
  let detected = false;
  let mappingOpened = false;
  let pendingExplicitKey = false;
  if (state.firstTabInLine !== -1) return false;
  let ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    const following = state.input.charCodeAt(state.position + 1);
    const entryLine = state.line;
    if ((ch === 63 || ch === 58) && isWsOrEolOrEnd(following)) {
      if (!mappingOpened) {
        addMappingEvent(state, state.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 1);
        mappingOpened = true;
      }
      if (ch === 63) {
        if (atExplicitKey) addEmptyScalarEvent(state);
        detected = true;
        atExplicitKey = true;
      } else if (atExplicitKey) atExplicitKey = false;
      else {
        addEmptyScalarEvent(state);
        detected = true;
        atExplicitKey = false;
      }
      state.position += 1;
      pendingExplicitKey = true;
    } else {
      if (atExplicitKey) {
        addEmptyScalarEvent(state);
        atExplicitKey = false;
      }
      const beforeKey = snapshotState(state);
      if (!parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) break;
      if (state.line === entryLine) {
        ch = state.input.charCodeAt(state.position);
        while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!isWsOrEolOrEnd(ch)) throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          if (!mappingOpened) {
            restoreState(state, beforeKey);
            addMappingEvent(state, beforeKey.position, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 1);
            mappingOpened = true;
            parseNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true);
            ch = state.input.charCodeAt(state.position);
            while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
            state.position++;
          }
          detected = true;
          atExplicitKey = false;
          pendingExplicitKey = false;
        } else if (detected) throwError(state, "expected ':' after a mapping key");
        else {
          if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) {
            restoreState(state, beforeKey);
            return false;
          }
          return true;
        }
      } else if (detected) throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      else {
        if (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1) {
          restoreState(state, beforeKey);
          return false;
        }
        return true;
      }
    }
    if (parseNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, pendingExplicitKey)) pendingExplicitKey = false;
    if (!atExplicitKey) {
      if (pendingExplicitKey) {
        addEmptyScalarEvent(state);
        pendingExplicitKey = false;
      }
    }
    skipSeparationSpace(state, true);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === entryLine || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a mapping entry");
    else if (state.lineIndent < nodeIndent) break;
  }
  if (!detected) return false;
  if (atExplicitKey) addEmptyScalarEvent(state);
  if (mappingOpened) addPopEvent(state);
  return true;
}
function parseNode(state, parentIndent, nodeContext, allowToSeek, allowCompact, allowPropertyMapping = true) {
  if (state.depth >= state.maxDepth) throwError(state, `nesting exceeded maxDepth (${state.maxDepth})`);
  state.depth++;
  let indentStatus = 1;
  let atNewLine = false;
  let hasContent = false;
  let propertyStart = null;
  const props = emptyProperties();
  let allowBlockScalars = nodeContext === CONTEXT_BLOCK_OUT || nodeContext === CONTEXT_BLOCK_IN;
  let allowBlockCollections = allowBlockScalars;
  const allowBlockStyles = allowBlockScalars;
  if (allowToSeek && skipSeparationSpace(state, true)) {
    atNewLine = true;
    if (state.lineIndent > parentIndent) indentStatus = 1;
    else if (state.lineIndent === parentIndent) indentStatus = 0;
    else indentStatus = -1;
  }
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    state.depth--;
    return false;
  }
  if (indentStatus === 1) while (true) {
    const ch = state.input.charCodeAt(state.position);
    const propertyState = snapshotState(state);
    if (atNewLine && indentStatus !== 1 && (ch === 33 || ch === 38)) break;
    if (atNewLine && allowBlockStyles && (props.tagStart !== NO_RANGE$1 || props.anchorStart !== NO_RANGE$1) && (ch === 33 || ch === 38)) {
      const fallbackState = snapshotState(state);
      const flowIndent = parentIndent + 1;
      if (readBlockMapping(state, state.position - state.lineStart, flowIndent, props) && state.events[fallbackState.eventsLength]?.type === 3) {
        state.depth--;
        return true;
      }
      restoreState(state, fallbackState);
    }
    if (atNewLine && (ch === 33 && props.tagStart !== NO_RANGE$1 || ch === 38 && props.anchorStart !== NO_RANGE$1)) break;
    if (!readTagProperty(state, props, nodeContext === CONTEXT_FLOW_IN) && !readAnchorProperty(state, props)) break;
    if (propertyStart === null) propertyStart = propertyState;
    if (skipSeparationSpace(state, true)) {
      atNewLine = true;
      allowBlockCollections = allowBlockStyles;
      if (state.lineIndent > parentIndent) indentStatus = 1;
      else if (state.lineIndent === parentIndent) indentStatus = 0;
      else indentStatus = -1;
    } else allowBlockCollections = false;
  }
  if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
  if (indentStatus === 1 || nodeContext === CONTEXT_BLOCK_OUT) {
    const flowIndent = nodeContext === CONTEXT_FLOW_IN || nodeContext === CONTEXT_FLOW_OUT ? parentIndent : parentIndent + 1;
    const blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent, props) || readBlockMapping(state, blockIndent, flowIndent, props)) || readFlowCollection(state, flowIndent, props)) hasContent = true;
      else {
        const ch = state.input.charCodeAt(state.position);
        if (propertyStart !== null && allowPropertyMapping && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62) {
          const fallbackState = snapshotState(state);
          const propertyIndent = propertyStart.position - propertyStart.lineStart;
          restoreState(state, propertyStart);
          if (readBlockMapping(state, propertyIndent, flowIndent, emptyProperties()) && state.events[fallbackState.eventsLength]?.type === 3) hasContent = true;
          else restoreState(state, fallbackState);
        }
        if (!hasContent && (allowBlockScalars && readBlockScalar(state, flowIndent, props) || readSingleQuotedScalar(state, flowIndent, props) || readDoubleQuotedScalar(state, flowIndent, props) || readAlias(state, props) || readPlainScalar(state, flowIndent, nodeContext, props))) hasContent = true;
      }
    } else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence(state, blockIndent, props);
  }
  allowBlockScalars = allowBlockScalars && !hasContent;
  if (!hasContent && (props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1 || allowBlockScalars)) {
    addScalarEvent(state, NO_RANGE$1, NO_RANGE$1, props.anchorStart, props.anchorEnd, props.tagStart, props.tagEnd, 1);
    hasContent = true;
  }
  state.depth--;
  return hasContent || props.anchorStart !== NO_RANGE$1 || props.tagStart !== NO_RANGE$1;
}
function readDirective(state) {
  if (state.lineIndent > 0 || state.input.charCodeAt(state.position) !== 37) return false;
  state.position++;
  const nameStart = state.position;
  while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++;
  const name = state.input.slice(nameStart, state.position);
  const args = [];
  if (name.length === 0) throwError(state, "directive name must not be less than one character in length");
  while (state.input.charCodeAt(state.position) !== 0 && !isEol(state.input.charCodeAt(state.position))) {
    while (isWhiteSpace(state.input.charCodeAt(state.position))) state.position++;
    if (state.input.charCodeAt(state.position) === 35 || isEol(state.input.charCodeAt(state.position)) || state.input.charCodeAt(state.position) === 0) break;
    const start = state.position;
    while (state.input.charCodeAt(state.position) !== 0 && !isWsOrEol(state.input.charCodeAt(state.position))) state.position++;
    args.push(state.input.slice(start, state.position));
  }
  if (isEol(state.input.charCodeAt(state.position))) consumeLineBreak(state);
  if (name === "YAML") {
    if (state.directives.some((directive) => directive.kind === "yaml")) throwError(state, "duplication of %YAML directive");
    if (args.length !== 1) throwError(state, "YAML directive accepts exactly one argument");
    const match2 = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match2 === null) throwError(state, "ill-formed argument of the YAML directive");
    if (parseInt(match2[1], 10) !== 1) throwError(state, "unacceptable YAML version of the document");
    state.directives.push({
      kind: "yaml",
      version: args[0]
    });
  } else if (name === "TAG") {
    if (args.length !== 2) throwError(state, "TAG directive accepts exactly two arguments");
    const [handle, prefix] = args;
    if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    if (HAS_OWN.call(state.tagHandlers, handle)) throwError(state, `there is a previously declared suffix for "${handle}" tag handle`);
    if (!PATTERN_TAG_PREFIX.test(prefix)) throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    state.tagHandlers[handle] = prefix;
    state.directives.push({
      kind: "tag",
      handle,
      prefix
    });
  }
  return true;
}
function readDocument(state) {
  state.directives = [];
  state.tagHandlers = /* @__PURE__ */ Object.create(null);
  let hasDirectives = false;
  skipSeparationSpace(state, true);
  while (readDirective(state)) {
    hasDirectives = true;
    skipSeparationSpace(state, true);
  }
  let explicitStart = false;
  let explicitEnd = false;
  let allowCompact = true;
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45 && isWsOrEolOrEnd(state.input.charCodeAt(state.position + 3))) {
    explicitStart = true;
    const markerLine = state.line;
    state.position += 3;
    skipSeparationSpace(state, true);
    allowCompact = state.line > markerLine;
  } else if (hasDirectives) throwError(state, "directives end mark is expected");
  const documentEventIndex = state.events.length;
  if (!explicitStart && state.position === state.lineStart && state.input.charCodeAt(state.position) === 46 && testDocumentSeparator(state)) {
    state.position += 3;
    skipSeparationSpace(state, true);
    return;
  }
  addDocumentEvent(state, explicitStart, false);
  if (!parseNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, allowCompact, allowCompact)) addEmptyScalarEvent(state);
  skipSeparationSpace(state, true);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    explicitEnd = state.input.charCodeAt(state.position) === 46;
    if (explicitEnd) {
      const markerLine = state.line;
      state.position += 3;
      skipSeparationSpace(state, true);
      if (state.line === markerLine && state.position < state.length) throwError(state, "end of the stream or a document separator is expected");
    }
  }
  const documentEvent = state.events[documentEventIndex];
  if (documentEvent?.type === 1) documentEvent.explicitEnd = explicitEnd;
  addPopEvent(state);
  if (!explicitEnd && state.position < state.length && !(state.position === state.lineStart && testDocumentSeparator(state))) throwError(state, "end of the stream or a document separator is expected");
}
function parseEvents(input, options) {
  const length = input.length;
  const state = {
    ...DEFAULT_PARSER_OPTIONS,
    ...options,
    input: `${input}\0`,
    length,
    position: 0,
    line: 0,
    lineStart: 0,
    lineIndent: 0,
    firstTabInLine: -1,
    depth: 0,
    directives: [],
    tagHandlers: /* @__PURE__ */ Object.create(null),
    events: []
  };
  const nullpos = input.indexOf("\0");
  if (nullpos !== -1) throwErrorAt(input, nullpos, "null byte is not allowed in input", state.filename);
  if (state.input.charCodeAt(state.position) === 65279) state.position++;
  while (state.position < state.length) {
    skipSeparationSpace(state, true);
    if (state.position >= state.length) break;
    const documentStart = state.position;
    readDocument(state);
    if (state.position === documentStart)
      throwError(state, "can not read a document");
  }
  return state.events;
}
function loadDocuments(input, options = {}) {
  const opts = {
    ...DEFAULT_LOAD_OPTIONS,
    ...options
  };
  const source2 = String(input);
  const PARSER_OPT_KEYS = Object.keys(DEFAULT_PARSER_OPTIONS);
  const CONSTRUCTOR_OPT_KEYS = Object.keys(DEFAULT_CONSTRUCTOR_OPTIONS);
  return constructFromEvents(parseEvents(source2, pick(opts, PARSER_OPT_KEYS)), {
    ...pick(opts, CONSTRUCTOR_OPT_KEYS),
    source: source2
  });
}
function load(input, options) {
  const documents = loadDocuments(input, options);
  if (documents.length === 0) throw new YAMLException("expected a document, but the input is empty");
  if (documents.length === 1) return documents[0];
  throw new YAMLException("expected a single document in the stream, but found more");
}
var NOT_RESOLVED, MERGE_KEY, strTag, NULL_VALUES$1, nullCoreTag, nullJsonTag, NULL_VALUES, nullYaml11Tag, TRUE_VALUES$2, FALSE_VALUES$2, boolCoreTag, TRUE_VALUES$1, FALSE_VALUES$1, boolJsonTag, TRUE_VALUES, FALSE_VALUES, boolYaml11Tag, YAML_INTEGER_IMPLICIT_PATTERN$1, YAML_INTEGER_EXPLICIT_PATTERN$1, intCoreTag, YAML_INTEGER_IMPLICIT_PATTERN, YAML_INTEGER_EXPLICIT_PATTERN, intJsonTag, YAML_INTEGER_PATTERN, intYaml11Tag, YAML_FLOAT_PATTERN$1, YAML_FLOAT_SPECIAL_PATTERN$1, floatCoreTag, YAML_FLOAT_IMPLICIT_PATTERN, YAML_FLOAT_EXPLICIT_PATTERN, floatJsonTag, YAML_FLOAT_PATTERN, YAML_FLOAT_SPECIAL_PATTERN, floatYaml11Tag, mergeTag, BASE64_PATTERN, binaryTag, YAML_DATE_REGEXP, YAML_TIMESTAMP_REGEXP, timestampTag, seqTag, omapTag, pairsTag, mapTag, setTag, Schema, FAILSAFE_SCHEMA, JSON_SCHEMA, CORE_SCHEMA, YAML11_SCHEMA, realMapTag, legacyMapTag, DEFAULT_SNIPPET_OPTIONS, YAMLException, NO_RANGE$3, simpleEscapeCheck, simpleEscapeMap, DEFAULT_TAG_HANDLERS, NO_RANGE$2, DEFAULT_CONSTRUCTOR_OPTIONS, NO_RANGE$1, HAS_OWN, CONTEXT_FLOW_IN, CONTEXT_FLOW_OUT, CONTEXT_BLOCK_IN, CONTEXT_BLOCK_OUT, PATTERN_NON_PRINTABLE, PATTERN_FLOW_INDICATORS, PATTERN_TAG_HANDLE, NS_URI_CHAR, NS_TAG_CHAR, PATTERN_TAG_URI, PATTERN_TAG_SUFFIX, PATTERN_TAG_PREFIX, DEFAULT_PARSER_OPTIONS, DEFAULT_LOAD_OPTIONS, ESCAPE_SEQUENCES, DEFAULT_PRESENTER_OPTIONS, DEFAULT_DUMP_SCHEMA, DEFAULT_DUMP_OPTIONS;
var init_js_yaml = __esm({
  "node_modules/js-yaml/dist/js-yaml.mjs"() {
    NOT_RESOLVED = /* @__PURE__ */ Symbol("NOT_RESOLVED");
    MERGE_KEY = /* @__PURE__ */ Symbol("MERGE_KEY");
    strTag = defineScalarTag("tag:yaml.org,2002:str", {
      resolve: (source2) => source2,
      identify: (data) => typeof data === "string"
    });
    NULL_VALUES$1 = ["", "~", "null", "Null", "NULL"];
    nullCoreTag = defineScalarTag("tag:yaml.org,2002:null", {
      implicit: true,
      implicitFirstChars: ["", "~", "n", "N"],
      resolve: (source2) => {
        if (NULL_VALUES$1.indexOf(source2) !== -1) return null;
        return NOT_RESOLVED;
      },
      identify: (object) => object === null,
      represent: () => "null"
    });
    nullJsonTag = defineScalarTag("tag:yaml.org,2002:null", {
      implicit: true,
      implicitFirstChars: ["n"],
      resolve: (source2, isExplicit) => {
        if (source2 === "null" || isExplicit && source2 === "") return null;
        return NOT_RESOLVED;
      },
      identify: (object) => object === null,
      represent: () => "null"
    });
    NULL_VALUES = ["", "~", "null", "Null", "NULL"];
    nullYaml11Tag = defineScalarTag("tag:yaml.org,2002:null", {
      implicit: true,
      implicitFirstChars: ["", "~", "n", "N"],
      resolve: (source2) => {
        if (NULL_VALUES.indexOf(source2) !== -1) return null;
        return NOT_RESOLVED;
      },
      identify: (object) => object === null,
      represent: () => "null"
    });
    TRUE_VALUES$2 = ["true", "True", "TRUE"];
    FALSE_VALUES$2 = ["false", "False", "FALSE"];
    boolCoreTag = defineScalarTag("tag:yaml.org,2002:bool", {
      implicit: true,
      implicitFirstChars: ["t", "T", "f", "F"],
      resolve: (source2) => {
        if (TRUE_VALUES$2.indexOf(source2) !== -1) return true;
        if (FALSE_VALUES$2.indexOf(source2) !== -1) return false;
        return NOT_RESOLVED;
      },
      identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
      represent: (object) => object ? "true" : "false"
    });
    TRUE_VALUES$1 = ["true"];
    FALSE_VALUES$1 = ["false"];
    boolJsonTag = defineScalarTag("tag:yaml.org,2002:bool", {
      implicit: true,
      implicitFirstChars: ["t", "f"],
      resolve: (source2) => {
        if (TRUE_VALUES$1.indexOf(source2) !== -1) return true;
        if (FALSE_VALUES$1.indexOf(source2) !== -1) return false;
        return NOT_RESOLVED;
      },
      identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
      represent: (object) => object ? "true" : "false"
    });
    TRUE_VALUES = ["true", "True", "TRUE", "y", "Y", "yes", "Yes", "YES", "on", "On", "ON"];
    FALSE_VALUES = ["false", "False", "FALSE", "n", "N", "no", "No", "NO", "off", "Off", "OFF"];
    boolYaml11Tag = defineScalarTag("tag:yaml.org,2002:bool", {
      implicit: true,
      implicitFirstChars: ["y", "Y", "n", "N", "t", "T", "f", "F", "o", "O"],
      resolve: (source2) => {
        if (TRUE_VALUES.indexOf(source2) !== -1) return true;
        if (FALSE_VALUES.indexOf(source2) !== -1) return false;
        return NOT_RESOLVED;
      },
      identify: (object) => Object.prototype.toString.call(object) === "[object Boolean]",
      represent: (object) => object ? "true" : "false"
    });
    YAML_INTEGER_IMPLICIT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:0o[0-7]+|0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
    YAML_INTEGER_EXPLICIT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1]+|[-+]?0o[0-7]+|[-+]?0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
    intCoreTag = defineScalarTag("tag:yaml.org,2002:int", {
      implicit: true,
      implicitFirstChars: ["-", "+", ..."0123456789"],
      resolve: resolveYamlInteger$2,
      identify: (object) => Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !Object.is(object, -0),
      represent: (object) => object.toString(10)
    });
    YAML_INTEGER_IMPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^-?(?:0|[1-9][0-9]*)$");
    YAML_INTEGER_EXPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1]+|[-+]?0o[0-7]+|[-+]?0x[0-9a-fA-F]+|[-+]?[0-9]+)$");
    intJsonTag = defineScalarTag("tag:yaml.org,2002:int", {
      implicit: true,
      implicitFirstChars: ["-", ..."0123456789"],
      resolve: resolveYamlInteger$1,
      identify: (object) => Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !Object.is(object, -0),
      represent: (object) => object.toString(10)
    });
    YAML_INTEGER_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?0b[0-1_]+|[-+]?0[0-7_]+|[-+]?0x[0-9a-fA-F_]+|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+|[-+]?(?:0|[1-9][0-9_]*))$");
    intYaml11Tag = defineScalarTag("tag:yaml.org,2002:int", {
      implicit: true,
      implicitFirstChars: ["-", "+", ..."0123456789"],
      resolve: resolveYamlInteger,
      identify: (object) => Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !Object.is(object, -0),
      represent: (object) => object.toString(10)
    });
    YAML_FLOAT_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
    YAML_FLOAT_SPECIAL_PATTERN$1 = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
    floatCoreTag = defineScalarTag("tag:yaml.org,2002:float", {
      implicit: true,
      implicitFirstChars: ["-", "+", ".", ..."0123456789"],
      resolve: resolveYamlFloat$2,
      identify: (object) => Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || Object.is(object, -0)),
      represent: representYamlFloat$2
    });
    YAML_FLOAT_IMPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$");
    YAML_FLOAT_EXPLICIT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?[0-9]+(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|[-+]?\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
    floatJsonTag = defineScalarTag("tag:yaml.org,2002:float", {
      implicit: true,
      implicitFirstChars: ["-", ..."0123456789"],
      resolve: resolveYamlFloat$1,
      identify: (object) => Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || Object.is(object, -0)),
      represent: representYamlFloat$1
    });
    YAML_FLOAT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:(?:[0-9][0-9_]*)?\\.[0-9_]*)(?:[eE][-+][0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
    YAML_FLOAT_SPECIAL_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
    floatYaml11Tag = defineScalarTag("tag:yaml.org,2002:float", {
      implicit: true,
      implicitFirstChars: ["-", "+", ".", ..."0123456789"],
      resolve: resolveYamlFloat,
      identify: (object) => Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || Object.is(object, -0)),
      represent: representYamlFloat
    });
    mergeTag = defineScalarTag("tag:yaml.org,2002:merge", {
      implicit: true,
      implicitFirstChars: ["<"],
      resolve: (source2, isExplicit) => {
        if (source2 === "<<" || isExplicit && source2 === "") return MERGE_KEY;
        return NOT_RESOLVED;
      }
    });
    BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;
    binaryTag = defineScalarTag("tag:yaml.org,2002:binary", {
      resolve: resolveYamlBinary,
      identify: (object) => Object.prototype.toString.call(object) === "[object Uint8Array]",
      represent: representYamlBinary
    });
    YAML_DATE_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
    YAML_TIMESTAMP_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
    timestampTag = defineScalarTag("tag:yaml.org,2002:timestamp", {
      implicit: true,
      implicitFirstChars: [..."0123456789"],
      resolve: resolveYamlTimestamp,
      identify: (object) => object instanceof Date,
      represent: (object) => object.toISOString()
    });
    seqTag = defineSequenceTag("tag:yaml.org,2002:seq", {
      create: () => [],
      addItem: (container, item) => {
        container.push(item);
      },
      identify: Array.isArray
    });
    omapTag = defineSequenceTag("tag:yaml.org,2002:omap", {
      create: () => [],
      addItem: (container, item) => {
        if (Object.prototype.toString.call(item) !== "[object Object]") return "cannot resolve an ordered map item";
        const object = item;
        const itemKeys = Object.keys(object);
        if (itemKeys.length !== 1) return "cannot resolve an ordered map item";
        for (const existing of container) if (Object.prototype.hasOwnProperty.call(existing, itemKeys[0])) return "cannot resolve an ordered map item";
        container.push(object);
        return "";
      }
    });
    pairsTag = defineSequenceTag("tag:yaml.org,2002:pairs", {
      create: () => [],
      addItem: (container, item) => {
        if (item instanceof Map) {
          if (item.size !== 1) return "cannot resolve a pairs item";
          container.push(item.entries().next().value);
          return "";
        }
        if (Object.prototype.toString.call(item) !== "[object Object]") return "cannot resolve a pairs item";
        const object = item;
        const keys = Object.keys(object);
        if (keys.length !== 1) return "cannot resolve a pairs item";
        container.push([keys[0], object[keys[0]]]);
        return "";
      }
    });
    mapTag = defineMappingTag("tag:yaml.org,2002:map", {
      create: () => ({}),
      identify: isPlainObject,
      represent: (o) => {
        const map = /* @__PURE__ */ new Map();
        for (const key2 of Object.keys(o)) map.set(key2, o[key2]);
        return map;
      },
      addPair: (container, key2, value) => {
        if (key2 !== null && typeof key2 === "object") return "object-based map does not support complex keys";
        const normalizedKey = String(key2);
        if (normalizedKey === "__proto__") Object.defineProperty(container, normalizedKey, {
          value,
          enumerable: true,
          configurable: true,
          writable: true
        });
        else container[normalizedKey] = value;
        return "";
      },
      has: (container, key2) => {
        if (key2 !== null && typeof key2 === "object") return false;
        return Object.prototype.hasOwnProperty.call(container, String(key2));
      },
      keys: (container) => Object.keys(container),
      get: (container, key2) => container[String(key2)]
    });
    setTag = defineMappingTag("tag:yaml.org,2002:set", {
      create: () => /* @__PURE__ */ new Set(),
      identify: (data) => data instanceof Set,
      represent: (data) => {
        const map = /* @__PURE__ */ new Map();
        for (const key2 of data) map.set(key2, null);
        return map;
      },
      addPair: (container, key2, value) => {
        if (value !== null) return "cannot resolve a set item";
        container.add(key2);
        return "";
      },
      has: (container, key2) => container.has(key2),
      keys: (container) => container.keys(),
      get: () => null
    });
    Schema = class Schema2 {
      tags;
      implicitScalarTags;
      implicitScalarByFirstChar;
      implicitScalarAnyFirstChar;
      defaultScalarTag;
      defaultSequenceTag;
      defaultMappingTag;
      exact;
      prefix;
      constructor(tags) {
        const compiledTags = compileTags(tags);
        const implicitScalarTags = [];
        const exact = createTagDefinitionMap();
        const prefix = createTagDefinitionListMap();
        for (const tag of compiledTags) {
          if (tag.nodeKind === "scalar" && tag.implicit) {
            if (tag.matchByTagPrefix) throw new Error("Implicit scalar tags cannot match by tag prefix");
            implicitScalarTags.push(tag);
          }
          switch (tag.nodeKind) {
            case "scalar":
              if (tag.matchByTagPrefix) prefix.scalar.push(tag);
              else exact.scalar[tag.tagName] = tag;
              break;
            case "sequence":
              if (tag.matchByTagPrefix) prefix.sequence.push(tag);
              else exact.sequence[tag.tagName] = tag;
              break;
            case "mapping":
              if (tag.matchByTagPrefix) prefix.mapping.push(tag);
              else exact.mapping[tag.tagName] = tag;
              break;
          }
        }
        const implicitScalarAnyFirstChar = implicitScalarTags.filter((tag) => tag.implicitFirstChars === null);
        const keys = /* @__PURE__ */ new Set();
        for (const tag of implicitScalarTags) if (tag.implicitFirstChars !== null) for (const key2 of tag.implicitFirstChars) keys.add(key2);
        const implicitScalarByFirstChar = /* @__PURE__ */ new Map();
        for (const key2 of keys) implicitScalarByFirstChar.set(key2, implicitScalarTags.filter((tag) => tag.implicitFirstChars === null || tag.implicitFirstChars.indexOf(key2) !== -1));
        const defaultScalarTag = exact.scalar["tag:yaml.org,2002:str"];
        if (!defaultScalarTag) throw new Error("schema does not define the default scalar tag (tag:yaml.org,2002:str)");
        this.tags = compiledTags;
        this.implicitScalarTags = implicitScalarTags;
        this.implicitScalarByFirstChar = implicitScalarByFirstChar;
        this.implicitScalarAnyFirstChar = implicitScalarAnyFirstChar;
        this.defaultScalarTag = defaultScalarTag;
        this.defaultSequenceTag = exact.sequence["tag:yaml.org,2002:seq"];
        this.defaultMappingTag = exact.mapping["tag:yaml.org,2002:map"];
        this.exact = exact;
        this.prefix = prefix;
      }
      withTags(...tags) {
        let flatTags = [];
        for (const tag of tags) flatTags = flatTags.concat(tag);
        return new Schema2([...this.tags, ...flatTags]);
      }
    };
    FAILSAFE_SCHEMA = new Schema([strTag, seqTag, mapTag]);
    JSON_SCHEMA = new Schema([...FAILSAFE_SCHEMA.tags, nullJsonTag, boolJsonTag, intJsonTag, floatJsonTag]);
    CORE_SCHEMA = new Schema([...FAILSAFE_SCHEMA.tags, nullCoreTag, boolCoreTag, intCoreTag, floatCoreTag]);
    YAML11_SCHEMA = new Schema([...FAILSAFE_SCHEMA.tags, nullYaml11Tag, boolYaml11Tag, intYaml11Tag, floatYaml11Tag, timestampTag, mergeTag, binaryTag, omapTag, pairsTag, setTag]);
    realMapTag = defineMappingTag("tag:yaml.org,2002:map", {
      create: () => /* @__PURE__ */ new Map(),
      addPair: (container, key2, value) => {
        container.set(key2, value);
        return "";
      },
      has: (container, key2) => container.has(key2),
      keys: (container) => container.keys(),
      get: (container, key2) => container.get(key2),
      identify: (data) => data instanceof Map || isPlainObject(data),
      represent: (data) => {
        if (data instanceof Map) return data;
        const map = /* @__PURE__ */ new Map();
        const obj = data;
        for (const key2 of Object.keys(obj)) map.set(key2, obj[key2]);
        return map;
      }
    });
    legacyMapTag = defineMappingTag("tag:yaml.org,2002:map", {
      create: () => ({}),
      identify: isPlainObject,
      represent: (o) => {
        const map = /* @__PURE__ */ new Map();
        for (const key2 of Object.keys(o)) map.set(key2, o[key2]);
        return map;
      },
      addPair: (container, key2, value) => {
        const normalizedKey = normalizeKey(key2);
        if (normalizedKey === null) return "nested arrays are not supported inside keys";
        if (normalizedKey === "__proto__") Object.defineProperty(container, normalizedKey, {
          value,
          enumerable: true,
          configurable: true,
          writable: true
        });
        else container[normalizedKey] = value;
        return "";
      },
      has: (container, key2) => {
        const normalizedKey = normalizeKey(key2);
        return normalizedKey !== null && Object.prototype.hasOwnProperty.call(container, normalizedKey);
      },
      keys: (container) => Object.keys(container),
      get: (container, key2) => container[String(key2)]
    });
    DEFAULT_SNIPPET_OPTIONS = {
      maxLength: 79,
      indent: 1,
      linesBefore: 3,
      linesAfter: 2
    };
    YAMLException = class extends Error {
      reason;
      mark;
      constructor(reason, mark) {
        super();
        this.name = "YAMLException";
        this.reason = reason;
        this.mark = mark;
        this.message = formatError(this, false);
        if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
      }
      toString(compact) {
        return `${this.name}: ${formatError(this, compact)}`;
      }
    };
    NO_RANGE$3 = -1;
    simpleEscapeCheck = new Array(256);
    simpleEscapeMap = new Array(256);
    for (let i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }
    DEFAULT_TAG_HANDLERS = {
      "!": "!",
      "!!": "tag:yaml.org,2002:"
    };
    NO_RANGE$2 = -1;
    DEFAULT_CONSTRUCTOR_OPTIONS = {
      filename: "",
      schema: CORE_SCHEMA,
      json: false,
      maxMergeSeqLength: 20
    };
    NO_RANGE$1 = -1;
    HAS_OWN = Object.prototype.hasOwnProperty;
    CONTEXT_FLOW_IN = 1;
    CONTEXT_FLOW_OUT = 2;
    CONTEXT_BLOCK_IN = 3;
    CONTEXT_BLOCK_OUT = 4;
    PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
    PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
    NS_URI_CHAR = "(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\\-#;/?:@&=+$,_.!~*'()\\[\\]])";
    NS_TAG_CHAR = "(?:%[0-9A-Fa-f]{2}|[0-9A-Za-z\\-#;/?:@&=+$.~*'()_])";
    PATTERN_TAG_URI = new RegExp(`^(?:${NS_URI_CHAR})*$`);
    PATTERN_TAG_SUFFIX = new RegExp(`^(?:${NS_TAG_CHAR})+$`);
    PATTERN_TAG_PREFIX = new RegExp(`^(?:!(?:${NS_URI_CHAR})*|${NS_TAG_CHAR}(?:${NS_URI_CHAR})*)$`);
    DEFAULT_PARSER_OPTIONS = {
      filename: "",
      maxDepth: 100
    };
    DEFAULT_LOAD_OPTIONS = {
      ...DEFAULT_PARSER_OPTIONS,
      ...DEFAULT_CONSTRUCTOR_OPTIONS
    };
    ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0] = "\\0";
    ESCAPE_SEQUENCES[7] = "\\a";
    ESCAPE_SEQUENCES[8] = "\\b";
    ESCAPE_SEQUENCES[9] = "\\t";
    ESCAPE_SEQUENCES[10] = "\\n";
    ESCAPE_SEQUENCES[11] = "\\v";
    ESCAPE_SEQUENCES[12] = "\\f";
    ESCAPE_SEQUENCES[13] = "\\r";
    ESCAPE_SEQUENCES[27] = "\\e";
    ESCAPE_SEQUENCES[34] = '\\"';
    ESCAPE_SEQUENCES[92] = "\\\\";
    ESCAPE_SEQUENCES[133] = "\\N";
    ESCAPE_SEQUENCES[160] = "\\_";
    ESCAPE_SEQUENCES[8232] = "\\L";
    ESCAPE_SEQUENCES[8233] = "\\P";
    DEFAULT_PRESENTER_OPTIONS = {
      indent: 2,
      seqNoIndent: false,
      seqInlineFirst: true,
      sortKeys: false,
      lineWidth: 80,
      flowBracketPadding: false,
      flowSkipCommaSpace: false,
      flowSkipColonSpace: false,
      quoteFlowKeys: false,
      quoteStyle: "single",
      forceQuotes: false,
      tagBeforeAnchor: false
    };
    DEFAULT_DUMP_SCHEMA = YAML11_SCHEMA.withTags({
      ...intYaml11Tag,
      resolve: (source2, isExplicit, tagName) => {
        const result = intYaml11Tag.resolve(source2, isExplicit, tagName);
        return result === NOT_RESOLVED ? intCoreTag.resolve(source2, isExplicit, tagName) : result;
      }
    }, {
      ...floatYaml11Tag,
      resolve: (source2, isExplicit, tagName) => {
        const result = floatYaml11Tag.resolve(source2, isExplicit, tagName);
        return result === NOT_RESOLVED ? floatCoreTag.resolve(source2, isExplicit, tagName) : result;
      }
    });
    DEFAULT_DUMP_OPTIONS = {
      ...DEFAULT_PRESENTER_OPTIONS,
      schema: DEFAULT_DUMP_SCHEMA,
      skipInvalid: false,
      noRefs: false,
      flowLevel: -1,
      transform: () => {
      }
    };
  }
});

// node_modules/@prettier/cli/dist/config_prettier.js
import fs11 from "fs";
import path14 from "path";
import url2 from "url";
var Loaders, File2Loader, Ext2Loader, getPrettierConfig, getPrettierConfigs, getPrettierConfigsMap, getPrettierConfigsUp, getPrettierConfigResolved;
var init_config_prettier = __esm({
  "node_modules/@prettier/cli/dist/config_prettier.js"() {
    init_dist22();
    init_known();
    init_utils15();
    init_utils15();
    Loaders = {
      auto: (filePath) => {
        const basename = path14.basename(filePath);
        const ext = path14.extname(filePath).slice(1);
        const loader = File2Loader[basename] || Ext2Loader[ext] || File2Loader["default"];
        return loader(filePath);
      },
      js: async (filePath) => {
        const module = await import(url2.pathToFileURL(filePath).href);
        return module.default;
      },
      json: async (filePath) => {
        const fileContent = fs11.readFileSync(filePath, "utf8");
        const config = JSON.parse(fileContent);
        return config;
      },
      json5: async (filePath) => {
        const fileContent = fs11.readFileSync(filePath, "utf8");
        const JSON5 = (await Promise.resolve().then(() => (init_dist33(), dist_exports2))).default;
        const config = JSON5.parse(fileContent);
        return config;
      },
      package: async (filePath) => {
        const fileBuffer = fs11.readFileSync(filePath);
        if (!fileBuffer.includes("prettier"))
          return;
        const fileContent = fileBuffer.toString("utf8");
        const pkg = JSON.parse(fileContent);
        if (isObject4(pkg) && "prettier" in pkg) {
          const config = pkg.prettier;
          if (isObject4(config)) {
            return config;
          } else if (isString5(config)) {
            const modulePath = getModulePath(config, filePath);
            return Loaders.auto(modulePath);
          }
        }
      },
      toml: async (filePath) => {
        const fileContent = fs11.readFileSync(filePath, "utf8");
        const { parse: parse8 } = await Promise.resolve().then(() => (init_parse5(), parse_exports));
        return parse8(fileContent);
      },
      yaml: async (filePath) => {
        const { load: load2, JSON_SCHEMA: JSON_SCHEMA2 } = await Promise.resolve().then(() => (init_js_yaml(), js_yaml_exports));
        const fileContent = fs11.readFileSync(filePath, "utf8");
        return load2(fileContent, { schema: JSON_SCHEMA2 });
      }
    };
    File2Loader = {
      default: Loaders.yaml,
      "package.json": Loaders.package,
      ".prettierrc": Loaders.yaml,
      ".prettierrc.yml": Loaders.yaml,
      ".prettierrc.yaml": Loaders.yaml,
      ".prettierrc.json": Loaders.json,
      ".prettierrc.json5": Loaders.json5,
      ".prettierrc.toml": Loaders.toml,
      ".prettierrc.js": Loaders.js,
      ".prettierrc.ts": Loaders.js,
      ".prettierrc.cjs": Loaders.js,
      ".prettierrc.cts": Loaders.js,
      ".prettierrc.mjs": Loaders.js,
      ".prettierrc.mts": Loaders.js,
      "prettier.config.js": Loaders.js,
      "prettier.config.ts": Loaders.js,
      "prettier.config.cjs": Loaders.js,
      "prettier.config.cts": Loaders.js,
      "prettier.config.mjs": Loaders.js,
      "prettier.config.mts": Loaders.js
    };
    Ext2Loader = {
      default: Loaders.yaml,
      yml: Loaders.yaml,
      yaml: Loaders.yaml,
      json: Loaders.json,
      json5: Loaders.json5,
      toml: Loaders.toml,
      js: Loaders.js,
      cjs: Loaders.js,
      mjs: Loaders.js
    };
    getPrettierConfig = (folderPath, fileName) => {
      const filePath = fastJoinedPath(folderPath, fileName);
      if (!known_default.hasFilePath(filePath))
        return;
      const loader = File2Loader[fileName] || File2Loader["default"];
      const normalize3 = (config) => isObject4(config) ? { ...config, ...normalizePrettierOptions(config, folderPath) } : void 0;
      return loader(filePath).then(normalize3).catch(noop3);
    };
    getPrettierConfigs = dist_default13(async (folderPath, filesNames) => {
      const configsRaw = await Promise.all(filesNames.map((fileName) => getPrettierConfig(folderPath, fileName)));
      const configs = configsRaw.filter(isTruthy);
      if (!configs.length)
        return;
      return configs;
    });
    getPrettierConfigsMap = async (foldersPaths, filesNames) => {
      const configs = await Promise.all(foldersPaths.map((folderPath) => getPrettierConfigs(folderPath, filesNames)));
      const map = zipObjectUnless(foldersPaths, configs, isUndefined4);
      return map;
    };
    getPrettierConfigsUp = dist_default13(async (folderPath, filesNames) => {
      const config = (await getPrettierConfigs(folderPath, filesNames))?.[0];
      const folderPathUp = path14.dirname(folderPath);
      const configsUp = folderPath !== folderPathUp ? await getPrettierConfigsUp(folderPathUp, filesNames) : [];
      const configs = config ? [...configsUp, config] : configsUp;
      return configs;
    });
    getPrettierConfigResolved = async (filePath, filesNames) => {
      const folderPath = path14.dirname(filePath);
      const configs = await getPrettierConfigsUp(folderPath, filesNames);
      let resolved = {};
      for (let ci = 0, cl = configs.length; ci < cl; ci++) {
        const config = configs[ci];
        const formatOptions = omit(config, ["overrides"]);
        resolved = ci ? { ...resolved, ...formatOptions } : formatOptions;
        const overrides = config.overrides;
        if (overrides) {
          for (let oi = 0, ol = overrides.length; oi < ol; oi++) {
            const override = overrides[oi];
            const filePathRelative = fastRelativeChildPath(override.folder, filePath);
            if (!filePathRelative)
              continue;
            if (!dist_default19(override.filesPositive, filePathRelative))
              continue;
            if (dist_default19(override.filesNegative, filePathRelative))
              continue;
            resolved = { ...resolved, ...override.options };
          }
        }
      }
      return resolved;
    };
  }
});

// node_modules/dettle/dist/debounce.js
var debounce, debounce_default;
var init_debounce = __esm({
  "node_modules/dettle/dist/debounce.js"() {
    debounce = (fn, wait = 1, options) => {
      wait = Math.max(1, wait);
      const leading = options?.leading ?? false;
      const trailing = options?.trailing ?? true;
      const maxWait = Math.max(options?.maxWait ?? Infinity, wait);
      let args;
      let timeout;
      let timestampCall = 0;
      let timestampInvoke = 0;
      const getInstantData = () => {
        const timestamp = Date.now();
        const elapsedCall = timestamp - timestampCall;
        const elapsedInvoke = timestamp - timestampInvoke;
        const isInvoke = elapsedCall >= wait || elapsedInvoke >= maxWait;
        return [timestamp, isInvoke];
      };
      const invoke = (timestamp) => {
        timestampInvoke = timestamp;
        if (!args)
          return;
        const _args = args;
        args = void 0;
        fn.apply(void 0, _args);
      };
      const onCancel = () => {
        resetTimeout(0);
      };
      const onFlush = () => {
        if (!timeout)
          return;
        onCancel();
        invoke(Date.now());
      };
      const onLeading = (timestamp) => {
        timestampInvoke = timestamp;
        if (leading)
          return invoke(timestamp);
      };
      const onTrailing = (timestamp) => {
        if (trailing && args)
          return invoke(timestamp);
        args = void 0;
      };
      const onTimeout = () => {
        timeout = void 0;
        const [timestamp, isInvoking] = getInstantData();
        if (isInvoking)
          return onTrailing(timestamp);
        return updateTimeout(timestamp);
      };
      const updateTimeout = (timestamp) => {
        const elapsedCall = timestamp - timestampCall;
        const elapsedInvoke = timestamp - timestampInvoke;
        const remainingCall = wait - elapsedCall;
        const remainingInvoke = maxWait - elapsedInvoke;
        const ms = Math.min(remainingCall, remainingInvoke);
        return resetTimeout(ms);
      };
      const resetTimeout = (ms) => {
        if (timeout)
          clearTimeout(timeout);
        if (ms <= 0)
          return;
        timeout = setTimeout(onTimeout, ms);
      };
      const debounced = (...argsLatest) => {
        const [timestamp, isInvoking] = getInstantData();
        const hadTimeout = !!timeout;
        args = argsLatest;
        timestampCall = timestamp;
        if (isInvoking || !timeout)
          resetTimeout(wait);
        if (isInvoking) {
          if (!hadTimeout)
            return onLeading(timestamp);
          return invoke(timestamp);
        }
      };
      debounced.cancel = onCancel;
      debounced.flush = onFlush;
      return debounced;
    };
    debounce_default = debounce;
  }
});

// node_modules/dettle/dist/throttle.js
var init_throttle = __esm({
  "node_modules/dettle/dist/throttle.js"() {
    init_debounce();
  }
});

// node_modules/dettle/dist/index.js
var init_dist34 = __esm({
  "node_modules/dettle/dist/index.js"() {
    init_debounce();
    init_throttle();
  }
});

// node_modules/pioppo/dist/scheduler.js
var scheduler, scheduler_default;
var init_scheduler = __esm({
  "node_modules/pioppo/dist/scheduler.js"() {
    init_dist34();
    scheduler = (fn) => {
      const dfn = debounce_default(fn, 100, { maxWait: 6e4 });
      dfn();
      return dfn;
    };
    scheduler_default = scheduler;
  }
});

// node_modules/pioppo/dist/utils.js
var isTransportMultiple;
var init_utils18 = __esm({
  "node_modules/pioppo/dist/utils.js"() {
    isTransportMultiple = (transport) => {
      return "error" in transport && "warn" in transport && "info" in transport && "debug" in transport;
    };
  }
});

// node_modules/pioppo/dist/index.js
var Pioppo, dist_default29;
var init_dist35 = __esm({
  "node_modules/pioppo/dist/index.js"() {
    init_node2();
    init_scheduler();
    init_utils18();
    Pioppo = class {
      /* CONSTRUCTOR */
      constructor(options = {}) {
        this.errors = [];
        this.warns = [];
        this.infos = [];
        this.debugs = [];
        this.scheduled = false;
        this.scheduler = options.scheduler || scheduler_default;
        this.transports = options.transports || [console];
        node_default2(this.flush.bind(this));
      }
      /* LOGGING API */
      error(message) {
        this.errors.push(message);
        this.schedule();
      }
      warn(message) {
        this.warns.push(message);
        this.schedule();
      }
      info(message) {
        this.infos.push(message);
        this.schedule();
      }
      debug(message) {
        this.debugs.push(message);
        this.schedule();
      }
      /* SCHEDULING API */
      flush() {
        const errors = this.errors.length ? this.errors.join("\n") : void 0;
        const warns = this.warns.length ? this.warns.join("\n") : void 0;
        const infos = this.infos.length ? this.infos.join("\n") : void 0;
        const debugs = this.debugs.length ? this.debugs.join("\n") : void 0;
        if (errors)
          this.errors = [];
        if (warns)
          this.warns = [];
        if (infos)
          this.infos = [];
        if (debugs)
          this.debugs = [];
        for (let i = 0, l = this.transports.length; i < l; i++) {
          const transport = this.transports[i];
          if (isTransportMultiple(transport)) {
            if (errors)
              transport.error(errors);
            if (warns)
              transport.warn(warns);
            if (infos)
              transport.info(infos);
            if (debugs)
              transport.debug(debugs);
          } else {
            if (errors)
              transport(errors);
            if (warns)
              transport(warns);
            if (infos)
              transport(infos);
            if (debugs)
              transport(debugs);
          }
        }
      }
      schedule() {
        if (this.scheduled) {
          this.schedulerCb?.();
        } else {
          this.scheduled = true;
          this.schedulerCb = this.scheduler(() => {
            this.scheduled = false;
            this.flush();
          });
        }
      }
    };
    dist_default29 = Pioppo;
  }
});

// node_modules/stdin-blocker/dist/blocker.js
import process12 from "process";
import readline from "readline";
var Blocker, blocker_default;
var init_blocker = __esm({
  "node_modules/stdin-blocker/dist/blocker.js"() {
    Blocker = class {
      /* CONSTRUCTOR */
      constructor(stream = process12.stdin) {
        this.onKeypress = (_, key2) => {
          if (key2.ctrl && key2.name === "c") {
            return process12.exit(0);
          }
        };
        this.isBlocked = () => {
          return this.blocked;
        };
        this.block = () => {
          return this.toggle(true);
        };
        this.unblock = () => {
          return this.toggle(false);
        };
        this.toggle = (force = !this.blocked) => {
          this.blocked = force;
          if (force) {
            if (this.stream.isTTY) {
              this.stream.setRawMode(true);
            }
            this.interface = readline.createInterface({ input: this.stream, escapeCodeTimeout: 50 });
            readline.emitKeypressEvents(this.stream, this.interface);
            this.stream.on("keypress", this.onKeypress);
          } else {
            if (this.stream.isTTY) {
              this.stream.setRawMode(false);
            }
            if (this.interface) {
              this.interface.close();
            }
            this.stream.off("keypress", this.onKeypress);
          }
        };
        this.stream = stream;
        this.blocked = false;
      }
    };
    blocker_default = Blocker;
  }
});

// node_modules/stdin-blocker/dist/index.js
var blocker, dist_default30;
var init_dist36 = __esm({
  "node_modules/stdin-blocker/dist/index.js"() {
    init_blocker();
    blocker = new blocker_default();
    dist_default30 = blocker;
  }
});

// node_modules/tiny-cursor/dist/cursor.js
import process13 from "process";
var Cursor, cursor_default;
var init_cursor = __esm({
  "node_modules/tiny-cursor/dist/cursor.js"() {
    init_node2();
    Cursor = class {
      /* CONSTRUCTOR */
      constructor(stream = process13.stdout) {
        this.has = () => {
          return this.visible;
        };
        this.hide = () => {
          return this.toggle(false);
        };
        this.show = () => {
          return this.toggle(true);
        };
        this.toggle = (force = !this.visible) => {
          if (!this.stream.isTTY)
            return;
          this.visible = force;
          const command = force ? "\x1B[?25h" : "\x1B[?25l";
          this.stream.write(command);
        };
        this.stream = stream;
        this.visible = true;
        node_default2(this.show);
      }
    };
    cursor_default = Cursor;
  }
});

// node_modules/tiny-cursor/dist/index.js
var cursor, dist_default31;
var init_dist37 = __esm({
  "node_modules/tiny-cursor/dist/index.js"() {
    init_cursor();
    cursor = new cursor_default();
    dist_default31 = cursor;
  }
});

// node_modules/tiny-spinner/dist/constants.js
var FRAMES, FRAMES_INTERVAL, SYMBOL_ERROR, SYMBOL_SUCCESS, SYMBOL_WARNING;
var init_constants5 = __esm({
  "node_modules/tiny-spinner/dist/constants.js"() {
    FRAMES = ["-", "\\", "|", "/"];
    FRAMES_INTERVAL = 40;
    SYMBOL_ERROR = "\u2716";
    SYMBOL_SUCCESS = "\u2714";
    SYMBOL_WARNING = "!";
  }
});

// node_modules/ansi-truncate/dist/constants.js
var ANSI_STANDARD_RE, ANSI_LINK_RE, ELLIPSIS, ELLIPSIS_WIDTH, RESET_STANDARD, RESET_LINK;
var init_constants6 = __esm({
  "node_modules/ansi-truncate/dist/constants.js"() {
    ANSI_STANDARD_RE = /[\x1B\x9B]/;
    ANSI_LINK_RE = /\x1B\]8;/;
    ELLIPSIS = "\u2026";
    ELLIPSIS_WIDTH = 1;
    RESET_STANDARD = "\x1B[0m";
    RESET_LINK = "\x1B]8;;\x07";
  }
});

// node_modules/ansi-truncate/dist/index.js
var truncate, dist_default32;
var init_dist38 = __esm({
  "node_modules/ansi-truncate/dist/index.js"() {
    init_dist9();
    init_constants6();
    init_constants6();
    init_constants6();
    truncate = (input, width, options) => {
      const limit = width;
      const ellipsis = options?.ellipsis ?? ELLIPSIS;
      const ellipsisWidth = options?.ellipsisWidth ?? (ellipsis === ELLIPSIS ? ELLIPSIS_WIDTH : void 0);
      const { index, ellipsed, truncated } = dist_default8(input, { limit, ellipsis, ellipsisWidth });
      if (!truncated)
        return input;
      const slice = input.slice(0, index);
      const isStandardResettable = ANSI_STANDARD_RE.test(slice);
      const isLinkResettable = ANSI_LINK_RE.test(slice);
      return `${slice}${ellipsed ? ellipsis : ""}${isStandardResettable ? RESET_STANDARD : ""}${isLinkResettable ? RESET_LINK : ""}`;
    };
    dist_default32 = truncate;
  }
});

// node_modules/tiny-truncate/dist/index.js
var truncate2, dist_default33;
var init_dist39 = __esm({
  "node_modules/tiny-truncate/dist/index.js"() {
    init_dist38();
    truncate2 = (str, options) => {
      const width = (globalThis.process?.stdout?.getWindowSize?.()?.[0] || 25) - 1;
      return dist_default32(str, width, options);
    };
    dist_default33 = truncate2;
  }
});

// node_modules/tiny-spinner/dist/utils.js
var isTTY, writeLine;
var init_utils19 = __esm({
  "node_modules/tiny-spinner/dist/utils.js"() {
    init_dist39();
    isTTY = () => {
      return !!globalThis.process?.stdout?.isTTY;
    };
    writeLine = (line2) => {
      line2 = dist_default33(line2);
      const process19 = globalThis.process;
      if (process19) {
        const isTerminal = /(\r?\n|\r)$/.test(line2);
        process19.stdout?.cursorTo?.(0);
        process19.stdout?.write?.(line2.trim());
        process19.stdout?.clearLine?.(1);
        process19.stdout?.write?.(isTerminal ? "\r\n" : "");
      } else {
        console.log(line2);
      }
    };
  }
});

// node_modules/tiny-spinner/dist/index.js
var Spinner, dist_default34;
var init_dist40 = __esm({
  "node_modules/tiny-spinner/dist/index.js"() {
    init_dist36();
    init_dist5();
    init_dist37();
    init_constants5();
    init_utils19();
    Spinner = class {
      constructor() {
        this.iteration = 0;
        this.message = "";
        this.render = () => {
          if (!isTTY())
            return;
          const frame = FRAMES[this.iteration++ % FRAMES.length];
          const line2 = `${dist_default4.cyan(frame)} ${this.message}`;
          writeLine(line2);
        };
        this.start = (message) => {
          if (this.intervalId)
            return;
          this.message = message;
          dist_default30.block();
          dist_default31.hide();
          this.intervalId = setInterval(this.render, FRAMES_INTERVAL);
        };
        this.update = (message) => {
          this.message = message;
        };
        this.warning = (message) => {
          return this.stop(`${dist_default4.yellow.bold(SYMBOL_WARNING)} ${message}`);
        };
        this.success = (message) => {
          return this.stop(`${dist_default4.green(SYMBOL_SUCCESS)} ${message}`);
        };
        this.error = (message) => {
          return this.stop(`${dist_default4.red(SYMBOL_ERROR)} ${message}`);
        };
        this.stop = (message = "") => {
          if (!this.intervalId)
            return;
          dist_default30.unblock();
          dist_default31.show();
          clearInterval(this.intervalId);
          const line2 = message ? `${message}
` : "";
          writeLine(line2);
        };
      }
    };
    dist_default34 = Spinner;
  }
});

// node_modules/@prettier/cli/dist/logger_transports.js
import process14 from "process";
function transportToStderr(message) {
  process14.stderr.write(message);
  process14.stderr.write("\n");
}
function transportToStdout(message) {
  process14.stdout.write(message);
  process14.stdout.write("\n");
}
var init_logger_transports = __esm({
  "node_modules/@prettier/cli/dist/logger_transports.js"() {
  }
});

// node_modules/@prettier/cli/dist/logger.js
var Logger2, logger_default2;
var init_logger2 = __esm({
  "node_modules/@prettier/cli/dist/logger.js"() {
    init_dist35();
    init_dist14();
    init_dist40();
    init_logger_transports();
    init_utils15();
    Logger2 = class {
      constructor(level, stream) {
        this.levels = ["debug", "log", "warn", "error", "silent"];
        this.absract = (message, strength) => {
          if (strength < this.strength)
            return;
          message = resolve2(message);
          if (!message)
            return;
          this.pioppo.info(message);
        };
        this.debug = (message) => {
          this.absract(message, 0);
        };
        this.log = (message) => {
          this.absract(message, 1);
        };
        this.warn = (message) => {
          this.absract(message, 2);
        };
        this.error = (message) => {
          this.absract(message, 3);
        };
        this.silent = (message) => {
          this.absract(message, 4);
        };
        this.always = (message) => {
          this.absract(message, Infinity);
        };
        this.prefixed = {
          abstract: (prefix, message, strength) => {
            if (strength < this.strength)
              return;
            message = resolve2(message);
            if (!message)
              return;
            const lines = message.split(/\r?\n|\r/g);
            const linesPrefixed = lines.map((line2) => `${prefix} ${line2}`);
            this.pioppo.info(linesPrefixed.join("\n"));
          },
          debug: (message) => {
            const prefix = `[${dist_default4.magenta("debug")}]`;
            this.prefixed.abstract(prefix, message, 0);
          },
          log: (message) => {
            const prefix = `[${dist_default4.cyan("log")}]`;
            this.prefixed.abstract(prefix, message, 1);
          },
          warn: (message) => {
            const prefix = `[${dist_default4.yellow("warn")}]`;
            this.prefixed.abstract(prefix, message, 2);
          },
          error: (message) => {
            const prefix = `[${dist_default4.red("error")}]`;
            this.prefixed.abstract(prefix, message, 3);
          },
          silent: (message) => {
            const prefix = `[${dist_default4.dim("silent")}]`;
            this.prefixed.abstract(prefix, message, 4);
          },
          always: (message) => {
            this.absract(message, Infinity);
          }
        };
        this.spinner = {
          abstract: (strength) => {
            if (strength < this.strength)
              return;
            return new dist_default34();
          },
          debug: () => {
            return this.spinner.abstract(0);
          },
          log: () => {
            return this.spinner.abstract(1);
          },
          warn: () => {
            return this.spinner.abstract(2);
          },
          error: () => {
            return this.spinner.abstract(3);
          },
          silent: () => {
            return this.spinner.abstract(4);
          },
          always: () => {
            return this.spinner.abstract(Infinity);
          }
        };
        const transports = stream === "stderr" ? [transportToStderr] : [transportToStdout];
        this.level = level;
        this.pioppo = new dist_default29({ transports });
        this.strength = this.levels.indexOf(level);
      }
    };
    logger_default2 = Logger2;
  }
});

// node_modules/stubborn-utils/dist/attemptify_async.js
var attemptifyAsync, attemptify_async_default;
var init_attemptify_async = __esm({
  "node_modules/stubborn-utils/dist/attemptify_async.js"() {
    attemptifyAsync = (fn, options) => {
      const { onError } = options;
      return function attemptified(...args) {
        return fn.apply(void 0, args).catch(onError);
      };
    };
    attemptify_async_default = attemptifyAsync;
  }
});

// node_modules/stubborn-utils/dist/attemptify_sync.js
var attemptifySync, attemptify_sync_default;
var init_attemptify_sync = __esm({
  "node_modules/stubborn-utils/dist/attemptify_sync.js"() {
    attemptifySync = (fn, options) => {
      const { onError } = options;
      return function attemptified(...args) {
        try {
          return fn.apply(void 0, args);
        } catch (error) {
          return onError(error);
        }
      };
    };
    attemptify_sync_default = attemptifySync;
  }
});

// node_modules/stubborn-utils/dist/constants.js
var RETRY_INTERVAL;
var init_constants7 = __esm({
  "node_modules/stubborn-utils/dist/constants.js"() {
    RETRY_INTERVAL = 250;
  }
});

// node_modules/stubborn-utils/dist/retryify_async.js
var retryifyAsync, retryify_async_default;
var init_retryify_async = __esm({
  "node_modules/stubborn-utils/dist/retryify_async.js"() {
    init_constants7();
    retryifyAsync = (fn, options) => {
      const { isRetriable } = options;
      return function retryified(options2) {
        const { timeout } = options2;
        const interval = options2.interval ?? RETRY_INTERVAL;
        const timestamp = Date.now() + timeout;
        return function attempt3(...args) {
          return fn.apply(void 0, args).catch((error) => {
            if (!isRetriable(error))
              throw error;
            if (Date.now() >= timestamp)
              throw error;
            const delay = Math.round(interval * Math.random());
            if (delay > 0) {
              const delayPromise = new Promise((resolve4) => setTimeout(resolve4, delay));
              return delayPromise.then(() => attempt3.apply(void 0, args));
            } else {
              return attempt3.apply(void 0, args);
            }
          });
        };
      };
    };
    retryify_async_default = retryifyAsync;
  }
});

// node_modules/stubborn-utils/dist/retryify_sync.js
var retryifySync, retryify_sync_default;
var init_retryify_sync = __esm({
  "node_modules/stubborn-utils/dist/retryify_sync.js"() {
    retryifySync = (fn, options) => {
      const { isRetriable } = options;
      return function retryified(options2) {
        const { timeout } = options2;
        const timestamp = Date.now() + timeout;
        return function attempt3(...args) {
          while (true) {
            try {
              return fn.apply(void 0, args);
            } catch (error) {
              if (!isRetriable(error))
                throw error;
              if (Date.now() >= timestamp)
                throw error;
              continue;
            }
          }
        };
      };
    };
    retryify_sync_default = retryifySync;
  }
});

// node_modules/stubborn-utils/dist/index.js
var init_dist41 = __esm({
  "node_modules/stubborn-utils/dist/index.js"() {
    init_attemptify_async();
    init_attemptify_sync();
    init_retryify_async();
    init_retryify_sync();
  }
});

// node_modules/stubborn-fs/dist/handlers.js
var Handlers, handlers_default;
var init_handlers = __esm({
  "node_modules/stubborn-fs/dist/handlers.js"() {
    init_constants8();
    Handlers = {
      /* API */
      isChangeErrorOk: (error) => {
        if (!Handlers.isNodeError(error))
          return false;
        const { code } = error;
        if (code === "ENOSYS")
          return true;
        if (!IS_USER_ROOT && (code === "EINVAL" || code === "EPERM"))
          return true;
        return false;
      },
      isNodeError: (error) => {
        return error instanceof Error;
      },
      isRetriableError: (error) => {
        if (!Handlers.isNodeError(error))
          return false;
        const { code } = error;
        if (code === "EMFILE" || code === "ENFILE" || code === "EAGAIN" || code === "EBUSY" || code === "EACCESS" || code === "EACCES" || code === "EACCS" || code === "EPERM")
          return true;
        return false;
      },
      onChangeError: (error) => {
        if (!Handlers.isNodeError(error))
          throw error;
        if (Handlers.isChangeErrorOk(error))
          return;
        throw error;
      }
    };
    handlers_default = Handlers;
  }
});

// node_modules/stubborn-fs/dist/constants.js
import process15 from "process";
var ATTEMPTIFY_CHANGE_ERROR_OPTIONS, ATTEMPTIFY_NOOP_OPTIONS, IS_USER_ROOT, RETRYIFY_OPTIONS;
var init_constants8 = __esm({
  "node_modules/stubborn-fs/dist/constants.js"() {
    init_handlers();
    ATTEMPTIFY_CHANGE_ERROR_OPTIONS = {
      onError: handlers_default.onChangeError
    };
    ATTEMPTIFY_NOOP_OPTIONS = {
      onError: () => void 0
    };
    IS_USER_ROOT = process15.getuid ? !process15.getuid() : false;
    RETRYIFY_OPTIONS = {
      isRetriable: handlers_default.isRetriableError
    };
  }
});

// node_modules/stubborn-fs/dist/index.js
import fs12 from "fs";
import { promisify } from "util";
var FS, dist_default35;
var init_dist42 = __esm({
  "node_modules/stubborn-fs/dist/index.js"() {
    init_dist41();
    init_dist41();
    init_constants8();
    FS = {
      attempt: {
        /* ASYNC */
        chmod: attemptify_async_default(promisify(fs12.chmod), ATTEMPTIFY_CHANGE_ERROR_OPTIONS),
        chown: attemptify_async_default(promisify(fs12.chown), ATTEMPTIFY_CHANGE_ERROR_OPTIONS),
        close: attemptify_async_default(promisify(fs12.close), ATTEMPTIFY_NOOP_OPTIONS),
        fsync: attemptify_async_default(promisify(fs12.fsync), ATTEMPTIFY_NOOP_OPTIONS),
        mkdir: attemptify_async_default(promisify(fs12.mkdir), ATTEMPTIFY_NOOP_OPTIONS),
        realpath: attemptify_async_default(promisify(fs12.realpath), ATTEMPTIFY_NOOP_OPTIONS),
        stat: attemptify_async_default(promisify(fs12.stat), ATTEMPTIFY_NOOP_OPTIONS),
        unlink: attemptify_async_default(promisify(fs12.unlink), ATTEMPTIFY_NOOP_OPTIONS),
        /* SYNC */
        chmodSync: attemptify_sync_default(fs12.chmodSync, ATTEMPTIFY_CHANGE_ERROR_OPTIONS),
        chownSync: attemptify_sync_default(fs12.chownSync, ATTEMPTIFY_CHANGE_ERROR_OPTIONS),
        closeSync: attemptify_sync_default(fs12.closeSync, ATTEMPTIFY_NOOP_OPTIONS),
        existsSync: attemptify_sync_default(fs12.existsSync, ATTEMPTIFY_NOOP_OPTIONS),
        fsyncSync: attemptify_sync_default(fs12.fsync, ATTEMPTIFY_NOOP_OPTIONS),
        mkdirSync: attemptify_sync_default(fs12.mkdirSync, ATTEMPTIFY_NOOP_OPTIONS),
        realpathSync: attemptify_sync_default(fs12.realpathSync, ATTEMPTIFY_NOOP_OPTIONS),
        statSync: attemptify_sync_default(fs12.statSync, ATTEMPTIFY_NOOP_OPTIONS),
        unlinkSync: attemptify_sync_default(fs12.unlinkSync, ATTEMPTIFY_NOOP_OPTIONS)
      },
      retry: {
        /* ASYNC */
        close: retryify_async_default(promisify(fs12.close), RETRYIFY_OPTIONS),
        fsync: retryify_async_default(promisify(fs12.fsync), RETRYIFY_OPTIONS),
        open: retryify_async_default(promisify(fs12.open), RETRYIFY_OPTIONS),
        readFile: retryify_async_default(promisify(fs12.readFile), RETRYIFY_OPTIONS),
        rename: retryify_async_default(promisify(fs12.rename), RETRYIFY_OPTIONS),
        stat: retryify_async_default(promisify(fs12.stat), RETRYIFY_OPTIONS),
        write: retryify_async_default(promisify(fs12.write), RETRYIFY_OPTIONS),
        writeFile: retryify_async_default(promisify(fs12.writeFile), RETRYIFY_OPTIONS),
        /* SYNC */
        closeSync: retryify_sync_default(fs12.closeSync, RETRYIFY_OPTIONS),
        fsyncSync: retryify_sync_default(fs12.fsyncSync, RETRYIFY_OPTIONS),
        openSync: retryify_sync_default(fs12.openSync, RETRYIFY_OPTIONS),
        readFileSync: retryify_sync_default(fs12.readFileSync, RETRYIFY_OPTIONS),
        renameSync: retryify_sync_default(fs12.renameSync, RETRYIFY_OPTIONS),
        statSync: retryify_sync_default(fs12.statSync, RETRYIFY_OPTIONS),
        writeSync: retryify_sync_default(fs12.writeSync, RETRYIFY_OPTIONS),
        writeFileSync: retryify_sync_default(fs12.writeFileSync, RETRYIFY_OPTIONS)
      }
    };
    dist_default35 = FS;
  }
});

// node_modules/atomically/dist/constants.js
import process16 from "process";
var DEFAULT_ENCODING, DEFAULT_FILE_MODE, DEFAULT_FOLDER_MODE, DEFAULT_READ_OPTIONS, DEFAULT_WRITE_OPTIONS, DEFAULT_USER_UID, DEFAULT_USER_GID, DEFAULT_INTERVAL_ASYNC, DEFAULT_TIMEOUT_ASYNC, IS_POSIX, IS_USER_ROOT2, LIMIT_BASENAME_LENGTH;
var init_constants9 = __esm({
  "node_modules/atomically/dist/constants.js"() {
    DEFAULT_ENCODING = "utf8";
    DEFAULT_FILE_MODE = 438;
    DEFAULT_FOLDER_MODE = 511;
    DEFAULT_READ_OPTIONS = {};
    DEFAULT_WRITE_OPTIONS = {};
    DEFAULT_USER_UID = process16.geteuid ? process16.geteuid() : -1;
    DEFAULT_USER_GID = process16.getegid ? process16.getegid() : -1;
    DEFAULT_INTERVAL_ASYNC = 200;
    DEFAULT_TIMEOUT_ASYNC = 7500;
    IS_POSIX = !!process16.getuid;
    IS_USER_ROOT2 = process16.getuid ? !process16.getuid() : false;
    LIMIT_BASENAME_LENGTH = 128;
  }
});

// node_modules/atomically/dist/utils/lang.js
var isException, isFunction4, isString8, isUndefined6;
var init_lang = __esm({
  "node_modules/atomically/dist/utils/lang.js"() {
    isException = (value) => {
      return value instanceof Error && "code" in value;
    };
    isFunction4 = (value) => {
      return typeof value === "function";
    };
    isString8 = (value) => {
      return typeof value === "string";
    };
    isUndefined6 = (value) => {
      return value === void 0;
    };
  }
});

// node_modules/atomically/dist/utils/scheduler.js
var Queues, Scheduler, scheduler_default2;
var init_scheduler2 = __esm({
  "node_modules/atomically/dist/utils/scheduler.js"() {
    Queues = {};
    Scheduler = {
      /* API */
      next: (id) => {
        const queue = Queues[id];
        if (!queue)
          return;
        queue.shift();
        const job = queue[0];
        if (job) {
          job(() => Scheduler.next(id));
        } else {
          delete Queues[id];
        }
      },
      schedule: (id) => {
        return new Promise((resolve4) => {
          let queue = Queues[id];
          if (!queue)
            queue = Queues[id] = [];
          queue.push(resolve4);
          if (queue.length > 1)
            return;
          resolve4(() => Scheduler.next(id));
        });
      }
    };
    scheduler_default2 = Scheduler;
  }
});

// node_modules/atomically/dist/utils/temp.js
import path15 from "path";
var Temp, temp_default;
var init_temp = __esm({
  "node_modules/atomically/dist/utils/temp.js"() {
    init_dist42();
    init_node2();
    init_constants9();
    Temp = {
      /* VARIABLES */
      store: {},
      // filePath => purge
      /* API */
      create: (filePath) => {
        const randomness = `000000${Math.floor(Math.random() * 16777215).toString(16)}`.slice(-6);
        const timestamp = Date.now().toString().slice(-10);
        const prefix = "tmp-";
        const suffix = `.${prefix}${timestamp}${randomness}`;
        const tempPath = `${filePath}${suffix}`;
        return tempPath;
      },
      get: (filePath, creator, purge2 = true) => {
        const tempPath = Temp.truncate(creator(filePath));
        if (tempPath in Temp.store)
          return Temp.get(filePath, creator, purge2);
        Temp.store[tempPath] = purge2;
        const disposer = () => delete Temp.store[tempPath];
        return [tempPath, disposer];
      },
      purge: (filePath) => {
        if (!Temp.store[filePath])
          return;
        delete Temp.store[filePath];
        dist_default35.attempt.unlink(filePath);
      },
      purgeSync: (filePath) => {
        if (!Temp.store[filePath])
          return;
        delete Temp.store[filePath];
        dist_default35.attempt.unlinkSync(filePath);
      },
      purgeSyncAll: () => {
        for (const filePath in Temp.store) {
          Temp.purgeSync(filePath);
        }
      },
      truncate: (filePath) => {
        const basename = path15.basename(filePath);
        if (basename.length <= LIMIT_BASENAME_LENGTH)
          return filePath;
        const truncable = /^(\.?)(.*?)((?:\.[^.]+)?(?:\.tmp-\d{10}[a-f0-9]{6})?)$/.exec(basename);
        if (!truncable)
          return filePath;
        const truncationLength = basename.length - LIMIT_BASENAME_LENGTH;
        return `${filePath.slice(0, -basename.length)}${truncable[1]}${truncable[2].slice(0, -truncationLength)}${truncable[3]}`;
      }
    };
    node_default2(Temp.purgeSyncAll);
    temp_default = Temp;
  }
});

// node_modules/atomically/dist/index.js
import { once as once2 } from "events";
import { createWriteStream } from "fs";
import path16 from "path";
import { Readable } from "stream";
function readFile(filePath, options = DEFAULT_READ_OPTIONS) {
  if (isString8(options))
    return readFile(filePath, { encoding: options });
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_ASYNC;
  const retryOptions = { timeout, interval: DEFAULT_INTERVAL_ASYNC };
  return dist_default35.retry.readFile(retryOptions)(filePath, options);
}
function writeFile(filePath, data, options, callback) {
  if (isFunction4(options))
    return writeFile(filePath, data, DEFAULT_WRITE_OPTIONS, options);
  const promise = writeFileAsync(filePath, data, options);
  if (callback)
    promise.then(callback, callback);
  return promise;
}
async function writeFileAsync(filePath, data, options = DEFAULT_WRITE_OPTIONS) {
  if (isString8(options))
    return writeFileAsync(filePath, data, { encoding: options });
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_ASYNC;
  const retryOptions = { timeout, interval: DEFAULT_INTERVAL_ASYNC };
  let schedulerCustomDisposer = null;
  let schedulerDisposer = null;
  let tempDisposer = null;
  let tempPath = null;
  let fd = null;
  try {
    if (options.schedule)
      schedulerCustomDisposer = await options.schedule(filePath);
    schedulerDisposer = await scheduler_default2.schedule(filePath);
    const filePathReal = await dist_default35.attempt.realpath(filePath);
    const filePathExists = !!filePathReal;
    filePath = filePathReal || filePath;
    [tempPath, tempDisposer] = temp_default.get(filePath, options.tmpCreate || temp_default.create, !(options.tmpPurge === false));
    const useStatChown = IS_POSIX && isUndefined6(options.chown);
    const useStatMode = isUndefined6(options.mode);
    if (filePathExists && (useStatChown || useStatMode)) {
      const stats = await dist_default35.attempt.stat(filePath);
      if (stats) {
        options = { ...options };
        if (useStatChown) {
          options.chown = { uid: stats.uid, gid: stats.gid };
        }
        if (useStatMode) {
          options.mode = stats.mode;
        }
      }
    }
    if (!filePathExists) {
      const parentPath = path16.dirname(filePath);
      await dist_default35.attempt.mkdir(parentPath, {
        mode: DEFAULT_FOLDER_MODE,
        recursive: true
      });
    }
    fd = await dist_default35.retry.open(retryOptions)(tempPath, "w", options.mode || DEFAULT_FILE_MODE);
    if (options.tmpCreated) {
      options.tmpCreated(tempPath);
    }
    if (isString8(data)) {
      await dist_default35.retry.write(retryOptions)(fd, data, 0, options.encoding || DEFAULT_ENCODING);
    } else if (data instanceof Readable) {
      const writeStream = createWriteStream(tempPath, { fd, autoClose: false });
      const finishPromise = once2(writeStream, "finish");
      data.pipe(writeStream);
      await finishPromise;
    } else if (!isUndefined6(data)) {
      await dist_default35.retry.write(retryOptions)(fd, data, 0, data.length, 0);
    }
    if (options.fsync !== false) {
      if (options.fsyncWait !== false) {
        await dist_default35.retry.fsync(retryOptions)(fd);
      } else {
        dist_default35.attempt.fsync(fd);
      }
    }
    await dist_default35.retry.close(retryOptions)(fd);
    fd = null;
    if (options.chown && (options.chown.uid !== DEFAULT_USER_UID || options.chown.gid !== DEFAULT_USER_GID)) {
      await dist_default35.attempt.chown(tempPath, options.chown.uid, options.chown.gid);
    }
    if (options.mode && options.mode !== DEFAULT_FILE_MODE) {
      await dist_default35.attempt.chmod(tempPath, options.mode);
    }
    try {
      await dist_default35.retry.rename(retryOptions)(tempPath, filePath);
    } catch (error) {
      if (!isException(error))
        throw error;
      if (error.code !== "ENAMETOOLONG")
        throw error;
      await dist_default35.retry.rename(retryOptions)(tempPath, temp_default.truncate(filePath));
    }
    tempDisposer();
    tempPath = null;
  } finally {
    if (fd)
      await dist_default35.attempt.close(fd);
    if (tempPath)
      temp_default.purge(tempPath);
    if (schedulerCustomDisposer)
      schedulerCustomDisposer();
    if (schedulerDisposer)
      schedulerDisposer();
  }
}
var init_dist43 = __esm({
  "node_modules/atomically/dist/index.js"() {
    init_dist42();
    init_constants9();
    init_lang();
    init_scheduler2();
    init_temp();
  }
});

// node_modules/@prettier/cli/dist/prettier_cached.js
function makeCached(options, cache3, prettier) {
  return {
    check: prettier.check,
    format: prettier.format,
    write: prettier.write,
    async checkWithPath(filePath, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      const data = await cache3.get(filePath);
      if (isBoolean2(data?.formatted))
        return data.formatted;
      const fileContent = data?.content?.toString() ?? await readFile(filePath, "utf8");
      const formatted = await prettier.check(filePath, fileContent, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions);
      await data?.save(formatted, fileContent);
      return formatted;
    },
    async formatWithPath(filePath, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      const data = await cache3.get(filePath);
      const fileContent = data?.content?.toString() ?? await readFile(filePath, "utf8");
      if (data?.formatted)
        return fileContent;
      const fileContentFormatted = await prettier.format(filePath, fileContent, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions);
      if (fileContent === fileContentFormatted) {
        await data?.save(true, fileContent);
        return fileContent;
      } else {
        await data?.save(false, fileContent);
        return fileContentFormatted;
      }
    },
    async writeWithPath(filePath, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      const data = await cache3.get(filePath);
      if (data?.formatted)
        return true;
      const fileContent = data?.content?.toString() ?? await readFile(filePath, "utf8");
      const fileContentFormatted = await prettier.format(filePath, fileContent, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions);
      if (fileContent === fileContentFormatted) {
        await data?.save(true, fileContent);
        return true;
      } else {
        await writeFile(filePath, fileContentFormatted);
        await data?.save(true, fileContentFormatted);
        return false;
      }
    }
  };
}
var init_prettier_cached = __esm({
  "node_modules/@prettier/cli/dist/prettier_cached.js"() {
    init_dist43();
    init_utils15();
  }
});

// node_modules/isoconcurrency/dist/node.js
import os3 from "os";
var concurrency, node_default3;
var init_node3 = __esm({
  "node_modules/isoconcurrency/dist/node.js"() {
    concurrency = os3.cpus().length || 1;
    node_default3 = concurrency;
  }
});

// node_modules/isotimer/dist/utils.js
var sanitizeMs;
var init_utils20 = __esm({
  "node_modules/isotimer/dist/utils.js"() {
    sanitizeMs = (ms) => {
      return Math.max(0, Math.min(ms, 2147483647));
    };
  }
});

// node_modules/isotimer/dist/node/interval.js
import { setInterval as setInterval2, clearInterval as clearInterval2 } from "timers";
var cache2, set2, clear, unref;
var init_interval = __esm({
  "node_modules/isotimer/dist/node/interval.js"() {
    init_utils20();
    cache2 = /* @__PURE__ */ new Map();
    set2 = (callback, ms = 0, ...args) => {
      ms = sanitizeMs(ms);
      const timer = setInterval2(callback, ms, ...args);
      const id = +timer;
      cache2.set(id, timer);
      return id;
    };
    clear = (id) => {
      cache2.delete(id);
      clearInterval2(id);
    };
    unref = (id) => {
      cache2.get(id)?.unref();
    };
  }
});

// node_modules/isotimer/dist/node/index.js
var init_node4 = __esm({
  "node_modules/isotimer/dist/node/index.js"() {
    init_interval();
  }
});

// node_modules/worktank/dist/worker/error.js
var WorkerError, error_default;
var init_error2 = __esm({
  "node_modules/worktank/dist/worker/error.js"() {
    WorkerError = class extends Error {
      /* CONSTRUCTOR */
      constructor(name, message) {
        super(message);
        this.name = `WorkTankWorkerError (${name})`;
        this.message = message;
      }
    };
    error_default = WorkerError;
  }
});

// node_modules/webworker-shim/dist/node.js
import { Worker } from "worker_threads";
var __classPrivateFieldSet2, __classPrivateFieldGet2, _WorkerShim_worker, WorkerShim, node_default4;
var init_node5 = __esm({
  "node_modules/webworker-shim/dist/node.js"() {
    __classPrivateFieldSet2 = function(receiver, state, value, kind, f) {
      if (kind === "m") throw new TypeError("Private method is not writable");
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    __classPrivateFieldGet2 = function(receiver, state, kind, f) {
      if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    WorkerShim = class extends EventTarget {
      /* CONSTRUCTOR */
      constructor(url3, options) {
        super();
        _WorkerShim_worker.set(this, void 0);
        url3 = url3.trim();
        const prefix = "data:text/javascript;charset=utf-8,";
        if (!url3.startsWith(prefix))
          throw new Error(`Only urls that start with "${prefix}" are supported`);
        const setup = encodeURIComponent('import {parentPort} from "node:worker_threads";globalThis.self = globalThis;globalThis.addEventListener = parentPort.on.bind ( parentPort );globalThis.postMessage = parentPort.postMessage.bind ( parentPort );');
        const module = url3.slice(prefix.length);
        const code = `${prefix}${setup}${module}`;
        __classPrivateFieldSet2(this, _WorkerShim_worker, new Worker(new URL(code)), "f");
        __classPrivateFieldGet2(this, _WorkerShim_worker, "f").on("message", (data) => {
          const event = new Event("message");
          event["data"] = data;
          this.dispatchEvent(event);
        });
        __classPrivateFieldGet2(this, _WorkerShim_worker, "f").on("error", (error) => {
          const event = new Event("error");
          event["data"] = error;
          this.dispatchEvent(event);
        });
        __classPrivateFieldGet2(this, _WorkerShim_worker, "f").on("exit", (exitCode) => {
          const event = new Event("close");
          event["data"] = Number(exitCode ?? 0);
          this.dispatchEvent(event);
        });
      }
      /* API */
      postMessage(message, transfer) {
        const event = new Event("message");
        event["data"] = message;
        __classPrivateFieldGet2(this, _WorkerShim_worker, "f").postMessage(event, transfer);
      }
      terminate() {
        __classPrivateFieldGet2(this, _WorkerShim_worker, "f").terminate();
      }
    };
    _WorkerShim_worker = /* @__PURE__ */ new WeakMap();
    node_default4 = globalThis.Worker || WorkerShim;
  }
});

// node_modules/worktank/dist/worker/backend_compiled.js
var backend_compiled_default;
var init_backend_compiled = __esm({
  "node_modules/worktank/dist/worker/backend_compiled.js"() {
    backend_compiled_default = 'globalThis.WorkTankWorkerBackend=(()=>{let{addEventListener:d,postMessage:n}=globalThis,r={},l=e=>e instanceof Error?e:typeof e=="string"?new Error(e):new Error("Unknown error"),a=e=>{try{n({type:"log",value:e})}catch(t){console.error("Failed to post log message",t)}},g=e=>{let t=!1,o;return()=>(t||(t=!0,o=e()),o)},u=e=>{var t,o;((t=e.data)==null?void 0:t.type)==="exec"?p(e.data.method,e.data.args):a(`Unknown message type: ${(o=e.data)==null?void 0:o.type}`)},p=(e,t)=>{let o=r[e];new Promise(i=>i(o.apply(void 0,t))).then(y,s)},s=e=>{let{name:t,message:o,stack:c}=l(e);try{n({type:"result",error:{name:t,message:o,stack:c}})}catch(i){s("Failed to post error message")}},y=e=>{try{n({type:"result",value:e})}catch(t){s(t)}};return{ready:g(()=>{d("message",u),n({type:"ready"})}),registerEnv:e=>{globalThis.process||(globalThis.process={}),globalThis.process.env={...globalThis.process.env,...e}},registerMethods:e=>{for(let t in e){let o=e[t];typeof o=="function"?r[t]=o:a(`Method "${t}" is not a function and will be ignored`)}}}})(); /*! BOOTLOADER_PLACEHOLDER !*/';
  }
});

// node_modules/worktank/dist/worker/frontend.js
var WorkerFrontend, frontend_default;
var init_frontend = __esm({
  "node_modules/worktank/dist/worker/frontend.js"() {
    init_node5();
    init_backend_compiled();
    WorkerFrontend = class {
      /* CONSTRUCTOR */
      constructor(name, bootloader, onClose, onError, onMessage) {
        this.listen = (onClose2, onError2, onMessage2) => {
          this.worker.addEventListener("close", (event) => onClose2(event["data"]));
          this.worker.addEventListener("error", (event) => onError2(event["data"]));
          this.worker.addEventListener("message", (event) => onMessage2(event["data"]));
        };
        this.send = (message, transfer = []) => {
          this.worker.postMessage(message, transfer);
        };
        this.terminate = () => {
          this.worker.terminate();
        };
        const backend = backend_compiled_default.replace("/*! BOOTLOADER_PLACEHOLDER !*/", bootloader);
        const script = `data:text/javascript;charset=utf-8,${encodeURIComponent(backend)}`;
        this.worker = new node_default4(script, { name, type: "module" });
        this.listen(onClose, onError, onMessage);
      }
    };
    frontend_default = WorkerFrontend;
  }
});

// node_modules/worktank/dist/worker/index.js
var Worker2, worker_default;
var init_worker = __esm({
  "node_modules/worktank/dist/worker/index.js"() {
    init_error2();
    init_frontend();
    Worker2 = class {
      /* CONSTRUCTOR */
      constructor(name, bootloader) {
        this.onClose = (code) => {
          if (this.terminated)
            return;
          this.terminated = true;
          this.worker.terminate();
          this.reject(new error_default(this.name, `Exited with exit code ${code}`));
        };
        this.onError = (error) => {
          if (this.terminated)
            return;
          this.terminated = true;
          this.worker.terminate();
          this.reject(error);
        };
        this.onMessage = (message) => {
          if (this.terminated)
            return;
          if (message.type === "log") {
            this.onMessageLog(message);
          } else if (message.type === "ready") {
            this.onMessageReady(message);
          } else if (message.type === "result") {
            this.onMessageResult(message);
          }
        };
        this.onMessageLog = (message) => {
          console.log(message.value);
        };
        this.onMessageReady = (message) => {
          this.ready = true;
          this.tick();
        };
        this.onMessageResult = (message) => {
          if ("value" in message) {
            this.resolve(message.value);
          } else {
            const error = Object.assign(new Error(), message.error);
            this.reject(error);
          }
        };
        this.exec = (task) => {
          if (this.terminated)
            throw new error_default(this.name, "Terminated");
          if (this.task || this.busy)
            throw new error_default(this.name, "Busy");
          this.task = task;
          this.tick();
        };
        this.reject = (error) => {
          const { task } = this;
          if (!task)
            return;
          this.busy = false;
          this.task = void 0;
          this.timestamp = Date.now();
          task.reject(error);
        };
        this.resolve = (value) => {
          const { task } = this;
          if (!task)
            return;
          this.busy = false;
          this.task = void 0;
          this.timestamp = Date.now();
          task.resolve(value);
        };
        this.terminate = () => {
          if (this.terminated)
            return;
          this.terminated = true;
          this.worker.terminate();
          this.reject(new error_default(this.name, "Terminated"));
        };
        this.tick = () => {
          if (this.terminated || !this.ready || !this.task || this.busy)
            return;
          this.busy = true;
          try {
            const { method, args, transfer } = this.task;
            this.worker.send({ type: "exec", method, args }, transfer);
          } catch {
            this.reject(new error_default(this.name, "Failed to send message"));
          }
        };
        this.busy = false;
        this.ready = false;
        this.terminated = false;
        this.timestamp = Date.now();
        this.name = name;
        this.bootloader = bootloader;
        this.worker = new frontend_default(this.name, this.bootloader, this.onClose, this.onError, this.onMessage);
      }
    };
    worker_default = Worker2;
  }
});

// node_modules/worktank/dist/index.js
var clearIntervalRegistry, WorkTank, dist_default36;
var init_dist44 = __esm({
  "node_modules/worktank/dist/index.js"() {
    init_node3();
    init_node4();
    init_dist17();
    init_worker();
    init_error2();
    clearIntervalRegistry = new FinalizationRegistry(clear);
    WorkTank = class {
      /* CONSTRUCTOR */
      constructor(options) {
        this.getTaskIdle = () => {
          for (const task of this.tasksIdle) {
            return task;
          }
        };
        this.getWorkerBootloader = (env, methods) => {
          if (methods instanceof URL) {
            return this.getWorkerBootloader(env, methods.href);
          } else if (typeof methods === "string") {
            if (/^(file|https?):\/\//.test(methods)) {
              const registerEnv = `WorkTankWorkerBackend.registerEnv ( ${JSON.stringify(env)} );`;
              const registerMethods = `WorkTankWorkerBackend.registerMethods ( Methods );`;
              const ready = "WorkTankWorkerBackend.ready ();";
              const bootloader = `${"import"} ( '${methods}' ).then ( Methods => { 
${registerEnv}

${registerMethods}

${ready}
 } );`;
              return bootloader;
            } else {
              return methods;
            }
          } else {
            const registerEnv = `WorkTankWorkerBackend.registerEnv ( ${JSON.stringify(env)} );`;
            const serializedMethods = `{ ${Object.keys(methods).map((name) => `${name}: ${methods[name].toString()}`).join(",")} }`;
            const registerMethods = `WorkTankWorkerBackend.registerMethods ( ${serializedMethods} );`;
            const ready = "WorkTankWorkerBackend.ready ();";
            const bootloader = `${registerEnv}

${registerMethods}

${ready}`;
            return bootloader;
          }
        };
        this.getWorkerIdle = () => {
          for (const worker of this.workersIdle) {
            return worker;
          }
          if (this.workersBusy.size < this.size) {
            return this.getWorkerIdleNew();
          }
        };
        this.getWorkerIdleNew = () => {
          const name = this.getWorkerName();
          const worker = new worker_default(name, this.bootloader);
          this.workersIdle.add(worker);
          return worker;
        };
        this.getWorkerName = () => {
          if (this.size < 2)
            return this.name;
          const counter = 1 + (this.workersBusy.size + this.workersIdle.size);
          return `${this.name} (${counter})`;
        };
        this.cleanup = () => {
          if (this.autoTerminate <= 0)
            return;
          const autoterminateTimestamp = Date.now() - this.autoTerminate;
          for (const worker of this.workersIdle) {
            if (worker.ready && !worker.busy && worker.timestamp < autoterminateTimestamp) {
              worker.terminate();
              this.workersIdle.delete(worker);
            }
          }
        };
        this.exec = (method, args, options2) => {
          const { promise, resolve: resolve4, reject } = dist_default15();
          const signal = options2?.signal;
          const timeout = options2?.timeout ?? this.autoAbort;
          const transfer = options2?.transfer;
          const task = { method, args, signal, timeout, transfer, promise, resolve: resolve4, reject };
          this.tasksIdle.add(task);
          this.tick();
          return promise;
        };
        this.proxy = () => {
          return new Proxy({}, {
            get: (_, method) => {
              if (method === "then")
                return;
              return (...args) => {
                return this.exec(method, args);
              };
            }
          });
        };
        this.resize = (size) => {
          this.size = size;
          if (this.autoInstantiate) {
            const missingNr = Math.max(0, this.size - this.workersBusy.size - this.workersIdle.size);
            for (let i = 0, l = missingNr; i < l; i++) {
              this.getWorkerIdleNew();
            }
          }
          const excessNr = Math.max(0, this.workersIdle.size - this.size);
          for (let i = 0, l = excessNr; i < l; i++) {
            for (const worker of this.workersIdle) {
              this.workersIdle.delete(worker);
              worker.terminate();
              break;
            }
          }
          this.tick();
        };
        this.stats = () => {
          return {
            tasks: {
              busy: this.tasksBusy.size,
              idle: this.tasksIdle.size,
              total: this.tasksBusy.size + this.tasksIdle.size
            },
            workers: {
              busy: this.workersBusy.size,
              idle: this.workersIdle.size,
              total: this.workersBusy.size + this.workersIdle.size
            }
          };
        };
        this.terminate = () => {
          const error = new error_default(this.name, "Terminated");
          for (const task of this.tasksBusy)
            task.reject(error);
          for (const task of this.tasksIdle)
            task.reject(error);
          this.tasksBusy = /* @__PURE__ */ new Set();
          this.tasksIdle = /* @__PURE__ */ new Set();
          for (const worker of this.workersBusy)
            worker.terminate();
          for (const worker of this.workersIdle)
            worker.terminate();
          this.workersBusy = /* @__PURE__ */ new Set();
          this.workersIdle = /* @__PURE__ */ new Set();
        };
        this.tick = () => {
          const task = this.getTaskIdle();
          if (!task)
            return;
          if (task.signal?.aborted) {
            this.tasksIdle.delete(task);
            task.reject(new error_default(this.name, "Terminated"));
            return this.tick();
          }
          const worker = this.getWorkerIdle();
          if (!worker)
            return;
          this.tasksIdle.delete(task);
          this.tasksBusy.add(task);
          this.workersIdle.delete(worker);
          this.workersBusy.add(worker);
          if (task.signal) {
            task.signal.addEventListener("abort", worker.terminate, { once: true });
          }
          let timeoutId;
          if (task.timeout > 0 && task.timeout !== Infinity) {
            timeoutId = setTimeout(worker.terminate, task.timeout);
          }
          const onFinally = () => {
            clearTimeout(timeoutId);
            this.tasksBusy.delete(task);
            this.workersBusy.delete(worker);
            if (!worker.terminated) {
              if (this.workersIdle.size < this.size) {
                this.workersIdle.add(worker);
              } else {
                worker.terminate();
              }
            }
            this.tick();
          };
          task.promise.then(onFinally, onFinally);
          worker.exec(task);
          this.tick();
        };
        this.name = options.pool?.name ?? "WorkTank";
        this.size = options.pool?.size ?? node_default3;
        this.env = { ...globalThis.process?.env, ...options.worker.env };
        this.bootloader = this.getWorkerBootloader(this.env, options.worker.methods);
        this.autoAbort = options.worker.autoAbort ?? 0;
        this.autoInstantiate = options.worker.autoInstantiate ?? false;
        this.autoTerminate = options.worker.autoTerminate ?? 0;
        this.tasksBusy = /* @__PURE__ */ new Set();
        this.tasksIdle = /* @__PURE__ */ new Set();
        this.workersBusy = /* @__PURE__ */ new Set();
        this.workersIdle = /* @__PURE__ */ new Set();
        this.resize(this.size);
        if (this.autoTerminate) {
          const thizRef = new WeakRef(this);
          const intervalId = set2(() => {
            thizRef.deref()?.cleanup();
          }, this.autoTerminate);
          unref(intervalId);
          clearIntervalRegistry.register(this, intervalId);
        }
      }
    };
    dist_default36 = WorkTank;
  }
});

// node_modules/@prettier/cli/dist/prettier_parallel.js
var prettier_parallel_exports = {};
__export(prettier_parallel_exports, {
  makeParallel: () => makeParallel
});
import os4 from "os";
import process17 from "process";
function makeParallel(options) {
  const pool = new dist_default36({
    pool: {
      name: "prettier",
      size: options.parallelWorkers || Math.max(1, os4.cpus().length - 1)
    },
    worker: {
      autoInstantiate: true,
      env: process17.env,
      methods: new URL("./experimental-cli-worker.mjs", import.meta.url)
    }
  });
  return {
    async check(filePath, fileContent, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      return pool.exec("check", [filePath, fileContent, await resolve2(formatOptions), contextOptions, pluginsDefaultOptions, pluginsCustomOptions]);
    },
    async checkWithPath(filePath, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      return pool.exec("checkWithPath", [filePath, await resolve2(formatOptions), contextOptions, pluginsDefaultOptions, pluginsCustomOptions]);
    },
    async format(filePath, fileContent, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      return pool.exec("format", [filePath, fileContent, await resolve2(formatOptions), contextOptions, pluginsDefaultOptions, pluginsCustomOptions]);
    },
    async formatWithPath(filePath, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      return pool.exec("formatWithPath", [filePath, await resolve2(formatOptions), contextOptions, pluginsDefaultOptions, pluginsCustomOptions]);
    },
    async write(filePath, fileContent, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      return pool.exec("write", [filePath, fileContent, await resolve2(formatOptions), contextOptions, pluginsDefaultOptions, pluginsCustomOptions]);
    },
    async writeWithPath(filePath, formatOptions, contextOptions, pluginsDefaultOptions, pluginsCustomOptions) {
      return pool.exec("writeWithPath", [filePath, await resolve2(formatOptions), contextOptions, pluginsDefaultOptions, pluginsCustomOptions]);
    }
  };
}
var init_prettier_parallel = __esm({
  "node_modules/@prettier/cli/dist/prettier_parallel.js"() {
    init_dist44();
    init_utils15();
  }
});

// node_modules/@prettier/cli/dist/prettier_lazy.js
var prettier_lazy_exports = {};
__export(prettier_lazy_exports, {
  makeLazy: () => makeLazy
});
function makeLazy(options) {
  const prettier = dist_default11(() => {
    return import("./experimental-cli-worker.mjs");
  });
  return {
    async check(...args) {
      return (await prettier()).check(...args);
    },
    async checkWithPath(...args) {
      return (await prettier()).checkWithPath(...args);
    },
    async format(...args) {
      return (await prettier()).format(...args);
    },
    async formatWithPath(...args) {
      return (await prettier()).formatWithPath(...args);
    },
    async write(...args) {
      return (await prettier()).write(...args);
    },
    async writeWithPath(...args) {
      return (await prettier()).writeWithPath(...args);
    }
  };
}
var init_prettier_lazy = __esm({
  "node_modules/@prettier/cli/dist/prettier_lazy.js"() {
    init_utils15();
  }
});

// node_modules/@prettier/cli/dist/prettier.js
async function makePrettier(options, cache3) {
  if (options.parallel) {
    const { makeParallel: makeParallel2 } = await Promise.resolve().then(() => (init_prettier_parallel(), prettier_parallel_exports));
    if (options.cache && cache3) {
      return makeCached(options, cache3, makeParallel2(options));
    } else {
      return makeParallel2(options);
    }
  } else {
    const { makeLazy: makeLazy2 } = await Promise.resolve().then(() => (init_prettier_lazy(), prettier_lazy_exports));
    if (options.cache && cache3) {
      return makeCached(options, cache3, makeLazy2(options));
    } else {
      return makeLazy2(options);
    }
  }
}
var init_prettier = __esm({
  "node_modules/@prettier/cli/dist/prettier.js"() {
    init_prettier_cached();
  }
});

// node_modules/@prettier/cli/dist/index.js
var dist_exports3 = {};
__export(dist_exports3, {
  run: () => run,
  runGlobs: () => runGlobs,
  runStdin: () => runStdin
});
import fs13 from "fs/promises";
import path17 from "path";
import process18 from "process";
async function run(options, pluginsDefaultOptions, pluginsCustomOptions) {
  if (options.globs.length || !isString5(await getStdin())) {
    return runGlobs(options, pluginsDefaultOptions, pluginsCustomOptions);
  } else {
    return runStdin(options, pluginsDefaultOptions, pluginsCustomOptions);
  }
}
async function runStdin(options, pluginsDefaultOptions, pluginsCustomOptions) {
  const stderr = new logger_default2(options.logLevel, "stderr");
  const stdout = new logger_default2(options.logLevel, "stdout");
  const prettier = await import("./experimental-cli-worker.mjs");
  const fileName = options.stdinFilepath || "stdin";
  const fileContent = await getStdin() || "";
  try {
    const formatted = await prettier.format(fileName, fileContent, options.formatOptions, options.contextOptions, pluginsDefaultOptions, pluginsCustomOptions);
    if (options.check || options.list) {
      if (formatted !== fileContent) {
        stdout.warn("(stdin)");
      }
    } else {
      stdout.always(trimFinalNewline(formatted));
    }
    process18.exitCode = (options.check || options.list) && formatted !== fileContent ? 1 : 0;
  } catch (error) {
    stderr.prefixed.error(String(error));
    process18.exitCode = 1;
  }
}
async function runGlobs(options, pluginsDefaultOptions, pluginsCustomOptions) {
  const stderr = new logger_default2(options.logLevel, "stderr");
  const stdout = new logger_default2(options.logLevel, "stdout");
  const spinner = options.check ? stdout.spinner.log() : void 0;
  spinner?.start("Checking formatting...");
  const rootPath = process18.cwd();
  const projectPath = getProjectPath(rootPath);
  const [filesPaths, filesNames, filesNamesToPaths, filesExplicitPaths, filesFoundPaths, foldersFoundPaths] = await getTargetsPaths(rootPath, options.globs, options.withNodeModules);
  const filesExplicitPathsSet = new Set(filesExplicitPaths);
  const filesPathsTargets = filesPaths.filter(negate(isBinaryPath)).sort();
  const [foldersPathsTargets, foldersExtraPaths] = getExpandedFoldersPaths(foldersFoundPaths, projectPath);
  const filesExtraPaths = await getFoldersChildrenPaths([rootPath, ...foldersExtraPaths]);
  const filesExtraNames = filesExtraPaths.map((filePath) => path17.basename(filePath));
  known_default.addFilesPaths(filesFoundPaths);
  known_default.addFilesPaths(filesExtraPaths);
  known_default.addFilesNames(filesNames);
  known_default.addFilesNames(filesExtraNames);
  const prettierVersion = PRETTIER_VERSION;
  const cliVersion = CLI_VERSION;
  const pluginsNames = options.formatOptions.plugins || [];
  const pluginsVersions = getPluginsVersions(pluginsNames);
  const pluginsVersionsMissing = pluginsVersions.filter(isNull2);
  const editorConfigNames = options.editorConfig ? [".editorconfig"].filter(known_default.hasFileName) : [];
  const ignoreNames = options.ignore ? [".gitignore", ".prettierignore"].filter(known_default.hasFileName) : [];
  const prettierConfigNames = options.config ? without2(Object.keys(File2Loader), ["default"]).filter(known_default.hasFileName) : [];
  const fileNames2parentPaths = (names) => names.flatMap((name) => filesNamesToPaths[name]?.map(path17.dirname) || []);
  const editorConfigPaths = uniq4([...fileNames2parentPaths(editorConfigNames), rootPath, ...foldersExtraPaths]);
  const ignorePaths = uniq4([...fileNames2parentPaths(ignoreNames), rootPath, ...foldersExtraPaths]);
  const prettierConfigPaths = uniq4([...fileNames2parentPaths(prettierConfigNames), rootPath, ...foldersExtraPaths]);
  const editorConfigs = options.editorConfig ? await getEditorConfigsMap(editorConfigPaths, editorConfigNames) : {};
  const ignoreContents = options.ignore ? await getIgnoresContentMap(ignorePaths, ignoreNames) : {};
  const prettierConfigs = options.config ? await getPrettierConfigsMap(prettierConfigPaths, prettierConfigNames) : {};
  const ignoreManualFilesNames = options.ignore ? options.ignorePath || [] : [];
  const ignoreManualFilesPaths = ignoreManualFilesNames.map((fileName) => path17.resolve(fileName));
  const ignoreManualFilesContents = await Promise.all(ignoreManualFilesPaths.map((filePath) => fs13.readFile(filePath, "utf8").catch(() => "")));
  const ignoreManualFoldersPaths = ignoreManualFilesPaths.map(path17.dirname);
  const ignoreManual = getIgnoreBys(ignoreManualFoldersPaths, ignoreManualFilesContents.map(castArray5));
  const prettierManualFilesNames = options.configPath || [];
  const prettierManualFilesPaths = prettierManualFilesNames.map((fileName) => path17.resolve(fileName));
  const prettierManualFilesContents = await Promise.all(prettierManualFilesPaths.map((filePath) => fs13.readFile(filePath, "utf8")));
  const prettierManualConfigs = await Promise.all(prettierManualFilesPaths.map(Loaders.auto));
  const prettierManualConfig = prettierManualConfigs.length ? Object.assign({}, ...prettierManualConfigs) : void 0;
  const cliContextConfig = options.contextOptions;
  const cliFormatConfig = options.formatOptions;
  const cacheVersion = dist_default24({ prettierVersion, cliVersion, pluginsNames, pluginsVersions, editorConfigs, ignoreContents, prettierConfigs, ignoreManualFilesPaths, ignoreManualFilesContents, prettierManualFilesPaths, prettierManualFilesContents, cliContextConfig, cliFormatConfig, pluginsDefaultOptions, pluginsCustomOptions });
  const shouldCache = options.cache && !options.dump && !pluginsVersionsMissing.length && isUndefined4(cliContextConfig.cursorOffset);
  const cache3 = shouldCache ? new cache_default(cacheVersion, projectPath, getCacheRootPath(rootPath), options, stdout) : void 0;
  const prettier = await makePrettier(options, cache3);
  const filesResults = await Promise.allSettled(filesPathsTargets.map(async (filePath) => {
    const isIgnored = () => ignoreManual ? ignoreManual(filePath) : getIgnoreResolved(filePath, ignoreNames);
    const isCacheable = () => cache3?.has(filePath, isIgnored);
    const isExplicitlyIncluded = () => filesExplicitPathsSet.has(filePath);
    const isForceIncluded = options.dump && isExplicitlyIncluded();
    const isExcluded = cache3 ? !await isCacheable() : await isIgnored();
    if (!isForceIncluded && isExcluded)
      return;
    const getFormatOptions = async () => {
      const editorConfig = options.editorConfig ? getEditorConfigFormatOptions(await getEditorConfigResolved(filePath, editorConfigNames)) : {};
      const prettierConfig = prettierManualConfig || (options.config ? await getPrettierConfigResolved(filePath, prettierConfigNames) : {});
      const formatOptions = { ...editorConfig, ...prettierConfig, ...options.formatOptions };
      return formatOptions;
    };
    try {
      if (options.check || options.list) {
        return await prettier.checkWithPath(filePath, getFormatOptions, cliContextConfig, pluginsDefaultOptions, pluginsCustomOptions);
      } else if (options.write) {
        return await prettier.writeWithPath(filePath, getFormatOptions, cliContextConfig, pluginsDefaultOptions, pluginsCustomOptions);
      } else {
        return await prettier.formatWithPath(filePath, getFormatOptions, cliContextConfig, pluginsDefaultOptions, pluginsCustomOptions);
      }
    } finally {
      spinner?.update(fastRelativePath(rootPath, filePath));
    }
  }));
  spinner?.stop("Checking formatting...");
  let totalMatched = filesResults.length;
  let totalIgnored = 0;
  let totalFormatted = 0;
  let totalUnformatted = 0;
  let totalUnknown = 0;
  let pathsUnknown = [];
  let totalErrored = 0;
  let pathsErrored = [];
  for (let i = 0, l = filesResults.length; i < l; i++) {
    const fileResult = filesResults[i];
    if (fileResult.status === "fulfilled") {
      if (isUndefined4(fileResult.value)) {
        totalMatched -= 1;
        totalIgnored += 1;
      } else if (isString5(fileResult.value)) {
        stdout.always(trimFinalNewline(fileResult.value));
      } else {
        if (fileResult.value) {
          totalFormatted += 1;
        } else {
          totalUnformatted += 1;
          const filePath = filesPathsTargets[i];
          const fileNameToDisplay = normalizePathSeparatorsToPosix(fastRelativePath(rootPath, filePath));
          if (options.check) {
            stderr.prefixed.warn(fileNameToDisplay);
          } else if (options.list || options.write) {
            stdout.warn(fileNameToDisplay);
          }
        }
      }
    } else {
      const error = fileResult.reason;
      if (error.name === "UndefinedParserError") {
        totalUnknown += 1;
        pathsUnknown.push(filesPathsTargets[i]);
      }
      if (error.name !== "UndefinedParserError" || !options.ignoreUnknown) {
        totalErrored += 1;
        pathsErrored.push(filesPathsTargets[i]);
        const filePath = filesPathsTargets[i];
        const fileNameToDisplay = normalizePathSeparatorsToPosix(fastRelativePath(rootPath, filePath));
        if (options.check || options.write || options.dump) {
          stderr.prefixed.error(`${fileNameToDisplay}: ${error}`);
        } else if (options.list) {
          stderr.error(fileNameToDisplay);
        }
      }
    }
  }
  stdout.prefixed.debug(`Files found: ${totalMatched + totalIgnored}`);
  stdout.prefixed.debug(`Files matched: ${totalMatched}`);
  stdout.prefixed.debug(`Files ignored: ${totalIgnored}`);
  stdout.prefixed.debug(`Files formatted: ${totalFormatted}`);
  stdout.prefixed.debug(`Files unformatted: ${totalUnformatted}`);
  stdout.prefixed.debug(`Files unknown: ${totalUnknown}`);
  stdout.prefixed.debug(() => pathsUnknown.map((filePath) => normalizePathSeparatorsToPosix(fastRelativePath(rootPath, filePath))).join("\n"));
  stdout.prefixed.debug(`Files errored: ${totalErrored}`);
  stdout.prefixed.debug(() => pathsErrored.map((filePath) => normalizePathSeparatorsToPosix(fastRelativePath(rootPath, filePath))).join("\n"));
  if (!totalMatched && !totalIgnored) {
    if (options.errorOnUnmatchedPattern) {
      stderr.prefixed.error(`No files matching the given patterns were found.`);
    }
  }
  if (totalUnformatted) {
    if (options.check) {
      stderr.prefixed.warn(`Code style issues found in ${totalUnformatted} ${pluralize("file", totalUnformatted)}. Run Prettier with --write to fix.`);
    }
  }
  if (!totalUnformatted && !totalErrored) {
    if (options.check) {
      stdout.log("All matched files use Prettier code style!");
    }
  }
  cache3?.write();
  process18.exitCode = !totalMatched && !totalIgnored && options.errorOnUnmatchedPattern || totalErrored || totalUnformatted && !options.write ? 1 : 0;
}
var init_dist45 = __esm({
  "node_modules/@prettier/cli/dist/index.js"() {
    init_is_binary_path();
    init_dist28();
    init_cache();
    init_config_editorconfig();
    init_config_ignore();
    init_config_prettier();
    init_constants_evaluate();
    init_known();
    init_logger2();
    init_prettier();
    init_utils15();
    init_utils15();
  }
});

// node_modules/@prettier/cli/dist/bin.js
init_dist();
init_dist14();
init_constants_evaluate();
init_utils15();
init_utils15();
var makeBin = () => {
  const binstance = dist_default10("prettier", "An opinionated code formatter").config({
    autoExit: true,
    colors: true,
    package: "prettier",
    version: PRETTIER_VERSION
  }).usage(`${dist_default4.cyan("prettier")} ${dist_default4.yellow("[file/dir/glob...]")} ${dist_default4.green("[options]")}`).usage(`${dist_default4.cyan("prettier")} ${dist_default4.yellow('"src/**/*.js"')} ${dist_default4.green("--check")}`).usage(`${dist_default4.cyan("prettier")} ${dist_default4.yellow('"src/**/*.js"')} ${dist_default4.green("-l")} ${dist_default4.green("--no-cache")}`).usage(`${dist_default4.cyan("prettier")} ${dist_default4.yellow('"src/**/*.js"')} ${dist_default4.green("--write")} ${dist_default4.green("--no-parallel")}`).usage(`${dist_default4.cyan("prettier")} ${dist_default4.yellow("./path/to/target/file.js")} ${dist_default4.green("--cache-location")} ${dist_default4.blue("./path/to/cache/file.json")}`).option("--check, -c", "Check if the given files are formatted, print a human-friendly summary (see also --list-different)", {
    section: "Output",
    incompatible: ["l", "w"]
  }).option("--list-different, -l", "Print the names of files that are different from Prettier's formatting (see also --check)", {
    section: "Output",
    incompatible: ["c", "w"]
  }).option("--write, -w", "Edit files in-place (Beware!)", {
    section: "Output",
    incompatible: ["c", "l"]
  }).option("--arrow-parens <always|avoid>", 'Include parentheses around a sole arrow function parameter\nDefaults to "always"', {
    section: "Format",
    enum: ["always", "avoid"]
  }).option("--bracket-same-line", 'Put ">" of opening tags on the last line instead of on a new line\nDefaults to "false"', {
    section: "Format"
  }).option("--no-bracket-spacing", 'Do not print spaces between brackets\nDefaults to "true"', {
    section: "Format"
  }).option("--embedded-language-formatting <auto|off>", 'Control how Prettier formats quoted code embedded in the file\nDefaults to "auto"', {
    section: "Format",
    enum: ["auto", "off"]
  }).option("--end-of-line <lf|crlf|cr|auto>", 'Which end of line characters to apply\nDefaults to "lf"', {
    section: "Format",
    enum: ["lf", "crlf", "cr", "auto"]
  }).option("--experimental-operator-position <start|end>", 'Where to print operators when binary expressions wrap lines\nDefaults to "end"', {
    section: "Format",
    enum: ["start", "end"]
  }).option("--experimental-ternaries", 'Use curious ternaries, with the question mark after the condition\nDefaults to "false"', {
    section: "Format"
  }).option("--html-whitespace-sensitivity <css|strict|ignore>", 'How to handle whitespaces in HTML\nDefaults to "css"', {
    section: "Format",
    enum: ["css", "strict", "ignore"]
  }).option("--jsx-single-quote", 'Use single quotes in JSX\nDefaults to "false"', {
    section: "Format"
  }).option("--object-wrap <preserve|collapse>", 'How to wrap object literals\nDefaults to "preserve"', {
    section: "Format",
    enum: ["preserve", "collapse"]
  }).option(`--parser <${DEFAULT_PARSERS.join("|")}>`, "Which parser to use", {
    section: "Format",
    enum: DEFAULT_PARSERS
  }).option("--print-width <int>", 'The line length where Prettier will try wrap\nDefaults to "80"', {
    section: "Format",
    type: "integer"
  }).option("--prose-wrap <always|never|preserve>", 'How to wrap prose\nDefaults to "preserve"', {
    section: "Format",
    enum: ["always", "never", "preserve"]
  }).option("--quote-props <as-needed|consistent|preserve>", 'Change when properties in objects are quoted\nDefaults to "as-needed"', {
    section: "Format",
    enum: ["as-needed", "consistent", "preserve"]
  }).option("--no-semi", 'Do not print semicolons, except at the beginning of lines which may need them\nDefaults to "true"', {
    section: "Format"
  }).option("--single-attribute-per-line", 'Enforce single attribute per line in HTML, Vue and JSX\nDefaults to "false"', {
    section: "Format"
  }).option("--single-quote", 'Use single quotes instead of double quotes\nDefaults to "false"', {
    section: "Format"
  }).option("--tab-width <int>", 'Number of spaces per indentation level\nDefaults to "2"', {
    section: "Format",
    type: "integer"
  }).option("--trailing-comma <all|es5|none>", 'Print trailing commas wherever possible when multi-line\nDefaults to "all"', {
    section: "Format",
    enum: ["all", "es5", "none"]
  }).option("--use-tabs", 'Indent with tabs instead of spaces\nDefaults to "false"', {
    section: "Format"
  }).option("--vue-indent-script-and-style", 'Indent script and style tags in Vue files\nDefaults to "false"', {
    section: "Format"
  }).option("--no-config", "Do not look for a configuration file", {
    section: "Config",
    default: true
  }).option("--config-path <path>", "Path to a Prettier configuration file (.prettierrc, package.json, prettier.config.js)", {
    section: "Config"
  }).option("--no-editorconfig", "Don't take .editorconfig into account when parsing configuration", {
    section: "Config",
    default: true
  }).option("--no-ignore", "Do not look for an ignore file", {
    section: "Config",
    default: true
  }).option("--ignore-path <path...>", "Path to a file with patterns describing files to ignore\nMultiple values are accepted\nDefaults to [.gitignore, .prettierignore]", {
    section: "Config"
  }).option("--plugin <package...>", "Add a plugin\nMultiple plugins are accepted\nDefaults to []", {
    section: "Config"
  }).option("--with-node-modules", 'Process files inside the "node_modules" directory', {
    section: "Config"
  }).option("--cursor-offset <int>", 'Print (to stderr) where a cursor at the given position would move to after formatting\nDefaults to "-1"', {
    section: "Editor",
    type: "integer"
  }).option("--range-end <int>", 'Format code ending at a given character offset (exclusive)\nThe range will extend forwards to the end of the selected statement\nDefaults to "Infinity"', {
    section: "Editor",
    type: "integer"
  }).option("--range-start <int>", 'Format code starting at a given character offset\nThe range will extend backwards to the start of the first line containing the selected statement\nDefaults to "0"', {
    section: "Editor",
    type: "integer"
  }).option("--no-cache", "Do not use the built-in caching mechanism", {
    section: "Other",
    default: true
  }).option("--cache-location <path>", "Path to the cache file", {
    section: "Other"
  }).option("--no-color", "Do not colorize output messages", {
    section: "Other"
  }).option("--no-error-on-unmatched-pattern", "Prevent errors when pattern is unmatched", {
    section: "Other",
    default: true
  }).option("--ignore-unknown, -u", "Ignore unknown files", {
    section: "Other"
  }).option("--insert-pragma", `Insert @format pragma into file's first docblock comment
Defaults to "false"`, {
    section: "Other"
  }).option("--log-level <silent|error|warn|log|debug>", 'What level of logs to report\nDefaults to "log"', {
    section: "Other",
    enum: ["silent", "error", "warn", "log", "debug"]
  }).option("--no-parallel", 'Process files in parallel\nDefaults to "true"', {
    section: "Other",
    default: true
  }).option("--parallel-workers <int>", 'Number of parallel workers to use\nDefaults to "0"', {
    section: "Other",
    type: "integer"
  }).option("--require-pragma", `Require either "@prettier" or "@format" to be present in the file's first docblock comment in order for it to be formatted
Defaults to "false"`, {
    section: "Other"
  }).option("--stdin-filepath <path>", "Path to the file to pretend that stdin comes from", {
    section: "Other"
  }).argument("[file/dir/glob...]", "Files, directories or globs to format");
  binstance.action(async (options, files) => {
    const { run: run2 } = await Promise.resolve().then(() => (init_dist45(), dist_exports3));
    const baseOptions = await normalizeOptions(options, files);
    const pluginsDefaultOptions = {};
    const pluginsCustomOptions = {};
    return run2(baseOptions, pluginsDefaultOptions, pluginsCustomOptions);
  });
  return binstance;
};
var makePluggableBin = async () => {
  let bin2 = makeBin();
  const argv = process.argv.slice(2);
  const args = dist_default7(argv);
  const formatOptions = normalizeFormatOptions(args);
  const pluginsDefaultOptions = {};
  const pluginsNames = formatOptions.plugins || [];
  const pluginsParsers = /* @__PURE__ */ new Set();
  const optionsNames = [];
  for (let i = 0, l = pluginsNames.length; i < l; i++) {
    const pluginName = pluginsNames[i];
    const plugin = await getPluginOrExit(pluginName);
    for (const option in plugin.options) {
      optionsNames.push(option);
      Object.assign(pluginsDefaultOptions, plugin.defaultOptions);
      const schema = plugin.options[option];
      const type = schema.type;
      const section = schema.category;
      const deprecated = !!schema.deprecated;
      const descriptionInfo = schema.description || "";
      const initial = schema.default;
      if (type === "int") {
        const descriptionDefault = isNumber3(initial) ? `Defaults to "${initial}"` : "";
        const description = `${descriptionInfo}
${descriptionDefault}`.trim();
        const range = !schema.array ? schema.range : void 0;
        const validate = (value) => isIntegerInRange(Number(value), range?.start, range?.end, range?.step);
        const variadic = !!schema.array;
        const type2 = "integer";
        const args2 = variadic ? "<int...>" : "<int>";
        pluginsDefaultOptions[option] = initial;
        bin2 = bin2.option(`--${to_kebab_case_default(option)} ${args2}`, description, { deprecated, section, type: type2, validate });
      } else if (type === "boolean") {
        const descriptionDefault = initial ? 'Defaults to "true"' : 'Defaults to "false"';
        const description = `${descriptionInfo}
${descriptionDefault}`.trim();
        pluginsDefaultOptions[option] = initial;
        bin2 = bin2.option(`--${to_kebab_case_default(option)}`, description, { deprecated, section });
      } else if (type === "string" || type === "path") {
        const descriptionDefault = initial ? `Defaults to "${initial}"` : "";
        const description = `${descriptionInfo}
${descriptionDefault}`.trim();
        const variadic = !!schema.array;
        const args2 = variadic ? "<value...>" : "<value>";
        pluginsDefaultOptions[option] = initial;
        bin2 = bin2.option(`--${to_kebab_case_default(option)} ${args2}`, description, { deprecated, section });
      } else if (type === "choice") {
        const descriptionDefault = initial ? `Defaults to "${initial}"` : "";
        const description = `${descriptionInfo}
${descriptionDefault}`.trim();
        const values = schema.choices.map((choice) => choice.value);
        const args2 = values.length ? `<${values.join("|")}>` : "<value>";
        pluginsDefaultOptions[option] = initial;
        bin2 = bin2.option(`--${to_kebab_case_default(option)} ${args2}`, description, { deprecated, section, enum: values });
      }
    }
    if (plugin.parsers) {
      for (const parserName of Object.keys(plugin.parsers)) {
        pluginsParsers.add(parserName);
      }
    }
  }
  if (pluginsParsers.size) {
    const parsers = [...DEFAULT_PARSERS, ...pluginsParsers];
    bin2.option(`--parser <${parsers}>`, "Which parser to use", {
      section: "Format",
      enum: parsers,
      override: true
    });
  }
  bin2.action(async (options, files) => {
    const { run: run2 } = await Promise.resolve().then(() => (init_dist45(), dist_exports3));
    const baseOptions = await normalizeOptions(options, files);
    const pluginsCustomOptions = normalizePluginOptions(options, optionsNames);
    return run2(baseOptions, pluginsDefaultOptions, pluginsCustomOptions);
  });
  return bin2;
};
var makeWarnedPluggableBin = async () => {
  const argv = process.argv.slice(2);
  const args = dist_default7(argv);
  if (isString5(args["config"]) || args["config"] === true) {
    exit_default('The "--config" option has been renamed to "--config-path" instead');
  }
  if (isString5(args["cache-strategy"])) {
    exit_default('The "--cache-strategy" option has been deleted, since the "metadata" strategy is no longer supported');
  }
  if (isBoolean2(args["find-config-path"])) {
    exit_default('The "--find-config-path" is not currently supported, please open an issue on GitHub if you need it');
  }
  if (args["config-precedence"]) {
    exit_default('The "config-precedence" option is not currently supported, please open an issue on GitHub if you need it');
  }
  if (args["file-info"]) {
    exit_default('The "--file-info" option is not currently supported, please open an issue on GitHub if you need it');
  }
  if (args["support-info"]) {
    exit_default('The "--support-info" option is not currently supported, please open an issue on GitHub if you need it');
  }
  const bin2 = await makePluggableBin();
  return bin2;
};
var runBin = async () => {
  const bin2 = await makeWarnedPluggableBin();
  await bin2.run();
};
var __promise = runBin();
export {
  __promise
};
