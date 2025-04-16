import { NestFactory } from '@nestjs/core';
import { isMainThread } from 'node:worker_threads';
import { MicroservicesModule } from 'src/app.module';
import { serverVersion } from 'src/constants';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { bootstrapTelemetry } from 'src/repositories/telemetry.repository';
import { isStartUpError } from 'src/utils/misc';

export async function bootstrap() {
  const { telemetry } = new ConfigRepository().getEnv();
  if (telemetry.metrics.size > 0) {
    bootstrapTelemetry(telemetry.microservicesPort);
  }

  const app = await NestFactory.create(MicroservicesModule, { bufferLogs: true });
  const logger = await app.resolve(LoggingRepository);
  const configRepository = app.get(ConfigRepository);

  const { environment, host } = configRepository.getEnv();

  logger.setContext('Bootstrap');
  app.useLogger(logger);
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  await (host ? app.listen(0, host) : app.listen(0));

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
