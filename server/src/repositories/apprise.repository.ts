import { Injectable } from '@nestjs/common';
import { LoggingRepository } from 'src/repositories/logging.repository.js';

export type AppriseOptions = {
  host: string;
  port: number | null;
  secure: boolean;
  basePath: string;
  configId: string;
  username: string;
  password: string;
  timeout: number;
};

export type AppriseNotification = {
  title: string;
  body: string;
  tag: string;
};

type AppriseResponse = {
  error?: unknown;
  details?: unknown;
};

const MAX_MESSAGE_LENGTH = 500;

/**
 * Turns tags separated by commas and/or spaces into one space-separated string.
 * - Apprise treats space-separated tags as "all must match" (AND).
 * - An empty result means "notify the URLs that have no tag".
 */
export const normalizeAppriseTags = (...values: string[]) =>
  [...new Set(values.flatMap((value) => value.split(/[\s,]+/)).filter(Boolean))].join(' ');

export class AppriseError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message.length > MAX_MESSAGE_LENGTH ? `${message.slice(0, MAX_MESSAGE_LENGTH)}…` : message);
    this.name = AppriseError.name;
  }
}

const parseResponse = (text: string): AppriseResponse => {
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
};

/** Collects the error and warning lines Apprise returns in `details` as `[level, time, message]`. */
const getFailures = (details: unknown) =>
  Array.isArray(details)
    ? details
        .filter((line) => Array.isArray(line) && ['ERROR', 'WARNING'].includes(line[0]))
        .map((line) => String(line[2]))
    : [];

const toError = (response: Response, { error, details }: AppriseResponse) => {
  const { status } = response;
  const reason = typeof error === 'string' && error ? error : response.statusText;

  if (status >= 300 && status < 400) {
    return new AppriseError('Unexpected redirect, check secure and base path', status);
  }

  switch (status) {
    case 400: {
      return new AppriseError(`Request rejected: ${reason}`, status);
    }
    case 401: {
      return new AppriseError('Wrong username or password', status);
    }
    case 403: {
      return new AppriseError(`Access denied: ${reason}`, status);
    }
    case 404: {
      return new AppriseError('No configuration found for this config ID', status);
    }
    case 417: {
      return new AppriseError(`Server problem: ${reason}`, status);
    }
    case 424: {
      // Apprise also answers 424, with no failure lines, when no services match the tags
      const failures = getFailures(details);
      return new AppriseError(
        failures.length > 0
          ? `Some services failed: ${failures.join('; ')}`
          : 'No services were notified, check the tags',
        status,
      );
    }
  }

  if (status >= 500) {
    const retryAfter = response.headers.get('retry-after');
    const suffix = retryAfter ? `, retry after ${retryAfter}s` : '';
    return new AppriseError(`Server error (${status})${suffix}`, status);
  }

  return new AppriseError(`Unexpected response (${status}): ${reason}`, status);
};

@Injectable()
export class AppriseRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(AppriseRepository.name);
  }

  /** Checks the server is reachable and accepts the credentials, without sending a notification. */
  async verify(options: AppriseOptions): Promise<void> {
    await this.request(options, 'status');
  }

  async notify(options: AppriseOptions, { title, body, tag }: AppriseNotification): Promise<void> {
    await this.request(options, 'notify', { title, body, type: 'info', format: 'text', ...(tag && { tag }) });
  }

  private async request(options: AppriseOptions, route: 'status' | 'notify', payload?: object) {
    const { secure, basePath, configId, username, password, timeout } = options;
    if (!options.host || !configId) {
      throw new AppriseError('Host and config ID are required');
    }

    // IPv6 addresses need square brackets inside a URL
    const host = options.host.includes(':') && !options.host.startsWith('[') ? `[${options.host}]` : options.host;
    const port = options.port ?? (secure ? 443 : 80);
    const path = [basePath.replaceAll(/^\/+|\/+$/g, ''), route, encodeURIComponent(configId)].filter(Boolean).join('/');

    let url: URL;
    try {
      url = new URL(`${secure ? 'https' : 'http'}://${host}:${port}/${path}`);
    } catch {
      throw new AppriseError(`Invalid host: ${options.host}`);
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (payload) {
      headers['Content-Type'] = 'application/json';
    }
    if (username || password) {
      headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }

    let response: Response;
    let text: string;
    try {
      response = await fetch(url, {
        method: payload ? 'POST' : 'GET',
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
        redirect: 'manual',
        signal: AbortSignal.timeout(timeout * 1000),
      });
      text = await response.text();
    } catch (error: Error | any) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        throw new AppriseError(`No response within ${timeout}s`);
      }
      const code = error?.cause?.code ? ` (${error.cause.code})` : '';
      throw new AppriseError(`Cannot connect to ${host}:${port}${code}`);
    }

    if (!response.ok) {
      throw toError(response, parseResponse(text));
    }

    this.logger.debug(`Apprise ${route} request succeeded with status ${response.status}`);
  }
}
