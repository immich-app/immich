import { CallHandler, ExecutionContext } from '@nestjs/common';
import { contextBase, core } from '@opentelemetry/sdk-node';
import { of } from 'rxjs';
import { HttpRouteInterceptor } from 'src/middleware/http-route.interceptor.js';

const contextFor = (route?: { path: string }) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ route }) }),
  }) as unknown as ExecutionContext;

const next = { handle: () => of('response') } as CallHandler;

describe(HttpRouteInterceptor.name, () => {
  let sut: HttpRouteInterceptor;

  beforeEach(() => {
    sut = new HttpRouteInterceptor();
  });

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  it('should set the matched route on the http rpc metadata', () => {
    const rpcMetadata: core.RPCMetadata = {
      type: core.RPCType.HTTP,
      span: contextBase.trace.wrapSpanContext(contextBase.INVALID_SPAN_CONTEXT),
    };
    vitest
      .spyOn(contextBase.context, 'active')
      .mockReturnValue(core.setRPCMetadata(contextBase.ROOT_CONTEXT, rpcMetadata));

    sut.intercept(contextFor({ path: '/api/albums/:id' }), next);

    expect(rpcMetadata.route).toBe('/api/albums/:id');
  });

  it('should do nothing when http instrumentation is not active', () => {
    expect(() => sut.intercept(contextFor({ path: '/api/albums/:id' }), next)).not.toThrow();
  });

  it('should pass the response through', async () => {
    await expect(new Promise((resolve) => sut.intercept(contextFor(), next).subscribe(resolve))).resolves.toBe(
      'response',
    );
  });
});
