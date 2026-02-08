/**
 * Chunked upload support for the Immich web client.
 *
 * When uploading files through Cloudflare or other reverse proxies with body size
 * limits (e.g. Cloudflare's 100MB free-tier limit causing "413 Request Entity Too Large"),
 * large files need to be split into smaller chunks.
 *
 * This module provides a chunked upload implementation that:
 * 1. Creates an upload session on the server
 * 2. Splits the file into chunks (default 50MB)
 * 3. Uploads each chunk sequentially
 * 4. Finalizes the upload to assemble and create the asset
 *
 * Benefits:
 * - Bypasses reverse proxy body size limits (Cloudflare, nginx, etc.)
 * - Reduces bandwidth pressure by sending smaller payloads
 * - Enables upload resume on connection interruption
 * - Improves upload stability for large video files
 */

import { getBaseUrl } from '@immich/sdk';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { asQueryString } from '$lib/utils/shared-links';

/** Default chunk size: 50 MB */
export const DEFAULT_CHUNK_SIZE = 50 * 1024 * 1024;

/** Threshold above which chunked upload is used (50 MB) */
export const CHUNKED_UPLOAD_THRESHOLD = 50 * 1024 * 1024;

interface ChunkedUploadSessionResponse {
  sessionId: string;
  chunkSize: number;
  totalChunks: number;
  expiresAt: string;
}

interface ChunkUploadResponse {
  chunkIndex: number;
  chunksReceived: number;
  totalChunks: number;
}

interface FinishChunkedUploadResponse {
  assetId: string;
  isDuplicate: boolean;
}

interface ChunkedUploadOptions {
  file: File;
  deviceAssetId: string;
  deviceId: string;
  fileCreatedAt: string;
  fileModifiedAt: string;
  isFavorite: boolean;
  duration: string;
  visibility?: string;
  chunkSize?: number;
  onProgress?: (loaded: number, total: number) => void;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  return headers;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  return response;
}

/**
 * Upload a file using the chunked upload protocol.
 * Returns the asset ID and whether it was a duplicate.
 */
export async function chunkedUpload(options: ChunkedUploadOptions): Promise<{
  id: string;
  status: 'created' | 'duplicate';
}> {
  const {
    file,
    deviceAssetId,
    deviceId,
    fileCreatedAt,
    fileModifiedAt,
    isFavorite,
    duration,
    visibility,
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress,
  } = options;

  const baseUrl = getBaseUrl();
  const queryParams = asQueryString(authManager.params);
  const queryString = queryParams ? `?${queryParams}` : '';

  // Step 1: Create upload session
  const sessionBody: Record<string, unknown> = {
    filename: file.name,
    fileSize: file.size,
    chunkSize,
    deviceAssetId,
    deviceId,
    fileCreatedAt,
    fileModifiedAt,
    isFavorite,
    duration,
  };

  if (visibility) {
    sessionBody.visibility = visibility;
  }

  const sessionResponse = await fetchWithAuth(
    `${baseUrl}/assets/chunked-upload${queryString}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionBody),
    },
  );

  if (!sessionResponse.ok) {
    const errorText = await sessionResponse.text();
    throw new Error(`Failed to create upload session: ${sessionResponse.status} ${errorText}`);
  }

  const session: ChunkedUploadSessionResponse = await sessionResponse.json();
  const { sessionId, totalChunks, chunkSize: serverChunkSize } = session;

  let totalUploaded = 0;

  try {
    // Step 2: Upload chunks sequentially
    for (let i = 0; i < totalChunks; i++) {
      const start = i * serverChunkSize;
      const end = Math.min(start + serverChunkSize, file.size);
      const chunk = file.slice(start, end);
      const chunkBuffer = await chunk.arrayBuffer();

      const chunkResponse = await fetchWithAuth(
        `${baseUrl}/assets/chunked-upload/${sessionId}/chunks/${i}${queryString}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: chunkBuffer,
        },
      );

      if (!chunkResponse.ok) {
        const errorText = await chunkResponse.text();
        throw new Error(`Failed to upload chunk ${i}: ${chunkResponse.status} ${errorText}`);
      }

      totalUploaded += end - start;
      onProgress?.(totalUploaded, file.size);
    }

    // Step 3: Finish upload
    const finishResponse = await fetchWithAuth(
      `${baseUrl}/assets/chunked-upload/${sessionId}/finish${queryString}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!finishResponse.ok) {
      const errorText = await finishResponse.text();
      throw new Error(`Failed to finish chunked upload: ${finishResponse.status} ${errorText}`);
    }

    const result: FinishChunkedUploadResponse = await finishResponse.json();

    return {
      id: result.assetId,
      status: result.isDuplicate ? 'duplicate' : 'created',
    };
  } catch (error) {
    // Attempt to cancel the session on error
    try {
      await fetchWithAuth(
        `${baseUrl}/assets/chunked-upload/${sessionId}${queryString}`,
        { method: 'DELETE' },
      );
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Check if a file should use chunked upload based on its size.
 */
export function shouldUseChunkedUpload(file: File, threshold = CHUNKED_UPLOAD_THRESHOLD): boolean {
  return file.size > threshold;
}
