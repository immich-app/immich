import semver, { SemVer } from 'semver';

const printUsage = () => {
  return {
    message:
      'Usage: ./pump_cli.js <semver> <minor|patch|premajor|preminor|prepatch|prerelease|release>',
    exitCode: 1,
  };
};

const isPrerelease = (version) => version.prerelease.length > 0;

/**
 * @param {SemVer} version
 * @returns {boolean}
 */
const inc = (version, type) => `v${semver.inc(version, type, {}, 'rc')}`;

/** @param {string} version */
const normalize = (version) => {
  if (version.startsWith('v')) {
    version = version.slice(1);
  }

  return version;
};

/**
 * @param {string} versionRaw
 * @param {string} type
 */
export const pump = (versionRaw, type) => {
  if (!versionRaw) {
    return printUsage();
  }

  versionRaw = normalize(versionRaw);

  const version = semver.parse(versionRaw);
  if (!version) {
    return printUsage();
  }

  let newVersionRaw;
  let valid = true;

  switch (type) {
    case 'patch':
    case 'prepatch':
    case 'minor':
    case 'preminor':
    case 'premajor': {
      newVersionRaw = inc(version, type);
      // can only use while not in a prerelease
      valid = !isPrerelease(version);
      break;
    }

    case 'prerelease': {
      newVersionRaw = inc(version, type);
      // can only use while in a prerelease
      valid = isPrerelease(version);
      break;
    }

    case 'release': {
      // drop prerelease part
      newVersionRaw = `${version.major}.${version.minor}.${version.patch}`;
      // can only use to promote a prerelease to a release (no version change)
      valid = isPrerelease(version);
      break;
    }

    default: {
      return printUsage();
    }
  }

  if (!newVersionRaw) {
    return printUsage();
  }

  newVersionRaw = normalize(newVersionRaw);

  const newVersion = semver.parse(newVersionRaw);
  if (!newVersion) {
    return printUsage();
  }

  const invalidUpgrade =
    isPrerelease(version) &&
    !isPrerelease(newVersion) &&
    (version.major !== newVersion.major ||
      version.minor !== newVersion.minor ||
      version.patch !== newVersion.patch);

  if (!valid || invalidUpgrade) {
    return {
      message: `Invalid pump: ${type}. Pumping from ${versionRaw} to ${newVersionRaw} is not allowed.`,
      exitCode: 1,
    };
  }

  return { message: newVersionRaw, exitCode: 0 };
};
