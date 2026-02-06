import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { OperationObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { endpointTags, serverVersion } from 'src/constants';
import { ImmichCookie, ImmichHeader, MetadataKey } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';

export class ImmichStartupError extends Error {}
export const isStartUpError = (error: unknown): error is ImmichStartupError => error instanceof ImmichStartupError;

export const getKeyByValue = (object: Record<string, unknown>, value: unknown) =>
  Object.keys(object).find((key) => object[key] === value);

export const getMethodNames = (instance: any) => {
  const prototype = Object.getPrototypeOf(instance);
  const propertyNames = Object.getOwnPropertyNames(prototype);
  return propertyNames.filter((name) => name !== 'constructor' && typeof instance[name] === 'function');
};

export const isConnectionAborted = (error: Error | any) => error.code === 'ECONNABORTED';

export const handlePromiseError = <T>(promise: Promise<T>, logger: LoggingRepository): void => {
  promise.catch((error: Error | any) => logger.error(`Promise error: ${error}`, error?.stack));
};

export const routeToErrorMessage = (methodName: string) =>
  'Failed to ' + methodName.replaceAll(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

export const useSwagger = (app: INestApplication, { write }: { write: boolean }) => {
  const config = new DocumentBuilder()
    .setTitle('App API')
    .setDescription('App API')
    .setVersion(serverVersion.toString())
    .addBearerAuth({
      type: 'http',
      scheme: 'Bearer',
      bearerFormat: 'JWT',
      in: 'header',
    })
    .addCookieAuth(ImmichCookie.AccessToken)
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: ImmichHeader.ApiKey,
      },
      MetadataKey.ApiKeySecurity,
    )
    .addServer('/api')
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    extraModels: [],
  };

  const specification = SwaggerModule.createDocument(app, config, options);

  // Add endpoint tags
  specification.tags = (specification.tags || []).map((tag) => ({
    ...tag,
    description: endpointTags[tag.name as keyof typeof endpointTags] || tag.description,
  }));

  // Add custom extensions from metadata
  for (const path of Object.values(specification.paths)) {
    for (const key of ['get', 'post', 'put', 'delete', 'patch'] as const) {
      const operation = path?.[key] as OperationObject;
      if (!operation) {
        continue;
      }

      // Set operationId to method name
      if (operation.operationId) {
        const methodName = operation.operationId;
        operation.description = operation.description || routeToErrorMessage(methodName);
      }
    }
  }

  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
    },
  };

  SwaggerModule.setup('doc', app, specification, customOptions);

  if (write) {
    const outputPath = path.resolve(process.cwd(), 'server-openapi-specs.json');
    writeFileSync(outputPath, JSON.stringify(specification, null, 2), { encoding: 'utf8' });
  }
};
