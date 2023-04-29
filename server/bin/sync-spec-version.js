const spec = require('../immich-openapi-specs.json');
const pkg = require('../package.json');
const path = require('path');
const fs = require('fs');
spec.info.version = pkg.version;
fs.writeFileSync(path.join(__dirname, '../immich-openapi-specs.json'), JSON.stringify(spec, null, 2));
