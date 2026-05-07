import { sha1 } from '@noble/hashes/legacy.js';
import { bytesToHex } from '@noble/hashes/utils.js';

const HASH_CHUNK_SIZE = 5 * 1024 * 1024;

async function hashFile(file: File): Promise<string> {
  const hasher = sha1.create();

  for (let offset = 0; offset < file.size; offset += HASH_CHUNK_SIZE) {
    const slice = file.slice(offset, Math.min(offset + HASH_CHUNK_SIZE, file.size));

    const buffer = await slice.arrayBuffer();

    hasher.update(new Uint8Array(buffer));
  }

  return bytesToHex(hasher.digest());
}

addEventListener('message', (event: MessageEvent<File>) => {
  void hashFile(event.data)
    .then((result) => postMessage({ result }))
    .catch((error: unknown) => postMessage({ error: error instanceof Error ? error.message : String(error) }));
});
