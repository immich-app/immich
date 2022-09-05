import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOSTNAME || 'immich_redis',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: process.env.REDIS_DBINDEX || '0',
      password: process.env.REDIS_PASSWORD || undefined,
      path: process.env.REDIS_SOCKET || undefined,
    },
  });

  await app.listen();

  if (process.env.NODE_ENV == 'development') {
    Logger.log(
      'Running Immich Machine Learning in DEVELOPMENT environment',
      'IMMICH MICROSERVICES',
    );
  } else if (process.env.NODE_ENV == 'production') {
    Logger.log(
      'Running Immich Machine Learning in PRODUCTION environment',
      'IMMICH MICROSERVICES',
    );
  }
}

bootstrap();
