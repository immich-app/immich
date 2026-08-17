/** Safari detection — same heuristic as asset-utils MIME support. */
export function isSafariBrowser(): boolean {
  return typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function supportsFileSystemAccessDownload(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

export type StreamDownloadResult = 'streamed' | 'fallback';

const LARGE_ARCHIVE_BYTES = 400 * 1024 * 1024;

/** Prefer streaming when Safari would OOM on in-memory blobs, or for very large archives. */
export function shouldPreferStreamingDownload(archiveSizeBytes: number): boolean {
  return isSafariBrowser() || archiveSizeBytes > LARGE_ARCHIVE_BYTES;
}

function createProgressTransform(onProgress?: (loaded: number) => void): TransformStream<Uint8Array, Uint8Array> {
  let loaded = 0;
  return new TransformStream({
    transform(chunk, controller) {
      loaded += chunk.byteLength;
      onProgress?.(loaded);
      controller.enqueue(chunk);
    },
  });
}

/**
 * Stream a POST response directly to disk via the File System Access API.
 * Avoids materializing the full archive as a Blob (Safari hangs above ~500MB).
 */
export async function downloadPostStream(
  url: string,
  body: unknown,
  filename: string,
  options: { signal?: AbortSignal; onProgress?: (loaded: number) => void } = {},
): Promise<StreamDownloadResult> {
  if (!supportsFileSystemAccessDownload()) {
    return 'fallback';
  }

  let fileHandle: FileSystemFileHandle;
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }],
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    return 'fallback';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    return 'fallback';
  }

  const writable = await fileHandle.createWritable();
  try {
    await response.body.pipeThrough(createProgressTransform(options.onProgress)).pipeTo(writable, {
      signal: options.signal,
    });
  } catch (error) {
    await writable.abort(error);
    throw error;
  }

  return 'streamed';
}
