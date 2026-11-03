import { ExecutionContext, Type } from '@nestjs/common';
import { CUSTOM_ROUTE_ARGS_METADATA, PARAMTYPES_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants.js';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum.js';
import { ApiBodyOptions, OpenAPIObject, StandardSchemaConverter } from '@nestjs/swagger';
import { Request } from 'express';
import { defineMetadata, getMetadata } from 'reflect-metadata/no-conflict';
import z from 'zod';

export type DtoClass<S extends z.ZodType> = {
  new (): z.output<S>;
  readonly schema: S;
};

export const createZodDto = <S extends z.ZodType>(schema: S): DtoClass<S> =>
  class {
    static readonly schema = schema;
  } as unknown as DtoClass<S>;

type JsonSchema = Record<string, unknown>;
type GeneratedSchema = { $ref?: string; definitions?: Record<string, JsonSchema> } & JsonSchema;
type SchemaObject = Extract<ApiBodyOptions, { schema: unknown }>['schema'];
type SchemaReference = { '~standard': z.ZodType['~standard']; schema: z.ZodType; name?: string };
type RouteArgument = { index: number; data?: unknown; factory?: unknown; schema?: unknown };
type SwaggerSchema = { in?: string; type?: unknown; standardSchema?: unknown };
type Parameter = { description?: string; schema?: unknown };

const API_PARAMETERS_METADATA = 'swagger/apiParameters';
const API_RESPONSE_METADATA = 'swagger/apiResponse';

export const registerSchemas = ({ controllers }: { controllers: Type[] }) => {
  for (const controller of controllers) {
    const prototype = controller.prototype as Record<string, unknown>;
    for (const method of Object.getOwnPropertyNames(prototype)) {
      const handler = prototype[method];
      if (method === 'constructor' || typeof handler !== 'function') {
        continue;
      }

      registerRouteArguments(controller, method, handler);
      registerSwaggerSchemas(handler);
    }
  }
};

export const toOpenApiSchema: StandardSchemaConverter = (value) =>
  typeof value === 'object' && value !== null && 'schema' in value && value.schema instanceof z.ZodType
    ? convert(value as SchemaReference)
    : undefined;

export const toOpenApiComponents = (models: unknown[]) => {
  const components: Record<string, SchemaObject> = {};
  for (const model of models) {
    if (isDtoClass(model)) {
      Object.assign(components, convert(toSchemaReference(model, { reference: true })).components);
    }
  }

  return components;
};

export const patchOpenApiParameters = (document: OpenAPIObject) => {
  for (const path of Object.values(document.paths)) {
    for (const operation of Object.values(path)) {
      if (!(typeof operation === 'object' && 'parameters' in operation && Array.isArray(operation.parameters))) {
        continue;
      }

      const parameters = operation.parameters as Parameter[];
      operation.parameters = parameters.map((parameter) => patchOpenApiParameter(parameter));
    }
  }
};

const registerRouteArguments = (controller: Type, method: string, handler: object) => {
  const paramtypes: unknown[] = getMetadata(PARAMTYPES_METADATA, controller.prototype, method) ?? [];
  const routeArguments: Record<string, RouteArgument> = { ...getMetadata(ROUTE_ARGS_METADATA, controller, method) };
  for (const [key, argument] of Object.entries(routeArguments)) {
    const type = paramtypes[argument.index];
    if (argument.schema !== undefined || !isDtoClass(type)) {
      continue;
    }

    const paramtype = Number(key.split(':', 1)[0]);
    if (paramtype === RouteParamtypes.BODY) {
      argument.schema = toSchemaReference(type, { reference: true });
    } else if (paramtype === RouteParamtypes.QUERY || paramtype === RouteParamtypes.PARAM) {
      argument.schema = toSchemaReference(type, { reference: false });
    } else if (paramtype === RouteParamtypes.HEADERS && argument.data === undefined) {
      const schema = toSchemaReference(type, { reference: false });
      delete routeArguments[key];
      routeArguments[`${paramtype}${CUSTOM_ROUTE_ARGS_METADATA}:${argument.index}`] = {
        ...argument,
        factory: requestHeaders,
        schema,
      };
      const parameters: SwaggerSchema[] = getMetadata(API_PARAMETERS_METADATA, handler) ?? [];
      const parameter = { name: undefined, required: true, in: 'header', standardSchema: schema };
      defineMetadata(API_PARAMETERS_METADATA, [...parameters, parameter], handler);
    }
  }

  defineMetadata(ROUTE_ARGS_METADATA, routeArguments, controller, method);
};

const isDtoClass = (value: unknown): value is DtoClass<z.ZodType> =>
  typeof value === 'function' && 'schema' in value && value.schema instanceof z.ZodType;

const toSchemaReference = (dto: DtoClass<z.ZodType>, { reference }: { reference: boolean }): SchemaReference => ({
  '~standard': dto.schema['~standard'],
  schema: dto.schema,
  name: reference ? (z.globalRegistry.get(dto.schema)?.id ?? dto.name) : undefined,
});

const requestHeaders = (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<Request>().headers;

const registerSwaggerSchemas = (handler: object) => {
  for (const key of [API_PARAMETERS_METADATA, API_RESPONSE_METADATA]) {
    const entries: SwaggerSchema[] = Object.values(getMetadata(key, handler) ?? {});
    for (const entry of entries) {
      if (entry.standardSchema === undefined && isDtoClass(entry.type)) {
        entry.standardSchema = toSchemaReference(entry.type, {
          reference: entry.in === undefined || entry.in === 'body',
        });
      }
    }
  }
};

const patchOpenApiParameter = <T extends Parameter>(parameter: T): T => {
  if (!parameter.schema || typeof parameter.schema !== 'object') {
    return parameter;
  }

  const { schema: originalSchema, ...rest } = parameter;
  const schema = { ...originalSchema } as JsonSchema;
  if (schema.description === parameter.description) {
    delete schema.description;
  }

  const promoted: JsonSchema = {};
  for (const key of Object.keys(schema)) {
    if (!(key === 'deprecated' || key.startsWith('x-'))) {
      continue;
    }

    promoted[key] = schema[key];
    delete schema[key];
  }

  return { ...rest, ...promoted, schema } as T;
};

const convert = ({ schema, name }: SchemaReference) => {
  const { root, definitions } = inlineRoot(z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input' }));
  const components = normalize(name ? { ...definitions, [name]: root } : definitions) as Record<string, SchemaObject>;
  return { schema: name ? { $ref: `#/components/schemas/${name}` } : normalize(root), components };
};

const inlineRoot = ({ definitions = {}, ...root }: GeneratedSchema) => {
  if (typeof root.$ref !== 'string') {
    return { root, definitions };
  }

  const id = root.$ref.replace('#/definitions/', '');
  const { [id]: rootDefinition, ...rest } = definitions;
  return { root: rootDefinition, definitions: rest };
};

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const { allOf, ...rest } = value as JsonSchema;
  const result = Object.fromEntries(
    Object.entries(rest).map(([key, item]) => [
      key,
      key === '$ref' ? String(item).replace('#/definitions/', '#/components/schemas/') : normalize(item),
    ]),
  );
  if (!Array.isArray(allOf)) {
    return result;
  }

  const [only] = allOf as JsonSchema[];
  const isBareReference = allOf.length === 1 && Object.keys(only).join(',') === '$ref';
  const isNullableOnly = Object.keys(result).join(',') === 'nullable';
  return isBareReference && !isNullableOnly
    ? { ...result, $ref: String(only.$ref).replace('#/definitions/', '#/components/schemas/') }
    : { ...result, allOf: normalize(allOf) };
};
