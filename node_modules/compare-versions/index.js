/* global define */
(function (root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.compareVersions = factory();
  }
})(this, function () {
  var semver =
    /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;

  function indexOrEnd(str, q) {
    return str.indexOf(q) === -1 ? str.length : str.indexOf(q);
  }

  function split(v) {
    var c = v.replace(/^v/, '').replace(/\+.*$/, '');
    var patchIndex = indexOrEnd(c, '-');
    var arr = c.substring(0, patchIndex).split('.');
    arr.push(c.substring(patchIndex + 1));
    return arr;
  }

  function tryParse(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? v : n;
  }

  function validateAndParse(v) {
    if (typeof v !== 'string') {
      throw new TypeError('Invalid argument expected string');
    }
    var match = v.match(semver);
    if (!match) {
      throw new Error(
        "Invalid argument not valid semver ('" + v + "' received)"
      );
    }
    match.shift();
    return match;
  }

  function forceType(a, b) {
    return typeof a !== typeof b ? [String(a), String(b)] : [a, b];
  }

  function compareStrings(a, b) {
    var [ap, bp] = forceType(tryParse(a), tryParse(b));
    if (ap > bp) return 1;
    if (ap < bp) return -1;
    return 0;
  }

  function compareSegments(a, b) {
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
      var r = compareStrings(a[i] || 0, b[i] || 0);
      if (r !== 0) return r;
    }
    return 0;
  }

  function compareVersions(v1, v2) {
    [v1, v2].forEach(validateAndParse);

    var s1 = split(v1);
    var s2 = split(v2);

    for (var i = 0; i < Math.max(s1.length - 1, s2.length - 1); i++) {
      var n1 = parseInt(s1[i] || 0, 10);
      var n2 = parseInt(s2[i] || 0, 10);

      if (n1 > n2) return 1;
      if (n2 > n1) return -1;
    }

    var sp1 = s1[s1.length - 1];
    var sp2 = s2[s2.length - 1];

    if (sp1 && sp2) {
      var p1 = sp1.split('.').map(tryParse);
      var p2 = sp2.split('.').map(tryParse);

      for (i = 0; i < Math.max(p1.length, p2.length); i++) {
        if (
          p1[i] === undefined ||
          (typeof p2[i] === 'string' && typeof p1[i] === 'number')
        )
          return -1;
        if (
          p2[i] === undefined ||
          (typeof p1[i] === 'string' && typeof p2[i] === 'number')
        )
          return 1;

        if (p1[i] > p2[i]) return 1;
        if (p2[i] > p1[i]) return -1;
      }
    } else if (sp1 || sp2) {
      return sp1 ? -1 : 1;
    }

    return 0;
  }

  var allowedOperators = ['>', '>=', '=', '<', '<='];

  var operatorResMap = {
    '>': [1],
    '>=': [0, 1],
    '=': [0],
    '<=': [-1, 0],
    '<': [-1],
  };

  function validateOperator(op) {
    if (typeof op !== 'string') {
      throw new TypeError(
        'Invalid operator type, expected string but got ' + typeof op
      );
    }
    if (allowedOperators.indexOf(op) === -1) {
      throw new TypeError(
        'Invalid operator, expected one of ' + allowedOperators.join('|')
      );
    }
  }

  compareVersions.validate = function (version) {
    return typeof version === 'string' && semver.test(version);
  };

  compareVersions.compare = function (v1, v2, operator) {
    // Validate operator
    validateOperator(operator);

    // since result of compareVersions can only be -1 or 0 or 1
    // a simple map can be used to replace switch
    var res = compareVersions(v1, v2);
    return operatorResMap[operator].indexOf(res) > -1;
  };

  compareVersions.satisfies = function (v, r) {
    // if no range operator then "="
    var match = r.match(/^([<>=~^]+)/);
    var op = match ? match[1] : '=';

    // if gt/lt/eq then operator compare
    if (op !== '^' && op !== '~') return compareVersions.compare(v, r, op);

    // else range of either "~" or "^" is assumed
    var [v1, v2, v3] = validateAndParse(v);
    var [m1, m2, m3] = validateAndParse(r);
    if (compareStrings(v1, m1) !== 0) return false;
    if (op === '^') {
      return compareSegments([v2, v3], [m2, m3]) >= 0;
    }
    if (compareStrings(v2, m2) !== 0) return false;
    return compareStrings(v3, m3) >= 0;
  };

  return compareVersions;
});
