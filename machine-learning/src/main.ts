import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const listeningPort: number = isNaN(Number(process.env.MACHINE_LEARNING_PORT))
    ? 3003
    : Number(process.env.MACHINE_LEARNING_PORT);

  await app.listen(listeningPort, () => {
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
