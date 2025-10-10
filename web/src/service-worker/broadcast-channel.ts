import { createSHA1, sha1 } from 'hash-wasm';
import { handleCancel, handlePreload } from './request';

type HashRequest = { id: string; file: File };

const MAX_HASH_FILE_SIZE = 100 * 1024 * 1024; // 100 MiB

const broadcast = new BroadcastChannel('immich');

broadcast.addEventListener('message', async (event) => {
  if (!event.data) {
    return;
  }

  const url = new URL(event.data.url, event.origin);

  switch (event.data.type) {
    case 'preload': {
      handlePreload(url);
      break;
    }

    case 'cancel': {
      handleCancel(url);
      break;
    }

    case 'hash': {
      await handleHash(event.data);
    }
  }
});

const handleHash = async (request: HashRequest) => {
  const { id, file } = request;
  const checksum = file.size <= MAX_HASH_FILE_SIZE ? await hashSmallFile(request) : await hashLargeFile(request);
  broadcast.postMessage({ type: 'checksum', id, checksum });
};

const hashSmallFile = async ({ file }: HashRequest): Promise<string> => {
  const buffer = await file.arrayBuffer();
  return sha1(new Uint8Array(buffer));
};

const hashLargeFile = async ({ id, file }: HashRequest): Promise<string> => {
  const sha1 = await createSHA1();
  const reader = file.stream().getReader();
  let processedBytes = 0;
  let lastUpdate = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    sha1.update(value);
    processedBytes += value.length;

    broadcast.postMessage({
      type: 'hash.progress',
      id,
      progress: processedBytes,
      total: file.size,
    });
  }

  return sha1.digest('hex');
};
