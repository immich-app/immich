import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import inspector from 'node:inspector';
import { isMainThread, workerData } from 'node:worker_threads';
import { configureExpress, configureTelemetry } from 'src/app.common';
import { MaintenanceModule } from 'src/app.module';
import { SocketIoAdapter } from 'src/enum';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service';
import { AppRepository } from 'src/repositories/app.repository';
import { isStartUpError } from 'src/utils/misc';

export async function bootstrap() {
  process.title = 'immich-maintenance';

  const { inspectorPort } = workerData ?? {};
  if (inspectorPort) {
    inspector.open(inspectorPort, '0.0.0.0', false);
  }

  configureTelemetry();

  const app = await NestFactory.create<NestExpressApplication>(MaintenanceModule, { bufferLogs: true });
  app.get(AppRepository).setCloseFn(() => app.close());

  void configureExpress(app, {
    permitSwaggerWrite: false,
    ssr: MaintenanceWorkerService,
    // Use BroadcastChannel instead of Postgres adapter to avoid crash when
    // pg_terminate_backend() kills all database connections during restore
    socketIoAdapter: SocketIoAdapter.BroadcastChannel,
  });
}

if (!isMainThread) {
  bootstrap().catch((error) => {
    if (!isStartUpError(error)) {
      console.error(error);
    }

    process.exit(1);
  });
}
