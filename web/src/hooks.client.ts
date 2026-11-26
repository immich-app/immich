import { isHttpError, type ApiHttpError } from '@immich/sdk';
import type { ClientCaughtError, HandleClientError } from '@sveltejs/kit/hooks';

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

const parseError = ({ kind, error }: ClientCaughtError) => {
  if (kind === 'unknown') {
    if (isHttpError(error)) {
      return parseHTTPError(error);
    }
    console.error(error);
    return;
  }

  return {
    message: error.message || DEFAULT_MESSAGE,
    code: error.status,
  };
};

export const handleError: HandleClientError = (error) => {
  const result = parseError(error);

  console.error(`[hooks.client.ts]:handleError ${result?.message}`, error);
  return result;
};
