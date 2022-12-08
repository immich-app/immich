import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { writeFileSync } from 'fs';
import path from 'path';
import { AppModule } from './app.module';
import { serverVersion } from './constants/server_version.constant';
import { RedisIoAdapter } from './middlewares/redis-io.adapter.middleware';
import { json } from 'body-parser';
import { patchOpenAPI } from './utils/patch-open-api.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy');
  app.set('etag', 'strong');
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  if (process.env.NODE_ENV === 'development') {
    app.enableCors();
  }

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('Immich')
    .setDescription('Immich API')
    .setVersion(`${serverVersion.major}.${serverVersion.minor}.${serverVersion.patch}`)
    .addBearerAuth({
      type: 'http',
      scheme: 'Bearer',
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
      writeFileSync(outputPath, JSON.stringify(patchOpenAPI(apiDocument), null, 2), { encoding: 'utf8' });
      Logger.log(
        `Running Immich Server in DEVELOPMENT environment - version ${serverVersion.major}.${serverVersion.minor}.${serverVersion.patch}`,
        'ImmichServer',
      );
    }

    if (process.env.NODE_ENV == 'production') {
      Logger.log(
        `Running Immich Server in PRODUCTION environment - version ${serverVersion.major}.${serverVersion.minor}.${serverVersion.patch}`,
        'ImmichServer',
      );
    }
  });
}
bootstrap();
