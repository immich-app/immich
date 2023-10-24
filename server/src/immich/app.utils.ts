import {
  IMMICH_ACCESS_COOKIE,
  IMMICH_API_KEY_HEADER,
  IMMICH_API_KEY_NAME,
  ImmichReadStream,
  serverVersion,
} from '@app/domain';
import { INestApplication, StreamableFile } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import path from 'path';

import { applyDecorators, UsePipes, ValidationPipe } from '@nestjs/common';
import { Metadata } from './app.guard';

export function UseValidation() {
  return applyDecorators(
    UsePipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    ),
  );
}

export const asStreamableFile = ({ stream, type, length }: ImmichReadStream) => {
  return new StreamableFile(stream, { type, length });
};

function sortKeys<T>(obj: T): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const result: Partial<T> = {};
  const keys = Object.keys(obj).sort() as Array<keyof T>;
  for (const key of keys) {
    result[key] = sortKeys(obj[key]);
  }
  return result as T;
}

const patchOpenAPI = (document: OpenAPIObject) => {
  document.paths = sortKeys(document.paths);
  if (document.components?.schemas) {
    document.components.schemas = sortKeys(document.components.schemas);
  }

  for (const path of Object.values(document.paths)) {
    const operations = {
      get: path.get,
      put: path.put,
      post: path.post,
      delete: path.delete,
      options: path.options,
      head: path.head,
      patch: path.patch,
      trace: path.trace,
    };

    for (const operation of Object.values(operations)) {
      if (!operation) {
        continue;
      }

      if ((operation.security || []).find((item) => !!item[Metadata.PUBLIC_SECURITY])) {
        delete operation.security;
      }

      if (operation.summary === '') {
        delete operation.summary;
      }

      if (operation.description === '') {
        delete operation.description;
      }
    }
  }

  return document;
};

export const useSwagger = (app: INestApplication, isDev: boolean) => {
  const config = new DocumentBuilder()
    .setTitle('Immich')
    .setDescription('Immich API')
    .setVersion(serverVersion.toString())
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

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const doc = SwaggerModule.createDocument(app, config, options);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Immich API Documentation',
  };

  SwaggerModule.setup('doc', app, doc, customOptions);

  if (isDev) {
    // Generate API Documentation only in development mode
    const outputPath = path.resolve(process.cwd(), 'immich-openapi-specs.json');
    writeFileSync(outputPath, JSON.stringify(patchOpenAPI(doc), null, 2), { encoding: 'utf8' });
  }
};
