import type { MockData } from '#test/common/data.ts';
import { Spy } from '#test/common/expectations.ts';
import { createHandlers } from '#test/common/handlers.ts';
import { getOperation, hasOperation, matchOperation, toCall } from '#test/common/spec.ts';
import type { Call, Handler, Handlers, OperationId } from '#test/common/types.ts';

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const readOperations = new Set<OperationId>([
  'searchAssets',
  'searchSmart',
  'getDownloadInfo',
  'downloadArchive',
  'checkBulkUpload',
  'previewStorageTemplate',
]);

export type Response = {
  status: number;
  json?: unknown;
  body?: Uint8Array<ArrayBuffer> | string;
  contentType?: string;
  headers?: Record<string, string>;
};

export class OperationSpy<K extends OperationId> extends Spy<Call<K>> {
  constructor(
    readonly operationId: K,
    readonly method: string,
  ) {
    super(`api.${operationId}`);
  }

  get isMutation() {
    return mutationMethods.has(this.method) && !readOperations.has(this.operationId);
  }
}

type OperationSpies = { readonly [K in OperationId]: OperationSpy<K> };

export type MockApi<T extends Dispatcher = Dispatcher> = T & OperationSpies;

export const createApi = <T extends Dispatcher>(transport: T): MockApi<T> =>
  new Proxy(transport, {
    get: (target, property, receiver) => {
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      return typeof property === 'string' && hasOperation(property) ? target.spy(property as OperationId) : undefined;
    },
  }) as MockApi<T>;

export class Dispatcher {
  readonly unhandled: string[] = [];
  readonly failures: string[] = [];
  private readonly handlers = new Map<string, Handler<OperationId>>();
  private readonly spies = new Map<string, OperationSpy<OperationId>>();

  constructor(data: MockData) {
    this.on(createHandlers(data));
  }

  on(handlers: Handlers) {
    for (const [operationId, handler] of Object.entries(handlers)) {
      if (!hasOperation(operationId)) {
        throw new Error(`Unknown operationId: ${operationId}`);
      }
      this.handlers.set(operationId, handler as Handler<OperationId>);
    }
    return this;
  }

  off(operationId: OperationId) {
    this.handlers.delete(operationId);
    return this;
  }

  recordDownload(url: URL) {
    const match = matchOperation('GET', url.pathname);
    if (!match) {
      this.unhandled.push(`GET ${url.pathname}${url.search} (download without a matching OpenAPI operation)`);
      return;
    }
    const call = toCall(match.operation, match.params, url.searchParams, undefined);
    this.spy(match.operation.operationId as OperationId).record(call as Call<OperationId>, { expected: true });
  }

  spy(operationId: OperationId) {
    let spy = this.spies.get(operationId);
    if (!spy) {
      spy = new OperationSpy(operationId, getOperation(operationId).method);
      this.spies.set(operationId, spy);
    }
    return spy;
  }

  missingExpectations() {
    return [...this.spies.values()].flatMap((spy) => spy.missing());
  }

  unexpectedCalls() {
    return [...this.spies.values()].flatMap((spy) =>
      spy.unexpected().map((call) => `${spy.method} ${spy.operationId} ${JSON.stringify(call)}`),
    );
  }

  async dispatch(method: string, url: URL, body: unknown): Promise<Response> {
    const match = matchOperation(method, url.pathname);
    if (!match) {
      this.unhandled.push(`${method} ${url.pathname}${url.search} (no matching OpenAPI operation)`);
      return { status: 501, json: { message: 'No matching OpenAPI operation' } };
    }

    const { operation, params } = match;
    const call = toCall(operation, params, url.searchParams, body);
    const spy = this.spy(operation.operationId as OperationId);
    spy.record(call as Call<OperationId>, { expected: spy.isMutation });

    const handler = this.handlers.get(operation.operationId);
    if (!handler) {
      this.unhandled.push(`${method} ${url.pathname}${url.search} (${operation.operationId})`);
      return { status: 501, json: { message: `No mock handler for ${operation.operationId}` } };
    }

    let result;
    try {
      result = await handler(call as Call<OperationId>);
    } catch (error) {
      const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
      this.failures.push(`${operation.operationId}: ${message}`);
      return { status: 500, json: { message: `Mock handler for ${operation.operationId} threw` } };
    }
    if (result && 'body' in result && result.body !== undefined) {
      return {
        status: result.status ?? 200,
        body: result.body,
        contentType: result.contentType,
        headers: result.headers,
      };
    }
    if (result && 'json' in result && result.json !== undefined) {
      return { status: result.status ?? 200, json: result.json, headers: result.headers };
    }
    return { status: result?.status ?? 204, headers: result?.headers };
  }
}
