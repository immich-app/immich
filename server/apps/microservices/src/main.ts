import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SERVER_VERSION } from '@app/domain';
import { getLogLevels } from '@app/common';
import { RedisIoAdapter } from '../../immich/src/middlewares/redis-io.adapter.middleware';
import { MicroservicesModule } from './microservices.module';

const logger = new Logger('ImmichMicroservice');

async function bootstrap() {
  const app = await NestFactory.create(MicroservicesModule, {
    logger: getLogLevels(),
  });

  const listeningPort = Number(process.env.MICROSERVICES_PORT) || 3002;

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(listeningPort, () => {
    const envName = (process.env.NODE_ENV || 'development').toUpperCase();
    logger.log(
      `Running Immich Microservices in ${envName} environment - version ${SERVER_VERSION} - Listening on port: ${listeningPort}`,
    );
  });
}
bootstrap();
