import { getLogLevels, SERVER_VERSION } from '@app/domain';
import { RedisIoAdapter } from '@app/infra';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroservicesModule } from './microservices.module';
import { ProcessorService } from './processor.service';

const logger = new Logger('ImmichMicroservice');

async function bootstrap() {
  const app = await NestFactory.create(MicroservicesModule, {
    logger: getLogLevels(),
  });

  await app.get(ProcessorService).init();

  const listeningPort = Number(process.env.MICROSERVICES_PORT) || 3002;

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  await app.listen(listeningPort, () => {
    const envName = (process.env.NODE_ENV || 'development').toUpperCase();
    logger.log(
      `Running Immich Microservices in ${envName} environment - version ${SERVER_VERSION} - Listening on port: ${listeningPort}`,
    );
  });
}
bootstrap();
