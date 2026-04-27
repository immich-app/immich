import { HttpError } from '@oazapfts/runtime';
export interface ApiExceptionResponse {
    message: string;
    error?: string;
    statusCode: number;
}
export interface ApiHttpError extends HttpError {
    data: ApiExceptionResponse;
}
export declare function isHttpError(error: unknown): error is ApiHttpError;
