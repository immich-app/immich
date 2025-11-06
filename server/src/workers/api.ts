import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { configureExpress, configureTelemetry } from 'src/app.common';
import { ApiModule } from 'src/app.module';
import { MaintenanceRepository } from 'src/repositories/maintenance.repository';
import { isStartUpError } from 'src/utils/misc';

async function bootstrap() {
  process.title = 'immich-api';

  configureTelemetry();

  const app = await NestFactory.create<NestExpressApplication>(ApiModule, { bufferLogs: true });
  app.get(MaintenanceRepository).setCloseFn(() => app.close());

  void configureExpress(app);
}

bootstrap().catch((error) => {
  if (!isStartUpError(error)) {
    console.error(error);
  }
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
