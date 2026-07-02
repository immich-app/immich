// Server-side roundtrip: load the napi addon and call into the shared core.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const core = require('./immich_core_napi.node');

const version = core.coreVersion();
console.log(`NAPI core_version = ${version}`);

const hash = core.sha1Hex(Buffer.from('abc'));
console.log(`NAPI sha1Hex("abc") = ${hash}`);

if (hash !== 'a9993e364706816aba3e25717850c26c9cd0d89d') {
  console.error('NAPI sha1 mismatch');
  process.exit(1);
}
console.log('NAPI roundtrip OK');
