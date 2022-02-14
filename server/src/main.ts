import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './middlewares/redis-io.adapter.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy');

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  await app.listen(3000);
}
bootstrap();
