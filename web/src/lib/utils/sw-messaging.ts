type OnProgress = (progress: number, total: number) => void;
type Callback = { onChecksum: (checksum: string) => void; onProgress: OnProgress };

const callbacks: Record<string, Callback> = {};
const broadcast = new BroadcastChannel('immich');

broadcast.addEventListener('message', (event) => {
  const { type, id, checksum, progress, total } = event.data;

  switch (type) {
    case 'checksum': {
      if (id && checksum) {
        const callback = callbacks[id];
        callback?.onChecksum(checksum);
        delete callbacks[id];
      }
      break;
    }

    case 'hash.progress': {
      if (id && progress && total) {
        const callback = callbacks[id];
        callback?.onProgress(progress, total);
      }
      break;
    }
  }
});

export const cancelImageUrl = (url: string) => {
  broadcast.postMessage({ type: 'cancel', url });
};
export const preloadImageUrl = (url: string) => {
  broadcast.postMessage({ type: 'preload', url });
};

export const hashFile = (file: File, { id, onProgress }: { id: string; onProgress: OnProgress }): Promise<string> => {
  return new Promise((onChecksum) => {
    if (callbacks[id]) {
      return;
    }

    callbacks[id] = { onChecksum, onProgress };
    broadcast.postMessage({ type: 'hash', id, file });
  });
};
