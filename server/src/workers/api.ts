import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { configureExpress, configureTelemetry } from 'src/app.common.js';
import { ApiModule } from 'src/app.module.js';
import { AppRepository } from 'src/repositories/app.repository.js';
import { ApiService } from 'src/services/api.service.js';
import { isStartUpError } from 'src/utils/misc.js';

async function bootstrap() {
  process.title = 'immich-api';

  configureTelemetry();

  const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
    bufferLogs: true,
    routeConflictPolicy: { duplicate: 'error' },
    routeResolutionStrategy: 'specificity',
  });
  app.get(AppRepository).setCloseFn(() => app.close());

  void configureExpress(app, {
    ssr: ApiService,
  });
}

bootstrap().catch((error) => {
  if (!isStartUpError(error)) {
    console.error(error);
  }
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
