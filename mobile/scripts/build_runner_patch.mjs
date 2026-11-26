// Prevents build_runner crashing when a source file is deleted from a path dependency, which commonly occurs to `generated/openapi` on branch switch
//
// Fixed upstream in 2.15.3 (https://github.com/dart-lang/build/pull/5022), but we can't take that dependency due to Dart analyzer being locked
import { readFileSync, writeFileSync } from 'node:fs';

const packageConfig = new URL('../.dart_tool/package_config.json', import.meta.url);

const config = JSON.parse(readFileSync(packageConfig, 'utf8'));
const buildRunner = new URL(config.packages.find(({ name }) => name === 'build_runner').rootUri);

const file = new URL(`${buildRunner}/lib/src/build_plan/build_plan.dart`);

const buggy = 'for (final id in deletedOutputs) {';
const fixed = 'for (final id in deletedOutputs.difference(buildInputs.deletedSources.build().asSet())) {';

const source = readFileSync(file, 'utf8');
if (source.includes(buggy)) {
  writeFileSync(file, source.replace(buggy, fixed));
  console.log('build_runner patch: stopped deleting removed sources from path dependencies');
}
