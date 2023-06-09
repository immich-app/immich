import { getLogLevels, SERVER_VERSION } from '@app/domain';
import { RedisIoAdapter } from '@app/infra';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppService } from './app.service';
import { MicroservicesModule } from './microservices.module';

const logger = new Logger('ImmichMicroservice');
const port = Number(process.env.MICROSERVICES_PORT) || 3002;
const envName = (process.env.NODE_ENV || 'development').toUpperCase();

export async function bootstrap() {
  const app = await NestFactory.create(MicroservicesModule, { logger: getLogLevels() });

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  await app.get(AppService).init();
  await app.listen(port);

  logger.log(`Immich Microservices is listening on ${port} [v${SERVER_VERSION}] [${envName}] `);
}
