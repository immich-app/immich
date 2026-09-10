import { HttpError } from '@oazapfts/runtime';

export interface ApiValidationError {
  code: string;
  path: (string | number)[];
  message: string;
}

export interface ApiExceptionResponse {
  message: string;
  error?: string;
  statusCode: number;
  errors?: ApiValidationError[];
}

export interface ApiHttpError extends HttpError {
  data: ApiExceptionResponse;
}

export function isHttpError(error: unknown): error is ApiHttpError {
  return error instanceof HttpError;
}

export class MalformedResponseError extends Error {
  override name = 'MalformedResponseError';

  constructor(
    reason: string,
    readonly url: string,
    readonly status: number,
    readonly contentType: string | null,
  ) {
    super(
      `${reason} (${url}, HTTP ${status}, content-type: ${contentType ?? 'none'})`,
    );
  }
}

export function isMalformedResponseError(
  error: unknown,
): error is MalformedResponseError {
  return error instanceof MalformedResponseError;
}
