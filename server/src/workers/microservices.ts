import { NestFactory } from '@nestjs/core';
import { isMainThread } from 'node:worker_threads';
import { MicroservicesModule } from 'src/app.module';
import { envName, serverVersion } from 'src/constants';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { otelSDK } from 'src/utils/instrumentation';

export async function bootstrap() {
  otelSDK.start();

  const app = await NestFactory.create(MicroservicesModule, { bufferLogs: true });
  const logger = await app.resolve(ILoggerRepository);
  logger.setAppName('ImmichMicroservices');
  logger.setContext('ImmichMicroservices');
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
