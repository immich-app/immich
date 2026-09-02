import { Writable } from 'node:stream';
import { SyncEntityType } from 'src/enum';
import { send } from 'src/services/sync.service';
import { serialize } from 'src/utils/sync';

type TestStream = {
  stream: Writable;
  chunks: string[];
  flushNext: () => void;
  pendingCount: () => number;
};

const createTestStream = (highWaterMark: number): TestStream => {
  const chunks: string[] = [];
  const pendingCallbacks: Array<() => void> = [];

  const stream = new Writable({
    highWaterMark,
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      pendingCallbacks.push(callback);
    },
  });

  return {
    stream,
    chunks,
    flushNext: () => pendingCallbacks.shift()?.(),
    pendingCount: () => pendingCallbacks.length,
  };
};

describe('send', () => {
  const item = {
    type: SyncEntityType.SyncCompleteV1 as const,
    data: {},
    ids: ['now-id'] as [string],
  };

  it('resolves immediately when the stream has capacity', async () => {
    // A large highWaterMark means write() never signals backpressure for a
    // single small item.
    const { stream, chunks, flushNext } = createTestStream(1024 * 1024);

    const sendPromise = send(stream, item);
    flushNext();
    await sendPromise;

    expect(chunks).toEqual([serialize(item)]);
  });

  it('waits for the drain event before resolving when the stream signals backpressure', async () => {
    // A tiny highWaterMark means the very first write already exceeds
    // capacity, so write() returns false and send() must wait for 'drain'.
    const { stream, chunks, flushNext, pendingCount } = createTestStream(1);

    let resolved = false;
    const sendPromise = send(stream, item).then(() => {
      resolved = true;
    });

    // Let any pending microtasks run; send() should still be waiting on the
    // underlying write to complete and 'drain' to fire — it must not resolve
    // just because write() was called.
    await Promise.resolve();
    await Promise.resolve();
    expect(resolved).toBe(false);
    expect(pendingCount()).toBe(1);

    // Completing the write lets the stream's internal buffer drop back below
    // highWaterMark, which is what triggers the 'drain' event.
    flushNext();
    await sendPromise;

    expect(resolved).toBe(true);
    expect(chunks).toEqual([serialize(item)]);
  });
});
