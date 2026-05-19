import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const scriptUnderTest = join(repoRoot, 'misc/release/pump-version.sh');

const read = (path) => readFileSync(path, 'utf8');
const packageVersion = (dir) => JSON.parse(read(join(dir, 'package.json'))).version;
const shellQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

const writeExecutable = (path, contents) => {
  writeFileSync(path, contents, { mode: 0o755 });
};

const writePackageJson = (dir, name, version) => {
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify({ name, version, private: true }, null, 2)}\n`,
  );
};

const makeFixture = (t, { rootVersion = '2.7.5', serverVersion = '3.0.0', mobileBuild = 3047 } = {}) => {
  const workdir = mkdtempSync(join(tmpdir(), 'pump-version-'));
  t.after(() => rmSync(workdir, { recursive: true, force: true }));

  const currentBase = serverVersion.replace(/-rc\..+$/, '');

  for (const path of [
    'bin',
    'server',
    'packages/cli',
    'web',
    'e2e',
    'packages/sdk',
    'misc/release',
    'mobile/android/fastlane',
    'mobile/ios/Runner',
    'machine-learning',
  ]) {
    mkdirSync(join(workdir, path), { recursive: true });
  }

  writeCommandStubs(workdir);

  writePackageJson(workdir, 'immich-monorepo', rootVersion);
  writePackageJson(join(workdir, 'server'), 'immich', serverVersion);
  writePackageJson(join(workdir, 'packages/cli'), '@immich/cli', serverVersion);
  writePackageJson(join(workdir, 'web'), 'immich-web', serverVersion);
  writePackageJson(join(workdir, 'e2e'), 'immich-e2e', serverVersion);
  writePackageJson(join(workdir, 'packages/sdk'), '@immich/sdk', serverVersion);

  writeExecutable(
    join(workdir, 'misc/release/archive-version.js'),
    `#!/usr/bin/env bash
set -euo pipefail
echo "$*" >>"$PWD/archive-version.calls"
`,
  );

  writeFileSync(
    join(workdir, 'mobile/pubspec.yaml'),
    `name: immich_mobile
version: ${serverVersion}+${mobileBuild}
`,
  );

  writeFileSync(
    join(workdir, 'mobile/android/fastlane/Fastfile'),
    `lane :gha_release_prod do
  gradle(
    properties: {
      "android.injected.version.code" => ${mobileBuild},
      "android.injected.version.name" => "${serverVersion}",
    }
  )
end
`,
  );

  writeFileSync(
    join(workdir, 'mobile/ios/Runner/Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>CFBundleShortVersionString</key>
  <string>${currentBase}</string>
</dict>
</plist>
`,
  );

  return {
    path: workdir,
    file: (path) => join(workdir, path),
    readFile: (path) => read(join(workdir, path)),
    hasFile: (path) => {
      try {
        return read(join(workdir, path)).length > 0;
      } catch {
        return false;
      }
    },
    run: (...args) =>
      spawnSync('bash', [scriptUnderTest, ...args], {
        cwd: workdir,
        env: {
          ...process.env,
          GITHUB_ENV: join(workdir, 'github_env'),
          PATH: `${join(workdir, 'bin')}:${process.env.PATH}`,
        },
        encoding: 'utf8',
      }),
  };
};

const writeCommandStubs = (workdir) => {
  const realNpm = spawnSync('which', ['npm'], { encoding: 'utf8' }).stdout.trim();

  writeExecutable(
    join(workdir, 'bin/npm'),
    `#!/usr/bin/env bash
set -euo pipefail
real_npm=${shellQuote(realNpm)}
echo "$*" >>"$PWD/npm.calls"
"$real_npm" "$@"
`,
  );

  writeExecutable(
    join(workdir, 'bin/pnpm'),
    `#!/usr/bin/env bash
set -euo pipefail

if [[ "\${1:-}" != "version" ]]; then
  echo "Unexpected pnpm command: $*" >&2
  exit 1
fi

shift
version="\${1:-}"
shift
prefix="."

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix)
      prefix="$2"
      shift 2
      ;;
    --no-git-tag-version)
      shift
      ;;
    *)
      echo "Unexpected pnpm argument: $1" >&2
      exit 1
      ;;
  esac
done

npm --prefix "$prefix" version "$version" --no-git-tag-version --allow-same-version >/dev/null
`,
  );

  writeExecutable(
    join(workdir, 'bin/mise'),
    `#!/usr/bin/env bash
set -euo pipefail
echo "$*" >>"$PWD/mise.calls"
`,
  );

  writeExecutable(
    join(workdir, 'bin/uv'),
    `#!/usr/bin/env bash
set -euo pipefail
echo "$*" >>"$PWD/uv.calls"

if [[ "\${1:-}" != "version" ]]; then
  echo "Unexpected uv command: $*" >&2
  exit 1
fi

shift
directory="."

if [[ "\${1:-}" == "--directory" ]]; then
  directory="$2"
  shift 2
fi

version="\${1:-}"
mkdir -p "$directory"
cat >"$directory/pyproject.toml" <<PYPROJECT
[project]
version = "$version"
PYPROJECT
`,
  );
};

const assertCommandPassed = (result) => {
  assert.equal(result.status, 0, result.stderr || result.stdout);
};

const assertPackageVersions = (fixture, expected) => {
  assert.equal(packageVersion(fixture.path), expected);
  assert.equal(packageVersion(fixture.file('server')), expected);
  assert.equal(packageVersion(fixture.file('packages/cli')), expected);
  assert.equal(packageVersion(fixture.file('web')), expected);
  assert.equal(packageVersion(fixture.file('e2e')), expected);
  assert.equal(packageVersion(fixture.file('packages/sdk')), expected);
};

const npmCalls = (fixture) => fixture.readFile('npm.calls').trim().split('\n');

test('starts an RC from the server version when the root package is stale', (t) => {
  const fixture = makeFixture(t, { rootVersion: '2.7.5', serverVersion: '3.0.0', mobileBuild: 3047 });

  const result = fixture.run('-s', 'minor', '-m', 'true', '-r', 'true');

  assertCommandPassed(result);
  assertPackageVersions(fixture, '3.1.0-rc.0');
  assert.ok(npmCalls(fixture).includes('version preminor --preid=rc --no-git-tag-version'));
  assert.match(fixture.readFile('mobile/pubspec.yaml'), /version: 3\.1\.0-rc\.0\+3048/);
  assert.match(fixture.readFile('mobile/android/fastlane/Fastfile'), /"android\.injected\.version\.name" => "3\.1\.0-rc\.0"/);
  assert.match(fixture.readFile('mobile/android/fastlane/Fastfile'), /"android\.injected\.version\.code" => 3048/);
  assert.match(fixture.readFile('mobile/ios/Runner/Info.plist'), /<string>3\.1\.0<\/string>/);
  assert.match(fixture.readFile('uv.calls'), /version --directory machine-learning 3\.1\.0rc0/);
  assert.equal(fixture.hasFile('archive-version.calls'), false);
  assert.match(fixture.readFile('github_env'), /IMMICH_VERSION=v3\.1\.0-rc\.0/);
});

test('iterates an existing RC', (t) => {
  const fixture = makeFixture(t, { rootVersion: '2.7.5', serverVersion: '3.1.0-rc.0', mobileBuild: 3048 });

  const result = fixture.run('-m', 'false', '-r', 'true');

  assertCommandPassed(result);
  assertPackageVersions(fixture, '3.1.0-rc.1');
  assert.ok(npmCalls(fixture).includes('version prerelease --no-git-tag-version'));
  assert.equal(npmCalls(fixture).some((call) => call.startsWith('version prerelease --preid')), false);
  assert.match(fixture.readFile('mobile/pubspec.yaml'), /version: 3\.1\.0-rc\.1\+3048/);
  assert.match(fixture.readFile('uv.calls'), /version --directory machine-learning 3\.1\.0rc1/);
  assert.equal(fixture.hasFile('archive-version.calls'), false);
});

test('finalizes an existing RC when rc is false', (t) => {
  const fixture = makeFixture(t, { rootVersion: '2.7.5', serverVersion: '3.1.0-rc.1', mobileBuild: 3048 });

  const result = fixture.run('-m', 'false', '-r', 'false');

  assertCommandPassed(result);
  assertPackageVersions(fixture, '3.1.0');
  assert.match(fixture.readFile('mobile/pubspec.yaml'), /version: 3\.1\.0\+3048/);
  assert.match(fixture.readFile('mobile/ios/Runner/Info.plist'), /<string>3\.1\.0<\/string>/);
  assert.match(fixture.readFile('uv.calls'), /version --directory machine-learning 3\.1\.0/);
  assert.match(fixture.readFile('archive-version.calls'), /3\.1\.0/);
});

test('bumps a normal patch release', (t) => {
  const fixture = makeFixture(t, { rootVersion: '2.7.5', serverVersion: '3.1.0', mobileBuild: 3048 });

  const result = fixture.run('-s', 'patch', '-m', 'true');

  assertCommandPassed(result);
  assertPackageVersions(fixture, '3.1.1');
  assert.match(fixture.readFile('mobile/pubspec.yaml'), /version: 3\.1\.1\+3049/);
  assert.match(fixture.readFile('uv.calls'), /version --directory machine-learning 3\.1\.1/);
  assert.match(fixture.readFile('archive-version.calls'), /3\.1\.1/);
});

test('bumps mobile only', (t) => {
  const fixture = makeFixture(t, { rootVersion: '2.7.5', serverVersion: '3.1.0', mobileBuild: 3048 });

  const result = fixture.run('-m', 'true');

  assertCommandPassed(result);
  assert.equal(packageVersion(fixture.path), '2.7.5');
  assert.equal(packageVersion(fixture.file('server')), '3.1.0');
  assert.match(fixture.readFile('mobile/pubspec.yaml'), /version: 3\.1\.0\+3049/);
  assert.equal(fixture.hasFile('uv.calls'), false);
  assert.equal(fixture.hasFile('archive-version.calls'), false);
});

test('rejects a server bump while on an RC', (t) => {
  const fixture = makeFixture(t, { rootVersion: '2.7.5', serverVersion: '3.1.0-rc.0', mobileBuild: 3048 });

  const result = fixture.run('-s', 'patch', '-r', 'true');

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Cannot bump server while on an RC/);
  assert.equal(packageVersion(fixture.path), '2.7.5');
  assert.equal(packageVersion(fixture.file('server')), '3.1.0-rc.0');
});

test('rejects a server bump while finalizing an RC', (t) => {
  const fixture = makeFixture(t, { rootVersion: '2.7.5', serverVersion: '3.1.0-rc.1', mobileBuild: 3048 });

  const result = fixture.run('-s', 'patch', '-r', 'false');

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /Cannot bump server while on an RC/);
  assert.equal(packageVersion(fixture.file('server')), '3.1.0-rc.1');
});
