import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './middlewares/redis-io.adapter.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  app.set('trust proxy');

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  await app.listen(3000, () => {
    if (process.env.NODE_ENV == 'development') {
      Logger.log('Running Immich Server in DEVELOPMENT environment', 'ImmichServer');
    }

    if (process.env.NODE_ENV == 'production') {
      Logger.log('Running Immich Server in PRODUCTION environment', 'ImmichServer');
    }
  });
}
bootstrap();
