import {
  CacheControl,
  IMMICH_ACCESS_COOKIE,
  IMMICH_API_KEY_HEADER,
  IMMICH_API_KEY_NAME,
  ImmichFileResponse,
  ImmichReadStream,
  isConnectionAborted,
  serverVersion,
} from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import { HttpException, INestApplication, StreamableFile } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { writeFileSync } from 'fs';
import { access, constants } from 'fs/promises';
import path, { isAbsolute } from 'path';
import { promisify } from 'util';

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

type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

const logger = new ImmichLogger('SendFile');

export const sendFile = async (
  res: Response,
  next: NextFunction,
  handler: () => Promise<ImmichFileResponse>,
): Promise<void> => {
  const _sendFile = (path: string, options: SendFileOptions) =>
    promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

  try {
    const file = await handler();
    switch (file.cacheControl) {
      case CacheControl.PRIVATE_WITH_CACHE:
        res.set('Cache-Control', 'private, max-age=86400, no-transform');
        break;

      case CacheControl.PRIVATE_WITHOUT_CACHE:
        res.set('Cache-Control', 'private, no-cache, no-transform');
        break;
    }

    res.header('Content-Type', file.contentType);

    const options: SendFileOptions = { dotfiles: 'allow' };
    if (!isAbsolute(file.path)) {
      options.root = process.cwd();
    }

    await access(file.path, constants.R_OK);

    return _sendFile(file.path, options);
  } catch (error: Error | any) {
    // ignore client-closed connection
    if (isConnectionAborted(error)) {
      return;
    }

    // log non-http errors
    if (error instanceof HttpException === false) {
      logger.error(`Unable to send file: ${error.name}`, error.stack);
    }

    res.header('Cache-Control', 'none');
    next(error);
  }
};

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

export const routeToErrorMessage = (methodName: string) =>
  'Failed to ' + methodName.replace(/[A-Z]+/g, (letter) => ` ${letter.toLowerCase()}`);

const patchOpenAPI = (document: OpenAPIObject) => {
  document.paths = sortKeys(document.paths);
  if (document.components?.schemas) {
    document.components.schemas = sortKeys(document.components.schemas);
  }

  for (const [key, value] of Object.entries(document.paths)) {
    const newKey = key.replace('/api/', '/');
    delete document.paths[key];
    document.paths[newKey] = value;
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

      if (operation.operationId) {
        // console.log(`${routeToErrorMessage(operation.operationId).padEnd(40)} (${operation.operationId})`);
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
    const outputPath = path.resolve(process.cwd(), '../open-api/immich-openapi-specs.json');
    writeFileSync(outputPath, JSON.stringify(patchOpenAPI(doc), null, 2), { encoding: 'utf8' });
  }
};
