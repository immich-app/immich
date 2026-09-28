const content = 'hello immich, this is a deterministic test payload';
const knownSha1Hex = 'b5827d64afd7754a765416e79f9329ca6cebd07b';

describe('hashFile', () => {
  afterEach(() => {
    vi.doUnmock('hash-wasm');
    vi.resetModules();
  });

  it('hashFileJs produces the correct SHA-1 hex digest', async () => {
    const { hashFileJs } = await import('./hash-file');
    const file = new File([content], 'a.txt');
    await expect(hashFileJs(file)).resolves.toBe(knownSha1Hex);
  });

  it('hashFileWasm produces the correct SHA-1 hex digest', async () => {
    const { hashFileWasm } = await import('./hash-file');
    const file = new File([content], 'a.txt');
    await expect(hashFileWasm(file)).resolves.toBe(knownSha1Hex);
  });

  it('hashFileWasm and hashFileJs produce identical output for the same input', async () => {
    const { hashFileWasm, hashFileJs } = await import('./hash-file');
    for (const size of [0, 1, 1024, 10_000]) {
      const file = new File([new Uint8Array(size)], 'x.bin');
      const [wasmHash, jsHash] = await Promise.all([hashFileWasm(file), hashFileJs(file)]);
      expect(wasmHash).toBe(jsHash);
    }
  });

  it('falls back to the JS implementation when the WASM path throws', async () => {
    vi.doMock('hash-wasm', () => ({
      createSHA1: () => Promise.reject(new Error('boom')),
    }));
    vi.resetModules();

    const { hashFile } = await import('./hash-file');
    const file = new File([content], 'a.txt');
    await expect(hashFile(file)).resolves.toBe(knownSha1Hex);
  });

  it('uses the WASM path when available and matches the JS output', async () => {
    const { hashFile } = await import('./hash-file');
    const file = new File([content], 'a.txt');
    await expect(hashFile(file)).resolves.toBe(knownSha1Hex);
  });
});
