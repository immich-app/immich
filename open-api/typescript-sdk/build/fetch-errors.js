import { HttpError } from '@oazapfts/runtime';
export function isHttpError(error) {
    return error instanceof HttpError;
}
