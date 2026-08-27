import { monitorRedisSubscriber } from 'src/middleware/websocket.adapter';

const options = { intervalMs: 30_000, failuresBeforeReconnect: 2 };

const newClient = () => ({
  status: 'ready',
  ping: vi.fn().mockResolvedValue('PONG'),
  disconnect: vi.fn(),
});

const newLogger = () => ({ warn: vi.fn() });

describe('monitorRedisSubscriber', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should ping on every interval and leave a healthy connection alone', async () => {
    const client = newClient();
    const logger = newLogger();
    const heartbeat = monitorRedisSubscriber(client, logger, options);

    await vi.advanceTimersByTimeAsync(options.intervalMs * 3);

    expect(client.ping).toHaveBeenCalledTimes(3);
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();

    heartbeat.stop();
  });

  it('should reconnect after consecutive failures', async () => {
    const client = newClient();
    const logger = newLogger();
    client.ping.mockRejectedValue(new Error('Connection is closed.'));
    const heartbeat = monitorRedisSubscriber(client, logger, options);

    await vi.advanceTimersByTimeAsync(options.intervalMs);
    expect(client.disconnect).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('(1/2): Connection is closed.'));

    await vi.advanceTimersByTimeAsync(options.intervalMs);
    expect(client.disconnect).toHaveBeenCalledExactlyOnceWith(true);

    heartbeat.stop();
  });

  it('should reconnect when a ping goes unanswered', async () => {
    const client = newClient();
    client.ping.mockReturnValue(new Promise(() => {}));
    const heartbeat = monitorRedisSubscriber(client, newLogger(), options);

    await vi.advanceTimersByTimeAsync(options.intervalMs * 3);

    expect(client.disconnect).toHaveBeenCalledExactlyOnceWith(true);

    heartbeat.stop();
  });

  it('should only keep one ping in flight', async () => {
    const client = newClient();
    client.ping.mockReturnValue(new Promise(() => {}));
    const heartbeat = monitorRedisSubscriber(client, newLogger(), { ...options, failuresBeforeReconnect: 100 });

    await vi.advanceTimersByTimeAsync(options.intervalMs * 5);

    expect(client.ping).toHaveBeenCalledTimes(1);

    heartbeat.stop();
  });

  it('should reset the failure count after a successful ping', async () => {
    const client = newClient();
    client.ping.mockRejectedValueOnce(new Error('Connection is closed.'));
    const heartbeat = monitorRedisSubscriber(client, newLogger(), options);

    await vi.advanceTimersByTimeAsync(options.intervalMs * 3);

    expect(client.ping).toHaveBeenCalledTimes(3);
    expect(client.disconnect).not.toHaveBeenCalled();

    heartbeat.stop();
  });

  it('should skip the ping while the client is not ready', async () => {
    const client = newClient();
    client.status = 'reconnecting';
    const heartbeat = monitorRedisSubscriber(client, newLogger(), options);

    await vi.advanceTimersByTimeAsync(options.intervalMs * 3);

    expect(client.ping).not.toHaveBeenCalled();
    expect(client.disconnect).not.toHaveBeenCalled();

    heartbeat.stop();
  });

  it('should stop pinging once stopped', async () => {
    const client = newClient();
    const heartbeat = monitorRedisSubscriber(client, newLogger(), options);

    await vi.advanceTimersByTimeAsync(options.intervalMs);
    heartbeat.stop();
    await vi.advanceTimersByTimeAsync(options.intervalMs * 3);

    expect(client.ping).toHaveBeenCalledTimes(1);
  });

  it('should not reconnect after being stopped, even with a ping still in flight', async () => {
    const client = newClient();
    const logger = newLogger();
    const { promise, reject } = Promise.withResolvers<string>();
    client.ping.mockReturnValue(promise);
    const heartbeat = monitorRedisSubscriber(client, logger, { ...options, failuresBeforeReconnect: 1 });

    await vi.advanceTimersByTimeAsync(options.intervalMs);
    heartbeat.stop();
    reject(new Error('Connection is closed.'));
    await vi.advanceTimersByTimeAsync(options.intervalMs);

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
