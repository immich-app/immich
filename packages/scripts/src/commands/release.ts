import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver, { SemVer } from 'semver';
import {
  JsonFile,
  RELEASE_TYPES,
  ReleaseError,
  ReleaseInputError,
  ReleaseOptions,
  ReleaseType,
  TextFile,
} from 'src/types';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../');

const Files = {
  PackageJson: {
    Root: join(root, 'package.json'),
    Rest: ['web', 'packages/cli', 'packages/sdk', 'e2e', 'server'].map(
      (folder) => join(root, folder, `package.json`),
    ),
  },
  ExampleEnv: join(root, 'docker/example.env'),
  Docs: {
    Env: join(root, 'docs/docs/install/environment-variables.md'),
    Upgrading: join(root, 'docs/docs/install/upgrading.md'),
  },
  Mobile: {
    Pubspec: join(root, 'mobile/pubspec.yaml'),
    Fastfile: join(root, 'mobile/android/fastlane/Fastfile'),
    InfoPlist: join(root, 'mobile/ios/Runner/Info.plist'),
  },
};

export const handleRelease = ({ type }: ReleaseOptions) => {
  const versionRaw = getVersion();
  const newVersionRaw = getNewVersion(versionRaw, type);
  const newVersion = semver.parse(normalize(newVersionRaw));
  if (!newVersion) {
    throw new ReleaseInputError();
  }
  const newVersionNoRc = `${newVersion.major}.${newVersion.minor}.${newVersion.patch}`;
  const newMobileBuild = getMobileBuild(newVersion);

  // pump versions everywhere

  // package.json
  for (const file of [Files.PackageJson.Root, ...Files.PackageJson.Rest]) {
    pump(file, /^  "version": ".*"/m, `  "version": "${newVersionRaw}"`);
  }

  // machine-learning
  execSync(`uv version --directory machine-learning ${newVersionRaw}`, {
    cwd: root,
    stdio: 'inherit',
  });

  // mobile
  pump(
    Files.Mobile.Fastfile,
    /"android\.injected\.version\.name" => ".*",/g,
    `"android.injected.version.name" => "${newVersionRaw}",`,
  );
  pump(
    Files.Mobile.Fastfile,
    /"android\.injected\.version\.code" => \d+,/g,
    `"android.injected.version.code" => ${newMobileBuild},`,
  );
  pump(
    Files.Mobile.Pubspec,
    /^version: .*\+\d+$/m,
    `version: ${newVersionRaw}+${newMobileBuild}`,
  );
  // strip prerelease from CFBundleShortVersionString
  // (deploying to testflight _is_ the prerelease)
  pump(
    Files.Mobile.InfoPlist,
    /(<key>CFBundleShortVersionString<\/key>\s*<string>).*?(<\/string>)/s,
    `$1${newVersionNoRc}$2`,
  );

  if (type === 'release') {
    // docker tag references (v2, :v2, etc) in docs
    const major = `v${newVersion.major}`;

    // sync major tag references in docs and example env file
    pump(Files.ExampleEnv, /^IMMICH_VERSION=v\d+$/m, `IMMICH_VERSION=${major}`);
    pump(Files.Docs.Env, /(`IMMICH_VERSION`.*?)`v\d+`/, `$1\`${major}\``);
    pump(Files.Docs.Upgrading, /:v\d+/, `:${major}`);
  }

  if (process.env.GITHUB_ENV) {
    // make available for following steps
    appendFileSync(
      process.env.GITHUB_ENV,
      `IMMICH_VERSION=v${newVersionRaw}\n`,
    );
  }

  return newVersionRaw;
};

const getVersion = () =>
  new JsonFile<{ version: string }>(Files.PackageJson.Root).read().version;

export const getNewVersion = (versionRaw: string, type: string) => {
  if (!versionRaw || !type || !RELEASE_TYPES.includes(type as ReleaseType)) {
    throw new ReleaseInputError();
  }

  versionRaw = normalize(versionRaw);

  const version = semver.parse(versionRaw);
  if (!version) {
    throw new ReleaseInputError();
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
      throw new ReleaseInputError();
    }
  }

  if (!newVersionRaw) {
    throw new ReleaseInputError();
  }

  newVersionRaw = normalize(newVersionRaw);

  const newVersion = semver.parse(newVersionRaw);
  if (!newVersion) {
    throw new ReleaseInputError();
  }

  const invalidUpgrade =
    isPrerelease(version) &&
    !isPrerelease(newVersion) &&
    (version.major !== newVersion.major ||
      version.minor !== newVersion.minor ||
      version.patch !== newVersion.patch);

  if (!valid || invalidUpgrade) {
    throw new ReleaseError({
      version: versionRaw,
      newVersion: newVersionRaw,
    });
  }

  return newVersionRaw;
};

const RADIX = 100;
const STABLE = RADIX - 1;

export const getMobileBuild = (version: SemVer) => {
  const { major, minor, patch, prerelease } = version;
  const candidate = prerelease[1];
  const digit = typeof candidate === 'number' ? candidate : STABLE;

  const valid =
    major < RADIX &&
    minor < RADIX &&
    patch < RADIX &&
    (prerelease.length === 0 || digit < STABLE);

  if (!valid) {
    throw new Error(
      `Cannot derive a mobile build number from ${version.format()}`,
    );
  }

  return (
    major * Math.pow(RADIX, 3) +
    minor * Math.pow(RADIX, 2) +
    patch * RADIX +
    digit
  );
};

const pump = (path: string, pattern: RegExp, replacement: string) => {
  const file = new TextFile(path);
  const update = file.read().replace(pattern, replacement);
  file.write(update);
};

const isPrerelease = (version: SemVer) => version.prerelease.length > 0;

/**
 * @param {SemVer} version
 * @returns {boolean}
 */
const inc = (version: SemVer, type: ReleaseType) =>
  `v${semver.inc(version, type, {}, 'rc')}`;

const normalize = (version: string) =>
  version.startsWith('v') ? version.slice(1) : version;
