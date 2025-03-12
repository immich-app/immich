import { NestFactory } from '@nestjs/core';
import { isMainThread } from 'node:worker_threads';
import { TranscoderModule } from 'src/app.module';
import { serverVersion } from 'src/constants';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { isStartUpError } from 'src/utils/misc';
import { ConfigRepository } from 'src/repositories/config.repository';
import { bootstrapTelemetry } from 'src/repositories/telemetry.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

export async function bootstrap() {
  const { telemetry } = new ConfigRepository().getEnv();
  if (telemetry.metrics.size > 0) {
    bootstrapTelemetry(telemetry.microservicesPort);
  }

  const app = await NestFactory.create(TranscoderModule, { bufferLogs: true });
  const logger = await app.resolve(LoggingRepository);
  logger.setContext('Bootstrap');
  app.useLogger(logger);
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  await app.listen(0);

  const configRepository = app.get(ConfigRepository);
  const { environment } = configRepository.getEnv();
  logger.log(`Immich Transcoder is running [v${serverVersion}] [${environment}] `);
}

if (!isMainThread) {
  bootstrap().catch((error) => {
    if (!isStartUpError(error)) {
      console.error(error);
    }
    throw error;
  });
}
