import { ChildProcess, fork } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { MaintenanceHealthRepository } from 'src/maintenance/maintenance-health.repository.js';

vi.mock('node:child_process', () => ({ fork: vi.fn() }));

const createWorker = () => {
  const worker = Object.assign(new EventEmitter(), { kill: vi.fn() });
  worker.kill.mockImplementation((signal: NodeJS.Signals) => {
    worker.emit('exit', null, signal);
    return true;
  });
  return worker;
};

const refused = () => Promise.reject(new TypeError('fetch failed'));
const respond = (ok: boolean) => Promise.resolve({ ok } as Response);

describe(MaintenanceHealthRepository.name, () => {
  let sut: MaintenanceHealthRepository;
  let worker: ReturnType<typeof createWorker>;
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    vi.useFakeTimers();
    sut = new MaintenanceHealthRepository();
    worker = createWorker();
    vi.mocked(fork).mockReturnValue(worker as unknown as ChildProcess);
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('checkApiHealth', () => {
    it('should start the api worker on the health check address', async () => {
      fetchMock.mockImplementation(() => respond(true));

      const promise = sut.checkApiHealth();
      await vi.advanceTimersByTimeAsync(1000);
      await promise;

      expect(fork).toHaveBeenCalledWith(
        expect.stringMatching(/workers\/api\.js$/),
        [],
        expect.objectContaining({
          env: expect.objectContaining({ IMMICH_HOST: '127.0.0.1', IMMICH_PORT: '33001' }),
        }),
      );
    });

    it('should resolve once the api worker answers the ping endpoint', async () => {
      fetchMock
        .mockImplementationOnce(refused)
        .mockImplementationOnce(refused)
        .mockImplementation(() => respond(true));

      const promise = sut.checkApiHealth();
      await vi.advanceTimersByTimeAsync(3000);

      await expect(promise).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:33001/api/server/ping', expect.anything());
      expect(worker.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should keep polling while the ping endpoint returns an error', async () => {
      fetchMock.mockImplementationOnce(() => respond(false)).mockImplementation(() => respond(true));

      const promise = sut.checkApiHealth();
      await vi.advanceTimersByTimeAsync(2000);

      await expect(promise).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should reject when the api worker exits before answering', async () => {
      fetchMock.mockImplementation(refused);

      const promise = sut.checkApiHealth();
      worker.emit('exit', 1, null);

      await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Server health check failed, server exited with 1]`,
      );
      await vi.advanceTimersByTimeAsync(5000);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should reject and stop the api worker when it does not answer in time', async () => {
      fetchMock.mockImplementation(refused);

      const promise = sut.checkApiHealth();
      const assertion = expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Server health check failed, took too long to start.]`,
      );
      await vi.advanceTimersByTimeAsync(180_000);

      await assertion;
      expect(worker.kill).toHaveBeenCalledWith('SIGTERM');

      const calls = fetchMock.mock.calls.length;
      await vi.advanceTimersByTimeAsync(5000);
      expect(fetchMock).toHaveBeenCalledTimes(calls);
    });
  });
});
