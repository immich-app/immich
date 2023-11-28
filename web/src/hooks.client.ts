import type { HandleClientError } from '@sveltejs/kit';
import type { AxiosError, AxiosResponse } from 'axios';

const LOG_PREFIX = '[hooks.client.ts]';
const DEFAULT_MESSAGE = 'Hmm, not sure about that. Check the logs or open a ticket?';

const parseError = (error: unknown) => {
  const httpError = error as AxiosError;
  const request = httpError?.request as Request & { path: string };
  const response = httpError?.response as AxiosResponse<{
    message: string;
    statusCode: number;
    error: string;
  }>;

  let code = response?.data?.statusCode || response?.status || httpError.code || '500';
  if (response) {
    code += ` - ${response.data?.error || response.statusText}`;
  }

  if (request && response) {
    console.log({
      status: response.status,
      url: `${request.method} ${request.path}`,
      response: response.data || 'No data',
    });
  }

  return {
    message: response?.data?.message || httpError?.message || DEFAULT_MESSAGE,
    code,
    stack: httpError?.stack,
  };
};

export const handleError: HandleClientError = ({ error }) => {
  const result = parseError(error);
  console.error(`${LOG_PREFIX}:handleError ${result.message}`);
  return result;
};
