import { Spy } from '#test/medium/mock/helpers.ts';
import { getOperation, hasOperation, matchOperation, toCall } from '#test/medium/mock/spec.ts';
import type { Call, Handler, HandlerContext, Handlers, OperationId } from '#test/medium/mock/types.ts';
import type { BrowserContext, Request, Route, WebSocketRoute } from '@playwright/test';

const apiPattern = /^https?:\/\/[^/]+\/api\//;
const socketPattern = /\/api\/socket\.io\//;
const customCssPattern = /^https?:\/\/[^/]+\/custom\.css$/;
const mapStylePattern = /^https:\/\/tiles\.immich\.cloud\//;
const emptyMapStyle = { version: 8, sources: {}, layers: [] };

const sockets = new WeakMap<BrowserContext, WebSocketRoute>();
const socketMockedContexts = new WeakSet<BrowserContext>();

const mockWebSocket = async (context: BrowserContext) => {
  if (socketMockedContexts.has(context)) {
    return;
  }
  socketMockedContexts.add(context);
  await context.routeWebSocket(socketPattern, (socket) => {
    sockets.set(context, socket);
    socket.send('0{"sid":"mock","upgrades":[],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}');
    socket.onMessage((message) => {
      if (message === '2') {
        socket.send('3');
      } else if (typeof message === 'string' && message.startsWith('40')) {
        socket.send('40{"sid":"mock"}');
      }
    });
  });
};

const fulfill = async (route: Route, options: Parameters<Route['fulfill']>[0]) => {
  try {
    await route.fulfill(options);
  } catch {
    return;
  }
};

const parseBody = (request: Request) => {
  const data = request.postData();
  if (data === null) {
    return undefined;
  }
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return data;
  }
};

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const readOperations = new Set<OperationId>(['searchAssets', 'getDownloadInfo', 'downloadArchive']);

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

export type MockApi = MockApiBase & OperationSpies;

export const createMockApi = (context: BrowserContext): MockApi => {
  const api = new MockApiBase(context);
  return new Proxy(api, {
    get: (target, property, receiver) => {
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      return typeof property === 'string' && hasOperation(property) ? target.spy(property as OperationId) : undefined;
    },
  }) as MockApi;
};

export class MockApiBase {
  readonly unhandled: string[] = [];
  readonly failures: string[] = [];
  private readonly routedUrls = new Set<string>();
  private readonly handlers = new Map<string, Handler<OperationId>>();
  private readonly spies = new Map<string, OperationSpy<OperationId>>();
  private readonly disposers: Array<() => Promise<void>> = [];

  constructor(private readonly context: BrowserContext) {}

  private async route(pattern: RegExp, handler: (route: Route, request: Request) => Promise<void>) {
    await this.context.route(pattern, handler);
    this.disposers.push(() => this.context.unroute(pattern));
  }

  spy(operationId: OperationId) {
    let spy = this.spies.get(operationId);
    if (!spy) {
      spy = new OperationSpy(operationId, getOperation(operationId).method);
      this.spies.set(operationId, spy);
    }
    return spy;
  }

  async install() {
    await mockWebSocket(this.context);
    await this.route(customCssPattern, (route) => route.fulfill({ body: '', contentType: 'text/css' }));
    await this.route(mapStylePattern, (route) => route.fulfill({ json: emptyMapStyle }));
    await this.route(apiPattern, (route, request) => this.handle(route, request));
  }

  async uninstall() {
    for (const dispose of this.disposers.splice(0).reverse()) {
      await dispose();
    }
  }

  on(handlers: Handlers) {
    for (const [operationId, handler] of Object.entries(handlers)) {
      this.assertOperation(operationId);
      this.handlers.set(operationId, handler as Handler<OperationId>);
    }
    return this;
  }

  off(operationId: OperationId) {
    this.handlers.delete(operationId);
    return this;
  }

  emit(event: string, payload?: unknown) {
    const socket = sockets.get(this.context);
    if (!socket) {
      throw new Error('No websocket connection has been established by the page');
    }
    socket.send(`42${JSON.stringify(payload === undefined ? [event] : [event, payload])}`);
  }

  recordDownload(url: URL) {
    if (this.routedUrls.has(url.href)) {
      return;
    }
    const match = matchOperation('GET', url.pathname);
    if (!match) {
      this.unhandled.push(`GET ${url.pathname}${url.search} (download without a matching OpenAPI operation)`);
      return;
    }
    const call = toCall(match.operation, match.params, url.searchParams, undefined);
    this.spy(match.operation.operationId as OperationId).record(call as Call<OperationId>, { expected: true });
  }

  unexpectedCalls() {
    return [...this.spies.values()].flatMap((spy) =>
      spy.unexpected().map((call) => `${spy.method} ${spy.operationId} ${JSON.stringify(call)}`),
    );
  }

  private assertOperation(operationId: string) {
    if (!hasOperation(operationId)) {
      throw new Error(`Unknown operationId: ${operationId}`);
    }
  }

  private async handle(route: Route, request: Request) {
    const url = new URL(request.url());
    const method = request.method();
    this.routedUrls.add(url.href);
    const match = matchOperation(method, url.pathname);

    if (!match) {
      this.unhandled.push(`${method} ${url.pathname}${url.search} (no matching OpenAPI operation)`);
      return fulfill(route, { status: 501, json: { message: 'No matching OpenAPI operation' } });
    }

    const { operation, params } = match;
    const body = parseBody(request);
    const call = toCall(operation, params, url.searchParams, body);
    const spy = this.spy(operation.operationId as OperationId);
    spy.record(call as Call<OperationId>, { expected: spy.isMutation });

    const handler = this.handlers.get(operation.operationId);
    if (!handler) {
      this.unhandled.push(`${method} ${url.pathname}${url.search} (${operation.operationId})`);
      return fulfill(route, { status: 501, json: { message: `No mock handler for ${operation.operationId}` } });
    }

    let result;
    try {
      result = await handler({ ...call, request } as HandlerContext<OperationId>);
    } catch (error) {
      const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
      this.failures.push(`${operation.operationId}: ${message}`);
      return fulfill(route, { status: 500, json: { message: `Mock handler for ${operation.operationId} threw` } });
    }
    if (result && 'body' in result && result.body !== undefined) {
      return fulfill(route, {
        status: result.status ?? 200,
        body: result.body,
        contentType: result.contentType,
        headers: result.headers,
      });
    }
    if (result && 'json' in result && result.json !== undefined) {
      return fulfill(route, { status: result.status ?? 200, json: result.json, headers: result.headers });
    }
    return fulfill(route, { status: result?.status ?? 204, headers: result?.headers });
  }
}
