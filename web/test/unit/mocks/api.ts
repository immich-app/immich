import { Dispatcher } from '#test/common/dispatcher.ts';
import { vi } from 'vitest';

const parseBody = async (request: Request) => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return;
  }
  const data = await request.text();
  if (data === '') {
    return;
  }
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return data;
  }
};

const mockFetch = (input: RequestInfo | URL, init?: RequestInit) => MockFetch.instance.handle(new Request(input, init));

export class MockFetch extends Dispatcher {
  private static active?: MockFetch;
  private readonly inFlight = new Set<Promise<Response>>();

  static get instance() {
    if (!MockFetch.active) {
      throw new Error('No mock api is set up');
    }
    return MockFetch.active;
  }

  get pending() {
    return this.inFlight.size;
  }

  setup() {
    MockFetch.active = this;
    vi.stubGlobal('fetch', mockFetch);
  }

  teardown() {
    MockFetch.active = undefined;
    vi.unstubAllGlobals();
  }

  handle(request: Request) {
    const response = this.respond(request);
    this.inFlight.add(response);
    void response.finally(() => this.inFlight.delete(response));
    return response;
  }

  private async respond(request: Request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      this.unhandled.push(`${request.method} ${url.href} (not an api request)`);
      return new Response(null, { status: 501 });
    }

    const {
      status,
      json,
      body,
      contentType = 'application/octet-stream',
      headers,
    } = await this.dispatch(request.method, url, await parseBody(request));
    if (body !== undefined) {
      return new Response(body, {
        status,
        headers: { 'content-type': contentType, ...headers },
      });
    }
    if (json !== undefined) {
      return Response.json(json, { status, headers });
    }
    return new Response(null, { status, headers });
  }
}
