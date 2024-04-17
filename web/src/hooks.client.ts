import { isHttpError } from '@immich/sdk';
import type { HandleClientError } from '@sveltejs/kit';

const DEFAULT_MESSAGE = 'Hmm, not sure about that. Check the logs or open a ticket?';

const parseError = (error: unknown, statusCode: number, message?: string) => {
  const httpError = isHttpError(error) ? error : undefined;

  if (!message) {
    message = httpError?.data?.message || (httpError?.data && String(httpError.data)) || httpError?.message;
  }

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

export const handleError: HandleClientError = ({ error, status }) => {
  const result = parseError(error, status, status === 404 ? 'This page does not exist' : undefined);
  console.error(`[hooks.client.ts]:handleError ${result.message}`);
  return result;
};
