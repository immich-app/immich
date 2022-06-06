import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroservicesModule } from './microservices.module';

async function bootstrap() {
  const app = await NestFactory.create(MicroservicesModule);

  await app.listen(3000, () => {
    if (process.env.NODE_ENV == 'development') {
      Logger.log('Running Immich Microservices in DEVELOPMENT environment', 'ImmichMicroservice');
    }

    if (process.env.NODE_ENV == 'production') {
      Logger.log('Running Immich Microservices in PRODUCTION environment', 'ImmichMicroservice');
    }
  });
}
bootstrap();
