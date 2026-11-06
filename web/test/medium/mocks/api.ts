import type { MockData } from '#test/common/data.ts';
import { Dispatcher, type Response } from '#test/common/dispatcher.ts';
import { emptyMapStyle } from '#test/common/helpers.ts';
import type { BrowserContext, Request, Route, WebSocketRoute } from '@playwright/test';

const apiPattern = /^https?:\/\/[^/]+\/api\//;
const socketPattern = /\/api\/socket\.io\//;
const customCssPattern = /^https?:\/\/[^/]+\/custom\.css$/;
const mapStylePattern = /^https:\/\/tiles\.immich\.cloud\//;

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

const fulfill = async (route: Route, { status, json, body, contentType, headers }: Response) => {
  try {
    await route.fulfill(
      body === undefined
        ? { status, json, headers }
        : { status, body: typeof body === 'string' ? body : Buffer.from(body), contentType, headers },
    );
  } catch {
    return;
  }
};

const parseBody = (request: Request) => {
  const data = request.postData();
  if (data === null) {
    return;
  }
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return data;
  }
};

export class MockNetwork extends Dispatcher {
  private readonly routedUrls = new Set<string>();
  private readonly disposers: Array<() => Promise<void>> = [];

  constructor(
    private readonly context: BrowserContext,
    data: MockData,
  ) {
    super(data);
  }

  async setup() {
    await mockWebSocket(this.context);
    await this.route(customCssPattern, (route) => route.fulfill({ body: '', contentType: 'text/css' }));
    await this.route(mapStylePattern, (route) => route.fulfill({ json: emptyMapStyle }));
    await this.route(apiPattern, (route, request) => this.handle(route, request));
  }

  async teardown() {
    for (const dispose of this.disposers.splice(0).reverse()) {
      await dispose();
    }
  }

  emit(event: string, payload?: unknown) {
    const socket = sockets.get(this.context);
    if (!socket) {
      throw new Error('No websocket connection has been established by the page');
    }
    socket.send(`42${JSON.stringify(payload === undefined ? [event] : [event, payload])}`);
  }

  override recordDownload(url: URL) {
    if (this.routedUrls.has(url.href)) {
      return;
    }
    super.recordDownload(url);
  }

  private async route(pattern: RegExp, handler: (route: Route, request: Request) => Promise<void>) {
    await this.context.route(pattern, handler);
    this.disposers.push(() => this.context.unroute(pattern));
  }

  private async handle(route: Route, request: Request) {
    const url = new URL(request.url());
    this.routedUrls.add(url.href);
    const response = await this.dispatch(request.method(), url, parseBody(request));
    await fulfill(route, response);
  }
}
