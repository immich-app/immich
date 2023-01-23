import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.MACHINE_LEARNING_PORT) || 3003;

  await app.listen(port, () => {
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
