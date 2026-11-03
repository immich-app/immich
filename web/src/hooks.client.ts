import { isHttpError, type ApiHttpError } from '@immich/sdk';
import type { HandleClientError } from '@sveltejs/kit/hooks';

const DEFAULT_MESSAGE = 'Hmm, not sure about that. Check the logs or open a ticket?';

const parseHTTPError = (httpError: ApiHttpError) => {
  const statusCode = httpError?.status || httpError?.data?.statusCode || 500;
  const message = httpError?.data?.message || (httpError?.data && String(httpError.data)) || httpError?.message;

  console.log({
    status: statusCode,
    response: httpError?.data || 'No data',
  });

  return {
    message: message || DEFAULT_MESSAGE,
    code: statusCode,
    stack: httpError?.stack,
  };
};

const parseError = (error: App.Error | { status: number; message: string }) => {
  if (isHttpError(error)) {
    return parseHTTPError(error);
  }

  return {
    message: error.message || DEFAULT_MESSAGE,
    code: error.status,
  };
};

export const handleError: HandleClientError = ({ kind, error }) => {
  if (kind === 'unknown') {
    console.error(error);
    return;
  }
  const result = parseError(error);
  console.error(`[hooks.client.ts]:handleError ${result.message}`, error);
  return result;
};
