import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(3001, () => {
    if (process.env.NODE_ENV == 'development') {
      Logger.log(
        'Running Immich Machine Learning in DEVELOPMENT environment',
        'IMMICH MICROSERVICES',
      );
    }

    if (process.env.NODE_ENV == 'production') {
      Logger.log(
        'Running Immich Machine Learning in PRODUCTION environment',
        'IMMICH MICROSERVICES',
      );
    }
  });
}

bootstrap();
