import { CommandFactory } from 'nest-commander';
import { Worker } from 'node:worker_threads';
import { ImmichAdminModule } from 'src/app.module';
import { LogLevel } from 'src/config';
import { getWorkers } from 'src/utils/workers';
const immichApp = process.argv[2] || process.env.IMMICH_APP;

if (process.argv[2] === immichApp) {
  process.argv.splice(2, 1);
}

async function bootstrapImmichAdmin() {
  process.env.IMMICH_LOG_LEVEL = LogLevel.WARN;
  await CommandFactory.run(ImmichAdminModule);
}

function bootstrapWorker(name: string) {
  console.log(`Starting ${name} worker`);
  const worker = new Worker(`./dist/workers/${name}.js`);
  worker.on('exit', (exitCode) => {
    if (exitCode !== 0) {
      console.error(`${name} worker exited with code ${exitCode}`);
      process.exit(exitCode);
    }
  });
}

function bootstrap() {
  switch (immichApp) {
    case 'immich-admin': {
      process.title = 'immich_admin_cli';
      return bootstrapImmichAdmin();
    }
    case 'immich': {
      if (!process.env.IMMICH_WORKERS_INCLUDE) {
        process.env.IMMICH_WORKERS_INCLUDE = 'api';
      }
      break;
    }
    case 'microservices': {
      if (!process.env.IMMICH_WORKERS_INCLUDE) {
        process.env.IMMICH_WORKERS_INCLUDE = 'microservices';
      }
      break;
    }
  }
  process.title = 'immich';
  for (const worker of getWorkers()) {
    bootstrapWorker(worker);
  }
}

void bootstrap();
