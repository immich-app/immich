import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SERVER_VERSION } from 'apps/immich/src/constants/server_version.constant';
import { RedisIoAdapter } from '../../immich/src/middlewares/redis-io.adapter.middleware';
import { MicroservicesModule } from './microservices.module';

const logger = new Logger('ImmichMicroservice');

async function bootstrap() {
  const app = await NestFactory.create(MicroservicesModule);

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  await app.listen(3002, () => {
    const envName = (process.env.NODE_ENV || 'development').toUpperCase();
    logger.log(`Running Immich Microservices in ${envName} environment - version ${SERVER_VERSION}`);
  });
}
bootstrap();
