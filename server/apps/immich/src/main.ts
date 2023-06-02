import { getLogLevels, MACHINE_LEARNING_ENABLED, SearchService, SERVER_VERSION } from '@app/domain';
import { RedisIoAdapter } from '@app/infra';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { useSwagger } from './app.utils';

const logger = new Logger('ImmichServer');
const isDev = process.env.NODE_ENV === 'development';
const serverPort = Number(process.env.SERVER_PORT) || 3001;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: getLogLevels(),
  });

  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  app.set('etag', 'strong');
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  if (isDev) {
    app.enableCors();
  }
  app.useWebSocketAdapter(new RedisIoAdapter(app));
  useSwagger(app, isDev);
  await app.get(AppService).init();

  await app.listen(serverPort, () => {
    const envName = (process.env.NODE_ENV || 'development').toUpperCase();
    logger.log(
      `Running Immich Server in ${envName} environment - version ${SERVER_VERSION} - Listening on port: ${serverPort}`,
    );
  });

  const searchService = app.get(SearchService);

  logger.warn(`Machine learning is ${MACHINE_LEARNING_ENABLED ? 'enabled' : 'disabled'}`);
  logger.warn(`Search is ${searchService.isEnabled() ? 'enabled' : 'disabled'}`);
}
bootstrap();
