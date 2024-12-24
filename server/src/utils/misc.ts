import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import _ from 'lodash';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { SystemConfig } from 'src/config';
import { CLIP_MODEL_INFO, serverVersion } from 'src/constants';
import { ImmichCookie, ImmichHeader, MetadataKey } from 'src/enum';
import { ILoggerRepository } from 'src/interfaces/logger.interface';

export class ImmichStartupError extends Error {}
export const isStartUpError = (error: unknown): error is ImmichStartupError => error instanceof ImmichStartupError;

export const getKeyByValue = (object: Record<string, unknown>, value: unknown) =>
  Object.keys(object).find((key) => object[key] === value);

export const getMethodNames = (instance: any) => {
  const ctx = Object.getPrototypeOf(instance);
  const methods: string[] = [];
  for (const property of Object.getOwnPropertyNames(ctx)) {
    const descriptor = Object.getOwnPropertyDescriptor(ctx, property);
    if (!descriptor || descriptor.get || descriptor.set) {
      continue;
    }

    const handler = instance[property];
    if (typeof handler !== 'function') {
      continue;
    }

    methods.push(property);
  }

  return methods;
};

export const getExternalDomain = (server: SystemConfig['server'], port: number) =>
  server.externalDomain || `http://localhost:${port}`;

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

    if (_.isObject(value) && !_.isArray(value) && !_.isDate(value)) {
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
export const isFaceImportEnabled = (metadata: SystemConfig['metadata']) => metadata.faces.import;

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

const isSchema = (schema: string | ReferenceObject | SchemaObject): schema is SchemaObject => {
  if (typeof schema === 'string' || '$ref' in schema) {
    return false;
  }

  return true;
};

const patchOpenAPI = (document: OpenAPIObject) => {
  document.paths = sortKeys(document.paths);

  if (document.components?.schemas) {
    const schemas = document.components.schemas as Record<string, SchemaObject>;

    document.components.schemas = sortKeys(schemas);

    for (const [schemaName, schema] of Object.entries(schemas)) {
      if (schema.properties) {
        schema.properties = sortKeys(schema.properties);

        for (const [key, value] of Object.entries(schema.properties)) {
          if (typeof value === 'string') {
            continue;
          }

          if (isSchema(value) && value.type === 'number' && value.format === 'float') {
            throw new Error(`Invalid number format: ${schemaName}.${key}=float (use double instead). `);
          }
        }

        if (schema.required) {
          schema.required = schema.required.sort();
        }
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

export const useSwagger = (app: INestApplication, { write }: { write: boolean }) => {
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
      MetadataKey.API_KEY_SECURITY,
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

  if (write) {
    // Generate API Documentation only in development mode
    const outputPath = path.resolve(process.cwd(), '../open-api/immich-openapi-specs.json');
    writeFileSync(outputPath, JSON.stringify(patchOpenAPI(specification), null, 2), { encoding: 'utf8' });
  }
};
