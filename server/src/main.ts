import 'module-alias/register.js';

import { bootstrap as cli } from './cli/immich.js';
import { bootstrap as immich } from './immich/main.js';
import { bootstrap as microservices } from './microservices/main.js';

const immichApp = process.argv[2] || process.env.IMMICH_APP;

if (process.argv[2] === immichApp) {
  process.argv.splice(2, 1);
}

function bootstrap() {
  switch (immichApp) {
    case 'immich':
      return immich();
    case 'microservices':
      return microservices();
    case 'cli':
      return cli();
    default:
      console.log(`Invalid app name: ${immichApp}. Expected one of immich|microservices|cli`);
      process.exit(1);
  }
}
bootstrap();
