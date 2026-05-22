import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

@Injectable()
export class PuApiRepository {
  private tokenCache: string | null | undefined;

  constructor(
    private configRepository: ConfigRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(PuApiRepository.name);
  }

  async syncTenantUsers(): Promise<void> {
    const { puApiHost, puTenantName } = this.configRepository.getEnv();
    if (!puApiHost || !puTenantName) {
      this.logger.debug('Skipping PU API tenant sync, PU_API_HOST or PU_TENANT_NAME is not configured');
      return;
    }

    await this.request({
      baseUrl: puApiHost,
      path: '/internal/api/immich/tenant-users/sync',
      query: { tenant: puTenantName },
      method: 'POST',
      context: 'tenant user sync',
    });
  }

  reverseGeocode<T>({ latitude, longitude }: { latitude: number; longitude: number }): Promise<T | null> {
    return this.requestGeodata<T>({
      path: '/reverse-geocode',
      query: { lat: latitude, lon: longitude },
      context: 'reverse geocode',
    });
  }

  searchPlaces<T>(query: string): Promise<T | null> {
    return this.requestGeodata<T>({
      path: '/search-places',
      query: { q: query },
      context: 'search places',
    });
  }

  private requestGeodata<T>({
    path,
    query,
    context,
    method = 'GET',
  }: {
    path: string;
    query?: Record<string, string | number>;
    method?: 'GET' | 'POST';
    context: string;
  }): Promise<T | null> {
    const { puApiHost } = this.configRepository.getEnv();
    return this.request<T>({
      baseUrl: puApiHost,
      path: `/internal/api/map${path}`,
      query,
      method,
      context,
    });
  }

  private async request<T>({
    baseUrl,
    path,
    query,
    method = 'GET',
    context,
  }: {
    baseUrl: string | null;
    path: string;
    query?: Record<string, string | number>;
    method?: 'GET' | 'POST';
    context: string;
  }): Promise<T | null> {
    if (!baseUrl) {
      this.logger.debug(`Skipping PU API request for ${context}, base URL is not configured`);
      return null;
    }

    const token = await this.getServiceAccountToken();
    if (!token) {
      this.logger.warn(`Skipping PU API request for ${context}, service account token is unavailable`);
      return null;
    }

    try {
      const url = new URL(path, baseUrl);
      for (const [key, value] of Object.entries(query || {})) {
        url.searchParams.set(key, String(value));
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.logger.error(`PU API request failed (${context}): ${response.status} ${response.statusText}`);
        return null;
      }

      if (response.headers.get('content-length') === '0') {
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      this.logger.error(`Failed PU API request (${context}): ${error}`);
      return null;
    }
  }

  private async getServiceAccountToken(): Promise<string | null> {
    if (this.tokenCache !== undefined) {
      return this.tokenCache;
    }

    const { puServiceAccountTokenPath } = this.configRepository.getEnv();
    try {
      const token = (await readFile(puServiceAccountTokenPath, 'utf8')).trim();
      if (!token) {
        this.logger.error(`Service account token file is empty: ${puServiceAccountTokenPath}`);
        this.tokenCache = null;
        return null;
      }

      this.tokenCache = token;
      return token;
    } catch (error) {
      this.logger.error(`Failed to read service account token at ${puServiceAccountTokenPath}: ${error}`);
      this.tokenCache = null;
      return null;
    }
  }
}
