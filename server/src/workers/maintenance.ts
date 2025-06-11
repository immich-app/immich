import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { isMainThread } from 'node:worker_threads';
import { ApiModule, MaintenanceModule } from 'src/app.module';
import { excludePaths, serverVersion } from 'src/constants';
import { ImmichEnvironment } from 'src/enum';
import { WebSocketAdapter } from 'src/middleware/websocket.adapter';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ApiService } from 'src/services/api.service';
import { isStartUpError } from 'src/utils/misc';

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MaintenanceModule, { bufferLogs: true });
  const logger = await app.resolve(LoggingRepository);
  const configRepository = app.get(ConfigRepository);

  const { environment, host, network } = configRepository.getEnv();
  const isDev = environment === ImmichEnvironment.DEVELOPMENT;

  logger.setContext('Bootstrap');
  app.useLogger(logger);
  app.set('trust proxy', ['loopback', ...network.trustedProxies]);
  app.set('etag', 'strong');
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.useWebSocketAdapter(new WebSocketAdapter(app));

  if (isDev) {
    app.enableCors();
  }

  app.setGlobalPrefix('api', { exclude: excludePaths });

  app.use(app.get(ApiService).ssr(excludePaths));

  await (host ? app.listen(2283, host) : app.listen(2283));

  logger.log(`Immich Maintenance is listening on ${await app.getUrl()} [v${serverVersion}] [${environment}] `);
}

if (!isMainThread) {
  bootstrap().catch((error) => {
    if (!isStartUpError(error)) {
      console.error(error);
    }
    throw error;
  });
}
