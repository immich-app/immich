import { bootstrap as admin } from './immich-admin/main';
import { bootstrap as server } from './immich/main';
import { bootstrap as microservices } from './microservices/main';

const immichApp = process.argv[2] || process.env.IMMICH_APP;

if (process.argv[2] === immichApp) {
  process.argv.splice(2, 1);
}

function bootstrap() {
  switch (immichApp) {
    case 'immich': {
      process.title = 'immich_server';
      return server();
    }
    case 'microservices': {
      process.title = 'immich_microservices';
      return microservices();
    }
    case 'immich-admin': {
      process.title = 'immich_admin_cli';
      return admin();
    }
    default: {
      throw new Error(`Invalid app name: ${immichApp}. Expected one of immich|microservices|cli`);
    }
  }
}
void bootstrap();
