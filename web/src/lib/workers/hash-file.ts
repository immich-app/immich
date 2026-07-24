import { sha1 } from '@noble/hashes/legacy.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { createSHA1 } from 'hash-wasm';

const HASH_CHUNK_SIZE = 5 * 1024 * 1024;

function isWebAssemblySupported(): boolean {
  try {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(Uint8Array.of(0x00, 0x61, 0x73, 0x6D, 0x01, 0x00, 0x00, 0x00));
      if (module instanceof WebAssembly.Module) {
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
      }
    }
  } catch {
    // ignore, fall through to unsupported
  }
  return false;
}

export const hashFileWasm = async (file: File): Promise<string> => {
  const sha1Factory = await createSHA1();
  const hasher = sha1Factory.init();
  const chunkSize = HASH_CHUNK_SIZE;
  let offset = 0;

  const getNextBuffer = () => file.slice(offset, offset + chunkSize).arrayBuffer();
  const calculate = async (buffer: ArrayBuffer): Promise<string> => {
    hasher.update(new Uint8Array(buffer));
    offset += chunkSize;
    if (offset > file.size) {
      return hasher.digest();
    }
    return calculate(await getNextBuffer());
  };
  return calculate(await getNextBuffer());
};

export async function hashFileJs(file: File): Promise<string> {
  const hasher = sha1.create();

  for (let offset = 0; offset < file.size; offset += HASH_CHUNK_SIZE) {
    const slice = file.slice(offset, Math.min(offset + HASH_CHUNK_SIZE, file.size));

    const buffer = await slice.arrayBuffer();

    hasher.update(new Uint8Array(buffer));
  }

  return bytesToHex(hasher.digest());
}

export async function hashFile(file: File): Promise<string> {
  if (isWebAssemblySupported()) {
    try {
      return await hashFileWasm(file);
    } catch {
      // fall through to the pure-JS implementation below
    }
  }
  return hashFileJs(file);
}

// eslint-disable-next-line unicorn/no-top-level-side-effects
addEventListener('message', (event: MessageEvent<File>) => {
  void hashFile(event.data)
    .then((result) => postMessage({ result }))
    .catch((error: unknown) => postMessage({ error: error instanceof Error ? error.message : String(error) }));
});
