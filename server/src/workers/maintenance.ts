import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { configureExpress, configureTelemetry } from 'src/app.common';
import { MaintenanceModule } from 'src/app.module';
import { MaintenanceWorkerRepository } from 'src/repositories/maintenance-worker.repository';
import { isStartUpError } from 'src/utils/misc';

async function bootstrap() {
  process.title = 'immich-maintenance';

  configureTelemetry();

  const app = await NestFactory.create<NestExpressApplication>(MaintenanceModule, { bufferLogs: true });
  const maintenanceWorkerRepository = app.get(MaintenanceWorkerRepository);
  maintenanceWorkerRepository.setCloseFn(() => app.close());

  configureExpress(app, {
    permitSwaggerWrite: false,
    ssr: false,
  });

  void maintenanceWorkerRepository.logSecret();
}

bootstrap().catch((error) => {
  if (!isStartUpError(error)) {
    console.error(error);
  }
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
});
