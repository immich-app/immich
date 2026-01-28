import { ChildProcessWithoutNullStreams } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ProcessRepository } from 'src/repositories/process.repository';

function* data() {
  yield 'Hello, world!';
}

describe(ProcessRepository.name, () => {
  let sut: ProcessRepository;
  let sink: Writable;

  beforeAll(() => {
    sut = new ProcessRepository();
  });

  beforeEach(() => {
    sink = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },

      final(callback) {
        callback();
      },
    });
  });

  describe('createSpawnDuplexStream', () => {
    it('should work (drain to stdout)', async () => {
      const process = sut.spawnDuplexStream('bash', ['-c', 'exit 0']);
      await pipeline(process, sink);
    });

    it('should throw on non-zero exit code', async () => {
      const process = sut.spawnDuplexStream('bash', ['-c', 'echo "error message" >&2; exit 1']);
      await expect(pipeline(process, sink)).rejects.toThrowErrorMatchingInlineSnapshot(`
        [Error: bash non-zero exit code (1)
        error message
        ]
      `);
    });

    it('should accept stdin / output stdout', async () => {
      let output = '';
      const sink = new Writable({
        write(chunk, _encoding, callback) {
          output += chunk;
          callback();
        },

        final(callback) {
          callback();
        },
      });

      const echoProcess = sut.spawnDuplexStream('cat');
      await pipeline(Readable.from(data()), echoProcess, sink);
      expect(output).toBe('Hello, world!');
    });

    it('should drain stdin on process exit', async () => {
      let resolve1: () => void;
      let resolve2: () => void;
      const promise1 = new Promise<void>((r) => (resolve1 = r));
      const promise2 = new Promise<void>((r) => (resolve2 = r));

      async function* data() {
        yield 'Hello, world!';
        await promise1;
        await promise2;
        yield 'Write after stdin close / process exit!';
      }

      const process = sut.spawnDuplexStream('bash', ['-c', 'exit 0']);

      const realProcess = (process as never as { _process: ChildProcessWithoutNullStreams })._process;
      realProcess.on('close', () => setImmediate(() => resolve1()));
      realProcess.stdin.on('close', () => setImmediate(() => resolve2()));

      await pipeline(Readable.from(data()), process);
    });
  });
});
