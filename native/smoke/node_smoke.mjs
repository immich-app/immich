import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('./immich_core_napi.node');

const version = core.coreVersion();
console.log(`NAPI core_version = ${version}`);
if (!version) {
  console.error('NAPI empty version');
  process.exit(1);
}
console.log('NAPI roundtrip OK');
