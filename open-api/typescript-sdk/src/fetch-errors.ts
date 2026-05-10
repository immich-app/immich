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
