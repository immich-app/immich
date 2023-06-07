import { bootstrap as immich } from './immich/main';
import { bootstrap as microservices } from './microservices/main';
import { bootstrap as cli } from './cli/immich';

const immichApp = process.env.IMMICH_APP;

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
