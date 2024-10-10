import { NestFactory } from '@nestjs/core';
import { isMainThread } from 'node:worker_threads';
import { MicroservicesModule } from 'src/app.module';
import { serverVersion } from 'src/constants';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { isStartUpError } from 'src/services/storage.service';
import { otelStart } from 'src/utils/instrumentation';

export async function bootstrap() {
  const otelPort = Number.parseInt(process.env.IMMICH_MICROSERVICES_METRICS_PORT ?? '8082');

  otelStart(otelPort);

  const app = await NestFactory.create(MicroservicesModule, { bufferLogs: true });
  const logger = await app.resolve(ILoggerRepository);
  logger.setContext('Bootstrap');
  app.useLogger(logger);
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  await app.listen(0);

  const configRepository = app.get<IConfigRepository>(IConfigRepository);
  const { environment } = configRepository.getEnv();
  logger.log(`Immich Microservices is running [v${serverVersion}] [${environment}] `);
}

if (!isMainThread) {
  bootstrap().catch((error) => {
    if (!isStartUpError(error)) {
      console.error(error);
    }
    throw error;
  });
}
