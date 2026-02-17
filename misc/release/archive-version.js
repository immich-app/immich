#! /usr/bin/env node
const { readFileSync, writeFileSync } = require('node:fs');

const asVersion = (item) => {
  const { label, url } = item;
  const [major, minor, patch] = label.substring(1).split('.').map(Number);
  return { major, minor, patch, label, url };
};

const nextVersion = process.argv[2];
if (!nextVersion) {
  console.log('Usage: archive-version.js <version>');
  process.exit(1);
}

const filename = './docs/static/archived-versions.json';
let versions = JSON.parse(readFileSync(filename));
const newVersion = {
  label: `v${nextVersion}`,
  url: `https://docs.v${nextVersion}.archive.immich.app`,
};

let lastVersion = asVersion(newVersion);
for (const item of versions) {
  const version = asVersion(item);
  // only keep the latest patch version for each minor release
  if (
    lastVersion.major === version.major &&
    lastVersion.minor === version.minor &&
    lastVersion.patch >= version.patch
  ) {
    versions = versions.filter((item) => item.label !== version.label);
    console.log(
      `Removed ${version.label} (replaced with ${lastVersion.label})`
    );
    continue;
  }

  lastVersion = version;
}

writeFileSync(
  filename,
  JSON.stringify([newVersion, ...versions], null, 2) + '\n'
);
