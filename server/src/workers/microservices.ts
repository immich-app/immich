import { NestFactory } from '@nestjs/core';
import { isMainThread } from 'node:worker_threads';
import { MicroservicesModule } from 'src/app.module';
import { envName, serverVersion } from 'src/constants';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { otelSDK } from 'src/utils/instrumentation';

const host = process.env.HOST;

export async function bootstrapMicroservices() {
  otelSDK.start();

  const port = Number(process.env.MICROSERVICES_PORT) || 3002;
  const app = await NestFactory.create(MicroservicesModule, { bufferLogs: true });
  const logger = await app.resolve(ILoggerRepository);
  logger.setAppName('ImmichMicroservices');
  logger.setContext('ImmichMicroservices');
  app.useLogger(logger);
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  await (host ? app.listen(port, host) : app.listen(port));

  logger.log(`Immich Microservices is listening on ${await app.getUrl()} [v${serverVersion}] [${envName}] `);
}

if (!isMainThread) {
  bootstrapMicroservices().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
