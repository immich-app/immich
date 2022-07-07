import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './middlewares/redis-io.adapter.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy');

  if (process.env.NODE_ENV === 'development') {
    app.enableCors();
  }

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('Immich')
    .setDescription('Immich API')
    .setVersion('1.17.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addServer('/api')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Immich API Documentation',
  });

  await app.listen(3001, () => {
    if (process.env.NODE_ENV == 'development') {
      Logger.log('Running Immich Server in DEVELOPMENT environment', 'ImmichServer');
    }

    if (process.env.NODE_ENV == 'production') {
      Logger.log('Running Immich Server in PRODUCTION environment', 'ImmichServer');
    }
  });
}
bootstrap();
