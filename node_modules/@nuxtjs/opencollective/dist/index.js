'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fetch = require('node-fetch');
var child_process = require('child_process');
var chalk = require('chalk');
var consola = require('consola');
var path = require('path');
var fs = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var consola__default = /*#__PURE__*/_interopDefaultLegacy(consola);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);

var reportAndThrowError = function reportAndThrowError(msg) {
  report(msg);
  throw new Error(msg);
};
var report = function report(message) {
  consola__default['default'].debug({
    message: String(message),
    tag: 'opencollective'
  });
};
var hideMessage = function hideMessage() {
  var env = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : process.env;

  // Show message if it is forced
  if (env.OPENCOLLECTIVE_FORCE) {
    return false;
  } // Don't show after oracle postinstall


  if (env.OC_POSTINSTALL_TEST) {
    return true;
  } // Don't show if opted-out


  if (env.OPENCOLLECTIVE_HIDE) {
    return true;
  } // Compatability with opencollective-postinstall


  if (!!env.DISABLE_OPENCOLLECTIVE && env.DISABLE_OPENCOLLECTIVE !== '0' && env.DISABLE_OPENCOLLECTIVE !== 'false') {
    return true;
  } // Don't show if on CI


  if (env.CI || env.CONTINUOUS_INTEGRATION) {
    return true;
  } // Only show in dev environment


  return Boolean(env.NODE_ENV) && !['dev', 'development'].includes(env.NODE_ENV);
};
var formatMoney = function formatMoney(currency) {
  return function (amount) {
    amount = amount / 100; // converting cents

    var precision = 0;
    return amount.toLocaleString(currency, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  };
};
var isWin32 = process.platform === 'win32';
var stripLeadingSlash = function stripLeadingSlash(s) {
  return s.startsWith('/') ? s.substring(1) : s;
};
var stripTrailingSlash = function stripTrailingSlash(s) {
  return s.endsWith('/') ? s.slice(0, -1) : s;
};

/* eslint-disable no-console */
var print = function print() {
  var color = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  return function () {
    var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var terminalCols = retrieveCols();
    var strLength = str.replace(/\u001B\[[0-9]{2}m/g, '').length;
    var leftPaddingLength = Math.floor((terminalCols - strLength) / 2);
    var leftPadding = ' '.repeat(Math.max(leftPaddingLength, 0));

    if (color) {
      str = chalk__default['default'][color](str);
    }

    console.log(leftPadding, str);
  };
};
var retrieveCols = function () {
  var result = false;
  return function () {
    if (result) {
      return result;
    }

    var defaultCols = 80;

    try {
      var terminalCols = child_process.execSync('tput cols', {
        stdio: ['pipe', 'pipe', 'ignore']
      });
      result = parseInt(terminalCols.toString()) || defaultCols;
    } catch (e) {
      result = defaultCols;
    }

    return result;
  };
}();
var printStats = function printStats(stats, color) {
  if (!stats) {
    return;
  }

  var colored = print(color);
  var bold = print('bold');
  var formatWithCurrency = formatMoney(stats.currency);
  colored("Number of contributors: ".concat(stats.contributorsCount));
  colored("Number of backers: ".concat(stats.backersCount));
  colored("Annual budget: ".concat(formatWithCurrency(stats.yearlyIncome)));
  bold("Current balance: ".concat(formatWithCurrency(stats.balance)), 'bold');
};
var printLogo = function printLogo(logoText) {
  if (!logoText) {
    return;
  }

  logoText.split('\n').forEach(print('blue'));
};
/**
 * Only show emoji on OSx (Windows shell doesn't like them that much ¯\_(ツ)_/¯ )
 * @param {*} emoji
 */

var emoji = function emoji(_emoji) {
  return process.stdout.isTTY && !isWin32 ? _emoji : '';
};
function printFooter(collective) {
  var dim = print('dim');
  var yellow = print('yellow');
  var emptyLine = print();
  yellow("Thanks for installing ".concat(collective.slug, " ").concat(emoji('🙏')));
  dim('Please consider donating to our open collective');
  dim('to help us maintain this package.');
  emptyLine();
  printStats(collective.stats);
  emptyLine();
  print()("".concat(chalk__default['default'].bold("".concat(emoji('👉 '), " ").concat(collective.donationText)), " ").concat(chalk__default['default'].underline(collective.donationUrl)));
  emptyLine();
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _await(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

var FETCH_TIMEOUT = 3000;

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

var fetchJson = _async(function (url) {
  return _catch(function () {
    return _await(global.fetch("".concat(url, ".json"), {
      timeout: FETCH_TIMEOUT
    }), function (_global$fetch) {
      return _global$fetch.json();
    });
  }, function (e) {
    report(e);
    reportAndThrowError("Could not fetch ".concat(url, ".json"));
  });
});

function _async(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var fetchStats = _async(function (collectiveUrl) {
  return _catch(function () {
    return _await(fetchJson(collectiveUrl));
  }, function (e) {
    report(e);
    report("Could not load the stats for ".concat(collectiveSlugFromUrl(collectiveUrl)));
  });
});
var fetchLogo = _async(function (logoUrl) {
  if (!logoUrl) {
    // Silent return if no logo has been provided
    return;
  }

  if (!logoUrl.match(/^https?:\/\//)) {
    reportAndThrowError("Your logo URL isn't well-formatted - ".concat(logoUrl));
  }

  return _catch(function () {
    return _await(global.fetch(logoUrl, {
      timeout: FETCH_TIMEOUT
    }), function (res) {
      if (isLogoResponseWellFormatted(res)) {
        return res.text();
      }

      report("Error while fetching logo from ".concat(logoUrl, ". The response wasn't well-formatted"));
    });
  }, function () {
    report("Error while fetching logo from ".concat(logoUrl));
  });
});

var isLogoResponseWellFormatted = function isLogoResponseWellFormatted(res) {
  return res.status === 200 && res.headers.get('content-type').match(/^text\/plain/);
};

var fetchPkg = function fetchPkg(pathToPkg) {
  var fullPathToPkg = path__default['default'].resolve("".concat(pathToPkg, "/package.json"));

  try {
    return JSON.parse(fs__default['default'].readFileSync(fullPathToPkg, 'utf8'));
  } catch (e) {
    reportAndThrowError("Could not find package.json at ".concat(fullPathToPkg));
  }
};

function _await$1(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _async$1(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var collectiveSlugFromUrl = function collectiveSlugFromUrl(url) {
  return url.substr(url.lastIndexOf('/') + 1).toLowerCase().replace(/\.json/g, '');
};
var collectiveUrl = function collectiveUrl(pkg) {
  var url = pkg.collective && pkg.collective.url;

  if (!url) {
    reportAndThrowError('No collective URL set!');
  }

  return stripTrailingSlash(url);
}; // use pkg.collective.logo for "legacy"/compatibility reasons

var collectiveLogoUrl = function collectiveLogoUrl(pkg) {
  return pkg.collective.logo || pkg.collective.logoUrl || false;
};
var collectiveDonationText = function collectiveDonationText(pkg) {
  return pkg.collective.donation && pkg.collective.donation.text || 'Donate:';
};
var getCollective = _async$1(function (pkgPath) {
  var pkg = fetchPkg(pkgPath);
  var url = collectiveUrl(pkg);
  var baseCollective = {
    url: url,
    slug: collectiveSlugFromUrl(url),
    logoUrl: collectiveLogoUrl(pkg),
    donationUrl: collectiveDonationUrl(pkg),
    donationText: collectiveDonationText(pkg)
  };
  var logoUrl = baseCollective.logoUrl;
  var promises = [fetchStats(url)].concat(logoUrl ? fetchLogo(logoUrl) : []);
  return _await$1(Promise.all(promises), function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        stats = _ref2[0],
        logo = _ref2[1];

    return Object.assign(baseCollective, {
      stats: stats,
      logo: logo
    });
  });
});
var collectiveDonationUrl = function collectiveDonationUrl(pkg) {
  var defaultDonationAmount = pkg.collective.donation && pkg.collective.donation.amount;
  var donateUrl = "".concat(collectiveUrl(pkg), "/").concat(retrieveDonationSlug(pkg));

  if (defaultDonationAmount) {
    return "".concat(donateUrl, "/").concat(defaultDonationAmount);
  }

  return donateUrl;
};
var retrieveDonationSlug = function retrieveDonationSlug(pkg) {
  var rawDonationSlug = pkg.collective.donation && pkg.collective.donation.slug;

  if (!rawDonationSlug) {
    return 'donate';
  }

  return stripLeadingSlash(rawDonationSlug);
};

function _await$2(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _async$2(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var init = _async$2(function (path, hide) {
  if (hide === undefined) hide = hideMessage();

  if (hide) {
    return;
  }

  global.fetch = global.fetch || fetch__default['default'];
  return _await$2(getCollective(path), function (collective) {
    printLogo(collective.logo);
    printFooter(collective);
  });
});

exports.init = init;
