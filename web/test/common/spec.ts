import openApiSpec from '../../../open-api/immich-openapi-specs.json' with { type: 'json' };

type ParameterType = 'string' | 'boolean' | 'number' | 'integer' | 'array';

export type Operation = {
  operationId: string;
  method: string;
  path: string;
  pattern: RegExp;
  pathParameters: string[];
  queryParameters: Record<string, ParameterType>;
  hasBody: boolean;
};

type SpecParameter = { name: string; in: string; schema?: { type?: string } };
type SpecOperation = {
  operationId?: string;
  parameters?: SpecParameter[];
  requestBody?: { content?: Record<string, { schema?: { $ref?: string } }> };
};
type OpenApiSpec = {
  paths: Record<string, Record<string, SpecOperation | SpecParameter[]>>;
};

const httpMethods = new Set(['get', 'put', 'post', 'delete', 'patch', 'head', 'options']);

export const hasOperation = (operationId: string) => getIndex().byId.has(operationId);

const getIndex = () => (index ??= buildIndex());

const buildIndex = (): OperationIndex => {
  const spec = openApiSpec as unknown as OpenApiSpec;
  const byId = new Map<string, Operation>();
  const ordered: Operation[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const shared = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method) || Array.isArray(operation) || !operation.operationId) {
        continue;
      }
      const entry = toOperation(path, method, operation, shared);
      byId.set(entry.operationId, entry);
      ordered.push(entry);
    }
  }

  ordered.sort(
    (a, b) =>
      literalSegmentCount(b.path) - literalSegmentCount(a.path) || a.pathParameters.length - b.pathParameters.length,
  );

  return { byId, ordered };
};

type OperationIndex = {
  byId: Map<string, Operation>;
  ordered: Operation[];
};

let index: OperationIndex | undefined;

const toOperation = (path: string, method: string, operation: SpecOperation, shared: SpecParameter[]): Operation => {
  const pathParameters: string[] = [];
  const source = path
    .split('/')
    .map((segment) => {
      const match = segment.match(/^\{(.+)\}$/);
      if (match) {
        pathParameters.push(match[1]);
        return '([^/]+)';
      }
      return escapeRegExp(segment);
    })
    .join('/');

  const queryParameters: Record<string, ParameterType> = {};
  for (const parameter of [...shared, ...(operation.parameters ?? [])]) {
    if (parameter.in === 'query') {
      queryParameters[parameter.name] = (parameter.schema?.type as ParameterType | undefined) ?? 'string';
    }
  }

  return {
    operationId: operation.operationId!,
    method: method.toUpperCase(),
    path,
    pattern: new RegExp(`^/api${source}/?$`),
    pathParameters,
    queryParameters,
    hasBody: operation.requestBody !== undefined,
  };
};

const escapeRegExp = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const literalSegmentCount = (path: string) =>
  path.split('/').filter((segment) => segment && !segment.startsWith('{')).length;

export const getOperation = (operationId: string) => {
  const operation = getIndex().byId.get(operationId);
  if (!operation) {
    throw new Error(`Unknown operationId: ${operationId}`);
  }
  return operation;
};

export const matchOperation = (method: string, pathname: string) => {
  for (const operation of getIndex().ordered) {
    if (operation.method !== method) {
      continue;
    }
    const match = pathname.match(operation.pattern);
    if (!match) {
      continue;
    }
    const params: Record<string, string> = {};
    for (const [index, name] of operation.pathParameters.entries()) {
      params[name] = decodeURIComponent(match[index + 1]);
    }
    return { operation, params };
  }
};

const coerce = (type: ParameterType, values: string[]) => {
  switch (type) {
    case 'boolean': {
      return values[0] === 'true';
    }
    case 'number':
    case 'integer': {
      return Number(values[0]);
    }
    case 'array': {
      return values;
    }
    default: {
      return values[0];
    }
  }
};

const reservedParameterNames = new Set(['for', 'from', 'type']);
const toSdkParameterName = (name: string) => (reservedParameterNames.has(name) ? `$${name}` : name);

export const toCall = (
  operation: Operation,
  pathParams: Record<string, string>,
  query: URLSearchParams,
  body: unknown,
): Record<string, unknown> => {
  const call: Record<string, unknown> = {};
  const params: Record<string, unknown> = { ...pathParams };
  for (const name of new Set(query.keys())) {
    params[toSdkParameterName(name)] = coerce(operation.queryParameters[name] ?? 'string', query.getAll(name));
  }
  if (Object.keys(params).length > 0) {
    call.params = params;
  }
  if (operation.hasBody && body !== undefined) {
    call.body = body;
  }
  return call;
};
