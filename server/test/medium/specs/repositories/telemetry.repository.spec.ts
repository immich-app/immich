import { once } from 'node:events';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { clearEnvCache } from 'src/repositories/config.repository.js';
import { bootstrapTelemetry, teardownTelemetry } from 'src/repositories/telemetry.repository.js';

const getFreePort = async () => {
  const server = createServer().listen(0);
  await once(server, 'listening');
  const { port } = server.address() as AddressInfo;
  server.close();
  return port;
};

describe('bootstrapTelemetry', () => {
  beforeEach(() => {
    clearEnvCache();
  });

  afterEach(async () => {
    await teardownTelemetry();
    vi.unstubAllEnvs();
  });

  it.each([
    { host: undefined, address: '127.0.0.1' },
    { host: undefined, address: '[::1]' },
    { host: '::', address: '127.0.0.1' },
    { host: '::', address: '[::1]' },
    { host: '0.0.0.0', address: '127.0.0.1' },
  ])('should serve metrics on $address when IMMICH_HOST is $host', async ({ host, address }) => {
    vi.stubEnv('IMMICH_HOST', host);
    const port = await getFreePort();

    bootstrapTelemetry(port);

    const response = await vi.waitFor(() => fetch(`http://${address}:${port}/metrics`));
    expect(response.status).toBe(200);
  });
});
