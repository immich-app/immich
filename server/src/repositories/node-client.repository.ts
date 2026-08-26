import { Injectable } from '@nestjs/common';
import { openAsBlob } from 'node:fs';
import { Readable } from 'node:stream';
import { LoggingRepository } from 'src/repositories/logging.repository';

export type NodeCredentials = {
  url: string;
  apiKey: string;
};

export type RemoteServerInfo = {
  version: string;
  versionMajor: number;
  versionMinor: number;
};

export type RemoteUser = {
  id: string;
  email: string;
  name: string;
};

export type RemoteAsset = {
  id: string;
  checksum: string;
  originalFileName: string;
  fileCreatedAt: string;
  fileModifiedAt: string;
  isFavorite: boolean;
  isArchived: boolean;
  visibility?: string;
  type: string;
  updatedAt: string;
  description?: string;
};

export type RemoteAlbum = {
  id: string;
  albumName: string;
  description: string;
  assetIds?: string[];
};

export type RemoteApiKey = {
  permissions: string[];
};

export class NodeClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** Plenty for a JSON round-trip, short enough that an unresponsive peer is noticed. */
const API_TIMEOUT_MS = 60_000;

/**
 * Moving an asset is not an API call. A large video over a slow link legitimately
 * takes many minutes, and holding it to the same timeout is what turns a working
 * sync into a stream of aborted transfers.
 */
const TRANSFER_TIMEOUT_MS = 30 * 60_000;

/**
 * A client for another Immich instance. This is the only place that speaks to a
 * peer, so everything above it deals in plain objects rather than HTTP.
 *
 * Deliberately hand-rolled rather than using `@immich/sdk`: the SDK holds its
 * base URL and key in module-level state, which cannot represent more than one
 * peer at a time.
 */
@Injectable()
export class NodeClientRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(NodeClientRepository.name);
  }

  private async request<T>(
    { url, apiKey }: NodeCredentials,
    path: string,
    init: RequestInit & { raw?: boolean; transfer?: boolean } = {},
  ): Promise<T> {
    const { raw, transfer, ...rest } = init;
    const target = new URL(`/api${path}`, url).href;

    let response: Response;
    try {
      response = await fetch(target, {
        ...rest,
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
          ...rest.headers,
        },
        signal: AbortSignal.timeout(transfer ? TRANSFER_TIMEOUT_MS : API_TIMEOUT_MS),
      });
    } catch (error: any) {
      // A transport failure is not the same as a rejection, and the caller needs
      // to tell them apart to decide whether the peer is unreachable or hostile.
      throw new NodeClientError(`Could not reach ${url}: ${error?.message ?? error}`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new NodeClientError(
        `${rest.method ?? 'GET'} ${path} failed: ${response.status} ${body.slice(0, 200)}`,
        response.status,
      );
    }

    if (raw) {
      return response as unknown as T;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private json(body: unknown): RequestInit {
    return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
  }

  async ping(credentials: NodeCredentials): Promise<boolean> {
    const result = await this.request<{ res: string }>(credentials, '/server/ping');
    return result?.res === 'pong';
  }

  async getServerInfo(credentials: NodeCredentials): Promise<RemoteServerInfo> {
    const version = await this.request<{ major: number; minor: number; patch: number }>(credentials, '/server/version');
    return {
      version: `${version.major}.${version.minor}.${version.patch}`,
      versionMajor: version.major,
      versionMinor: version.minor,
    };
  }

  getMyApiKey(credentials: NodeCredentials): Promise<RemoteApiKey> {
    return this.request<RemoteApiKey>(credentials, '/api-keys/me');
  }

  /** Who a given key actually acts as, which is what asset endpoints key off. */
  getMe(credentials: NodeCredentials): Promise<RemoteUser> {
    return this.request<RemoteUser>(credentials, '/users/me');
  }

  searchUsers(credentials: NodeCredentials): Promise<RemoteUser[]> {
    return this.request<RemoteUser[]>(credentials, '/admin/users?withDeleted=false');
  }

  /**
   * One page of the peer's assets for a user, newest-updated last so a cursor can
   * advance safely. `updatedAfter` is what makes the pull incremental.
   */
  async searchAssets(
    credentials: NodeCredentials,
    options: { userId: string; updatedAfter?: Date; page: number; size: number },
  ): Promise<{ items: RemoteAsset[]; nextPage: string | null }> {
    const body: Record<string, unknown> = {
      userId: options.userId,
      page: options.page,
      size: options.size,
      order: 'asc',
      withDeleted: false,
    };

    if (options.updatedAfter) {
      body.updatedAfter = options.updatedAfter.toISOString();
    }

    const result = await this.request<{ assets: { items: RemoteAsset[]; nextPage: string | null } }>(
      credentials,
      '/search/metadata',
      { method: 'POST', ...this.json(body) },
    );

    return result.assets;
  }

  /** Checksums the peer already has, so identical bytes are never uploaded twice. */
  async bulkUploadCheck(
    credentials: NodeCredentials,
    assets: { id: string; checksum: string }[],
  ): Promise<Record<string, { action: string; assetId?: string }>> {
    const result = await this.request<{
      results: { id: string; action: string; assetId?: string }[];
    }>(credentials, '/assets/bulk-upload-check', { method: 'POST', ...this.json({ assets }) });

    return Object.fromEntries(result.results.map((item) => [item.id, item]));
  }

  async uploadAsset(
    credentials: NodeCredentials,
    options: {
      deviceAssetId: string;
      deviceId: string;
      fileCreatedAt: Date;
      fileModifiedAt: Date;
      isFavorite: boolean;
      filename: string;
      /** Local path. Read lazily so a large video is never held in memory. */
      path: string;
      sidecar?: { filename: string; path: string };
    },
  ): Promise<{ id: string; status: string }> {
    const form = new FormData();
    form.append('deviceAssetId', options.deviceAssetId);
    form.append('deviceId', options.deviceId);
    form.append('fileCreatedAt', options.fileCreatedAt.toISOString());
    form.append('fileModifiedAt', options.fileModifiedAt.toISOString());
    form.append('isFavorite', String(options.isFavorite));

    form.append('assetData', await openAsBlob(options.path), options.filename);
    if (options.sidecar) {
      form.append('sidecarData', await openAsBlob(options.sidecar.path), options.sidecar.filename);
    }

    return this.request<{ id: string; status: string }>(credentials, '/assets', {
      method: 'POST',
      body: form,
      transfer: true,
    });
  }

  getRemoteAsset(credentials: NodeCredentials, assetId: string): Promise<RemoteAsset> {
    return this.request<RemoteAsset>(credentials, `/assets/${assetId}`);
  }

  async downloadAsset(credentials: NodeCredentials, assetId: string): Promise<Readable> {
    const response = await this.request<Response>(credentials, `/assets/${assetId}/original`, {
      raw: true,
      transfer: true,
    });
    if (!response.body) {
      throw new NodeClientError(`Asset ${assetId} returned no body`);
    }
    return Readable.fromWeb(response.body as never);
  }

  async updateAsset(
    credentials: NodeCredentials,
    assetId: string,
    dto: { isFavorite?: boolean; description?: string; dateTimeOriginal?: string; visibility?: string },
  ): Promise<void> {
    await this.request(credentials, `/assets/${assetId}`, { method: 'PUT', ...this.json(dto) });
  }

  /**
   * Moves assets to the peer's trash. `force: false` is what keeps this
   * recoverable -- it must never become a hard delete.
   */
  async trashAssets(credentials: NodeCredentials, ids: string[]): Promise<void> {
    await this.request(credentials, '/assets', { method: 'DELETE', ...this.json({ ids, force: false }) });
  }

  getAlbums(credentials: NodeCredentials): Promise<RemoteAlbum[]> {
    return this.request<RemoteAlbum[]>(credentials, '/albums');
  }

  getAlbum(credentials: NodeCredentials, albumId: string): Promise<RemoteAlbum & { assets: { id: string }[] }> {
    return this.request(credentials, `/albums/${albumId}`);
  }

  createAlbum(
    credentials: NodeCredentials,
    dto: { albumName: string; description?: string; assetIds?: string[] },
  ): Promise<RemoteAlbum> {
    return this.request<RemoteAlbum>(credentials, '/albums', { method: 'POST', ...this.json(dto) });
  }

  async addAssetsToAlbum(credentials: NodeCredentials, albumId: string, ids: string[]): Promise<void> {
    await this.request(credentials, `/albums/${albumId}/assets`, { method: 'PUT', ...this.json({ ids }) });
  }
}
