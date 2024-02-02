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
import _ from 'lodash';
import { writeFileSync } from 'node:fs';
import { access, constants } from 'node:fs/promises';
import path, { isAbsolute } from 'node:path';
import { promisify } from 'node:util';

import { applyDecorators, UsePipes, ValidationPipe } from '@nestjs/common';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
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
      case CacheControl.PRIVATE_WITH_CACHE: {
        res.set('Cache-Control', 'private, max-age=86400, no-transform');
        break;
      }

      case CacheControl.PRIVATE_WITHOUT_CACHE: {
        res.set('Cache-Control', 'private, no-cache, no-transform');
        break;
      }
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

function sortKeys<T>(target: T): T {
  if (!target || typeof target !== 'object' || Array.isArray(target)) {
    return target;
  }

  const result: Partial<T> = {};
  const keys = Object.keys(target).sort() as Array<keyof T>;
  for (const key of keys) {
    result[key] = sortKeys(target[key]);
  }
  return result as T;
}

export const routeToErrorMessage = (methodName: string) =>
  'Failed to ' + methodName.replaceAll(/[A-Z]+/g, (letter) => ` ${letter.toLowerCase()}`);

const patchOpenAPI = (document: OpenAPIObject) => {
  document.paths = sortKeys(document.paths);

  if (document.components?.schemas) {
    const schemas = document.components.schemas as Record<string, SchemaObject>;

    document.components.schemas = sortKeys(schemas);

    for (const schema of Object.values(schemas)) {
      if (schema.properties) {
        schema.properties = sortKeys(schema.properties);
      }

      if (schema.required) {
        schema.required = schema.required.sort();
      }
    }
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

      if ((operation.security || []).some((item) => !!item[Metadata.PUBLIC_SECURITY])) {
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

      if (operation.parameters) {
        operation.parameters = _.orderBy(operation.parameters, 'name');
      }
    }
  }

  return document;
};

export const useSwagger = (app: INestApplication, isDevelopment: boolean) => {
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

  const specification = SwaggerModule.createDocument(app, config, options);

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Immich API Documentation',
  };

  SwaggerModule.setup('doc', app, specification, customOptions);

  if (isDevelopment) {
    // Generate API Documentation only in development mode
    const outputPath = path.resolve(process.cwd(), '../open-api/immich-openapi-specs.json');
    writeFileSync(outputPath, JSON.stringify(patchOpenAPI(specification), null, 2), { encoding: 'utf8' });
  }
};
