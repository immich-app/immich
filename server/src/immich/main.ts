import { getLogLevels, SERVER_VERSION } from '@app/domain';
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
const envName = (process.env.NODE_ENV || 'development').toUpperCase();
const port = Number(process.env.SERVER_PORT) || 3001;
const isDev = process.env.NODE_ENV === 'development';

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: getLogLevels() });

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
  const server = await app.listen(port);
  server.requestTimeout = 30 * 60 * 1000;

  logger.log(`Immich Server is listening on ${port} [v${SERVER_VERSION}] [${envName}] `);
}
