import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import _ from 'lodash';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { SystemConfig } from 'src/config';
import { CLIP_MODEL_INFO, isDev, serverVersion } from 'src/constants';
import { ImmichCookie, ImmichHeader } from 'src/dtos/auth.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { Metadata } from 'src/middleware/auth.guard';

/**
 * @returns a list of strings representing the keys of the object in dot notation
 */
export const getKeysDeep = (target: unknown, path: string[] = []) => {
  if (!target || typeof target !== 'object') {
    return [];
  }

  const obj = target as object;

  const properties: string[] = [];
  for (const key of Object.keys(obj as object)) {
    const value = obj[key as keyof object];
    if (value === undefined) {
      continue;
    }

    if (_.isObject(value) && !_.isArray(value)) {
      properties.push(...getKeysDeep(value, [...path, key]));
      continue;
    }

    properties.push([...path, key].join('.'));
  }

  return properties;
};

export const unsetDeep = (object: unknown, key: string) => {
  const parts = key.split('.');
  while (parts.length > 0) {
    _.unset(object, parts);
    parts.pop();
    if (!_.isEmpty(_.get(object, parts))) {
      break;
    }
  }

  return _.isEmpty(object) ? undefined : object;
};

const isMachineLearningEnabled = (machineLearning: SystemConfig['machineLearning']) => machineLearning.enabled;
export const isSmartSearchEnabled = (machineLearning: SystemConfig['machineLearning']) =>
  isMachineLearningEnabled(machineLearning) && machineLearning.clip.enabled;
export const isFacialRecognitionEnabled = (machineLearning: SystemConfig['machineLearning']) =>
  isMachineLearningEnabled(machineLearning) && machineLearning.facialRecognition.enabled;
export const isDuplicateDetectionEnabled = (machineLearning: SystemConfig['machineLearning']) =>
  isSmartSearchEnabled(machineLearning) && machineLearning.duplicateDetection.enabled;

export const isConnectionAborted = (error: Error | any) => error.code === 'ECONNABORTED';

export const handlePromiseError = <T>(promise: Promise<T>, logger: ILoggerRepository): void => {
  promise.catch((error: Error | any) => logger.error(`Promise error: ${error}`, error?.stack));
};

export interface OpenGraphTags {
  title: string;
  description: string;
  imageUrl?: string;
}

function cleanModelName(modelName: string): string {
  const token = modelName.split('/').at(-1);
  if (!token) {
    throw new Error(`Invalid model name: ${modelName}`);
  }

  return token.replaceAll(':', '_');
}

export function getCLIPModelInfo(modelName: string) {
  const modelInfo = CLIP_MODEL_INFO[cleanModelName(modelName)];
  if (!modelInfo) {
    throw new Error(`Unknown CLIP model: ${modelName}`);
  }

  return modelInfo;
}

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

export const useSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Immich')
    .setDescription('Immich API')
    .setVersion(serverVersion.toString())
    .addBearerAuth({
      type: 'http',
      scheme: 'Bearer',
      in: 'header',
    })
    .addCookieAuth(ImmichCookie.ACCESS_TOKEN)
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: ImmichHeader.API_KEY,
      },
      Metadata.API_KEY_SECURITY,
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

  if (isDev()) {
    // Generate API Documentation only in development mode
    const outputPath = path.resolve(process.cwd(), '../open-api/immich-openapi-specs.json');
    writeFileSync(outputPath, JSON.stringify(patchOpenAPI(specification), null, 2), { encoding: 'utf8' });
  }
};
