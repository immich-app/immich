import { IMMICH_ACCESS_COOKIE, IMMICH_API_KEY_HEADER, IMMICH_API_KEY_NAME, SERVER_VERSION } from '@app/domain';
import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { Response } from 'express';
import { writeFileSync } from 'fs';
import path from 'path';
import { Metadata } from './decorators/authenticated.decorator';
import { DownloadArchive } from './modules/download/download.service';

export const handleDownload = (download: DownloadArchive, res: Response) => {
  res.attachment(download.fileName);
  res.setHeader('X-Immich-Content-Length-Hint', download.fileSize);
  res.setHeader('X-Immich-Archive-File-Count', download.fileCount);
  res.setHeader('X-Immich-Archive-Complete', `${download.complete}`);
  return download.stream;
};

function sortKeys<T extends object>(obj: T): T {
  if (!obj) {
    return obj;
  }

  const result: Partial<T> = {};
  const keys = Object.keys(obj).sort() as Array<keyof T>;
  for (const key of keys) {
    result[key] = obj[key];
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
