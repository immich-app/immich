import { bootstrap as adminCli } from './admin-cli/main';
import { bootstrap as immich } from './immich/main';
import { bootstrap as microservices } from './microservices/main';

const immichApp = process.argv[2] || process.env.IMMICH_APP;

if (process.argv[2] === immichApp) {
  process.argv.splice(2, 1);
}

function bootstrap() {
  switch (immichApp) {
    case 'immich':
      process.title = 'immich_server';
      return immich();
    case 'microservices':
      process.title = 'immich_microservices';
      return microservices();
    case 'admin-cli':
      process.title = 'immich_admin_cli';
      return adminCli();
    default:
      console.log(`Invalid app name: ${immichApp}. Expected one of immich|microservices|cli`);
      process.exit(1);
  }
}
bootstrap();
