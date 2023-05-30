import {
  getLogLevels,
  IMMICH_ACCESS_COOKIE,
  IMMICH_API_KEY_HEADER,
  IMMICH_API_KEY_NAME,
  MACHINE_LEARNING_ENABLED,
  SearchService,
  SERVER_VERSION,
  StorageService,
} from '@app/domain';
import { RedisIoAdapter } from '@app/infra';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { json } from 'body-parser';
import cookieParser from 'cookie-parser';
import { writeFileSync } from 'fs';
import path from 'path';
import { AppModule } from './app.module';
import { patchOpenAPI } from './utils/patch-open-api.util';

const logger = new Logger('ImmichServer');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: getLogLevels(),
  });

  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
  app.set('etag', 'strong');
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  if (process.env.NODE_ENV === 'development') {
    app.enableCors();
  }

  const serverPort = Number(process.env.SERVER_PORT) || 3001;

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('Immich')
    .setDescription('Immich API')
    .setVersion(SERVER_VERSION)
    .addBearerAuth({
      type: 'http',
      scheme: 'Bearer',
      in: 'header',
    })
    .addCookieAuth(IMMICH_ACCESS_COOKIE)
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: IMMICH_API_KEY_HEADER,
      },
      IMMICH_API_KEY_NAME,
    )
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

  app.get(StorageService).init();

  await app.listen(serverPort, () => {
    if (process.env.NODE_ENV == 'development') {
      // Generate API Documentation only in development mode
      const outputPath = path.resolve(process.cwd(), 'immich-openapi-specs.json');
      writeFileSync(outputPath, JSON.stringify(patchOpenAPI(apiDocument), null, 2), { encoding: 'utf8' });
    }

    const envName = (process.env.NODE_ENV || 'development').toUpperCase();
    logger.log(
      `Running Immich Server in ${envName} environment - version ${SERVER_VERSION} - Listening on port: ${serverPort}`,
    );
  });

  const searchService = app.get(SearchService);

  logger.warn(`Machine learning is ${MACHINE_LEARNING_ENABLED ? 'enabled' : 'disabled'}`);
  logger.warn(`Search is ${searchService.isEnabled() ? 'enabled' : 'disabled'}`);
}
bootstrap();
