import { BadRequestException, Injectable } from '@nestjs/common';
import { LoggingRepository } from 'src/repositories/logging.repository.js';

export type AppriseOptions = {
  url: string;
  configId: string;
  username: string;
  password: string;
  timeout: number;
};

export type AppriseNotification = {
  title: string;
  body: string;
  urls: string[];
  type?: 'info' | 'success' | 'warning' | 'failure';
};

type AppriseRequest = Required<AppriseNotification> & { format: 'text' };

type AppriseResponse = {
  error?: unknown;
  details?: unknown;
  stateless_enabled?: boolean;
  privilege?: string;
  access?: string;
};

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

const toMessage = (response: Response, { error, details }: AppriseResponse) => {
  const { status } = response;
  const reason = typeof error === 'string' && error ? error : response.statusText;

  if (status >= 300 && status < 400) {
    return 'Unexpected redirect, check the URL';
  }

  switch (status) {
    case 400: {
      return `Request rejected: ${reason}`;
    }
    case 401: {
      return 'Wrong username or password';
    }
    case 403: {
      return `Access denied: ${reason}`;
    }
    case 404: {
      return 'No configuration found for this config ID';
    }
    case 417: {
      return `Server problem: ${reason}`;
    }
    case 424: {
      const failures = getFailures(details);
      const suffix = failures.length > 0 ? `: ${failures.join('; ')}` : '';
      return `Some services failed${suffix}`;
    }
  }

  if (status >= 500) {
    const retryAfter = response.headers.get('retry-after');
    const suffix = retryAfter ? `, retry after ${retryAfter}s` : '';
    return `Server error (${status})${suffix}`;
  }

  return `Unexpected response (${status}): ${reason}`;
};

@Injectable()
export class AppriseRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(AppriseRepository.name);
  }

  /** Checks the server is reachable and accepts the credentials, without sending a notification. */
  async verify(options: AppriseOptions): Promise<void> {
    const response = await this.request(options, 'status');
    if (response.stateless_enabled === false) {
      throw this.fail('status', 'Stateless notifications are turned off on the Apprise server');
    }

    // A configuration login (not an admin) can only send to other URLs when its access is "user"
    if (response.privilege !== 'user') {
      return;
    }

    const { access } = await this.request(options, 'auth');
    if (access && access !== 'user') {
      throw this.fail('auth', `Stateless notifications are not allowed for this login (access: ${access})`);
    }
  }

  /** Sends to the given Apprise URLs (stateless), so each user's notifications go to their own services. */
  async notify(options: AppriseOptions, { title, body, urls, type = 'info' }: AppriseNotification): Promise<void> {
    await this.request(options, 'notify', { urls, title, body, type, format: 'text' });
  }

  private async request(
    options: AppriseOptions,
    route: 'status' | 'auth' | 'notify',
    payload?: AppriseRequest,
  ): Promise<AppriseResponse> {
    const { url, configId, username, password, timeout } = options;
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (payload) {
      headers['Content-Type'] = 'application/json';
    }
    // The config ID is sent as a header so Apprise checks the username and password against that configuration
    if (configId) {
      headers['X-Apprise-Config-ID'] = configId;
    }
    if (username || password) {
      headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    }

    try {
      const response = await fetch(new URL(route, url.endsWith('/') ? url : `${url}/`), {
        method: payload ? 'POST' : 'GET',
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
        redirect: 'manual',
        signal: AbortSignal.timeout(timeout * 1000),
      });
      const body = parseResponse(await response.text());
      if (!response.ok) {
        throw this.fail(route, toMessage(response, body));
      }

      this.logger.debug(`Apprise ${route} request succeeded with status ${response.status}`);
      return body;
    } catch (error: Error | any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        throw this.fail(route, `No response within ${timeout}s`);
      }
      // Only the host is shown, so a username, password or query in the URL never ends up in a message
      const host = URL.parse(url)?.host ?? 'the Apprise server';
      throw this.fail(route, `Cannot connect to ${host}${error?.cause?.code ? ` (${error.cause.code})` : ''}`);
    }
  }

  private fail(route: string, message: string) {
    this.logger.error(`Apprise ${route} request failed: ${message}`);
    return new BadRequestException(message);
  }
}
