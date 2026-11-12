import { hashFile, hashFileJs, hashFileWasm } from './hash-file';

const wasm = vi.hoisted(() => ({ fail: false }));

vi.mock('hash-wasm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('hash-wasm')>();
  return {
    ...actual,
    createSHA1: (...args: Parameters<typeof actual.createSHA1>) =>
      wasm.fail ? Promise.reject(new Error('boom')) : actual.createSHA1(...args),
  };
});

const content = 'hello immich, this is a deterministic test payload';
const knownSha1Hex = 'b5827d64afd7754a765416e79f9329ca6cebd07b';

describe('hashFile', () => {
  afterEach(() => {
    wasm.fail = false;
  });

  it('hashFileJs produces the correct SHA-1 hex digest', async () => {
    const file = new File([content], 'a.txt');
    await expect(hashFileJs(file)).resolves.toBe(knownSha1Hex);
  });

  it('hashFileWasm produces the correct SHA-1 hex digest', async () => {
    const file = new File([content], 'a.txt');
    await expect(hashFileWasm(file)).resolves.toBe(knownSha1Hex);
  });

  it('hashFileWasm and hashFileJs produce identical output for the same input', async () => {
    for (const size of [0, 1, 1024, 10_000]) {
      const file = new File([new Uint8Array(size)], 'x.bin');
      const [wasmHash, jsHash] = await Promise.all([hashFileWasm(file), hashFileJs(file)]);
      expect(wasmHash).toBe(jsHash);
    }
  });

  it('falls back to the JS implementation when the WASM path throws', async () => {
    wasm.fail = true;
    const file = new File([content], 'a.txt');
    await expect(hashFileWasm(file)).rejects.toThrow('boom');
    await expect(hashFile(file)).resolves.toBe(knownSha1Hex);
  });

  it('uses the WASM path when available and matches the JS output', async () => {
    const file = new File([content], 'a.txt');
    await expect(hashFile(file)).resolves.toBe(knownSha1Hex);
  });
});
