import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

interface Closable {
  close(): Promise<void>;
}

const closables: Closable[] = [];
const gracefullHandler = async () => {
  console.log('Shutting down...');
  for (const closable of closables) {
    await closable.close();
  }
  process.exit(1);
};

process.on('SIGINT', gracefullHandler);
process.on('SIGTERM', gracefullHandler);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  closables.push(app);
  await app.listen(3003, () => {
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
