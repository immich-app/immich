import { getLogLevels, SERVER_VERSION } from '@app/domain';
import { RedisIoAdapter } from '@app/infra';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppService } from './app.service';
import { MicroservicesModule } from './microservices.module';
import { MetadataExtractionProcessor } from './processors/metadata-extraction.processor';

const logger = new Logger('ImmichMicroservice');

async function bootstrap() {
  const app = await NestFactory.create(MicroservicesModule, {
    logger: getLogLevels(),
  });

  const listeningPort = Number(process.env.MICROSERVICES_PORT) || 3002;

  await app.get(AppService).init();

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  const metadataService = app.get(MetadataExtractionProcessor);

  process.on('uncaughtException', (error: Error | any) => {
    const isCsvError = error.code === 'CSV_RECORD_INCONSISTENT_FIELDS_LENGTH';
    if (!isCsvError) {
      throw error;
    }

    logger.warn('Geocoding csv parse error, trying again without cache...');
    metadataService.init(true);
  });

  await metadataService.init();

  await app.listen(listeningPort, () => {
    const envName = (process.env.NODE_ENV || 'development').toUpperCase();
    logger.log(
      `Running Immich Microservices in ${envName} environment - version ${SERVER_VERSION} - Listening on port: ${listeningPort}`,
    );
  });
}

bootstrap();
