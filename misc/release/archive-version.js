#! /usr/bin/env node
const { readFileSync, writeFileSync } = require('node:fs');

const lastVersion = process.argv[2];
if (!lastVersion) {
  console.log('Usage: archive-version.js <version>');
  process.exit(1);
}

const filename = './docs/static/archived-versions.json';
const oldVersions = JSON.parse(readFileSync(filename));
const newVersions = [
  { label: lastVersion, url: `https://v${lastVersion}.archive.immich.app` },
  ...oldVersions,
];

writeFileSync(filename, JSON.stringify(newVersions, null, 2) + '\n');
