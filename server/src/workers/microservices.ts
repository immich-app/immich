import { NestFactory } from '@nestjs/core';
import { isMainThread } from 'node:worker_threads';
import { MicroservicesModule } from 'src/app.module';
import { envName, serverVersion } from 'src/constants';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { otelStart } from 'src/utils/instrumentation';

export async function bootstrap() {
  const otelPort = Number.parseInt(process.env.IMMICH_MICROSERVICES_METRICS_PORT ?? '8082');

  otelStart(otelPort);

  const app = await NestFactory.create(MicroservicesModule, { bufferLogs: true });
  const logger = await app.resolve(ILoggerRepository);
  logger.setAppName('Microservices');
  logger.setContext('Bootstrap');
  app.useLogger(logger);
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  await app.listen(0);

  logger.log(`Immich Microservices is running [v${serverVersion}] [${envName}] `);
}

if (!isMainThread) {
  bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
