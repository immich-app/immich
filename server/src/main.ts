import { bootstrapApi } from 'src/apps/api.main';
import { bootstrapImmichAdmin } from 'src/apps/immich-admin.main';
import { bootstrapMicroservices } from 'src/apps/microservices.main';

const immichApp = process.argv[2] || process.env.IMMICH_APP;

if (process.argv[2] === immichApp) {
  process.argv.splice(2, 1);
}

function bootstrap() {
  switch (immichApp) {
    case 'immich': {
      process.title = 'immich_server';
      return bootstrapApi();
    }
    case 'microservices': {
      process.title = 'immich_microservices';
      return bootstrapMicroservices();
    }
    case 'immich-admin': {
      process.title = 'immich_admin_cli';
      return bootstrapImmichAdmin();
    }
    default: {
      throw new Error(`Invalid app name: ${immichApp}. Expected one of immich|microservices|cli`);
    }
  }
}
void bootstrap();
