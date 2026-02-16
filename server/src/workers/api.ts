import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import inspector from 'node:inspector';
import { isMainThread, workerData } from 'node:worker_threads';
import { configureExpress, configureTelemetry } from 'src/app.common';
import { ApiModule } from 'src/app.module';
import { AppRepository } from 'src/repositories/app.repository';
import { ApiService } from 'src/services/api.service';
import { isStartUpError } from 'src/utils/misc';

export async function bootstrap() {
  process.title = 'immich-api';

  const { inspectorPort } = workerData ?? {};
  if (inspectorPort) {
    inspector.open(inspectorPort, '0.0.0.0', false);
  }

  configureTelemetry();

  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { bufferLogs: true });
  app.get(AppRepository).setCloseFn(() => app.close());

  void configureExpress(app, {
    ssr: ApiService,
  });
}

if (!isMainThread || process.send) {
  bootstrap().catch((error) => {
    if (!isStartUpError(error)) {
      console.error(error);
    }

    process.exit(1);
  });
}
