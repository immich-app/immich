import { dataSource } from '@app/database/config/database.config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import path from 'path';
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

  const apiDocumentOptions: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const apiDocument = SwaggerModule.createDocument(app, config, apiDocumentOptions);

  SwaggerModule.setup('doc', app, apiDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Immich API Documentation',
  });

  await app.listen(3001, () => {
    if (process.env.NODE_ENV == 'development') {
      // Generate API Documentation only in development mode
      const outputPath = path.resolve(process.cwd(), 'immich-openapi-specs.json');
      writeFileSync(outputPath, JSON.stringify(apiDocument), { encoding: 'utf8' });
      Logger.log('Running Immich Server in DEVELOPMENT environment', 'ImmichServer');
    }

    if (process.env.NODE_ENV == 'production') {
      Logger.log('Running Immich Server in PRODUCTION environment', 'ImmichServer');
    }
  });
}
bootstrap();
