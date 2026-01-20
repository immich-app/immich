export enum S3ErrorType {
  Transient = 'transient',
  Permanent = 'permanent',
  Unknown = 'unknown',
}

const TRANSIENT_ERROR_NAMES = new Set([
  'SlowDown',
  'RequestTimeout',
  'InternalError',
  'ServiceUnavailable',
  'TimeoutError',
  'NetworkingError',
]);

const PERMANENT_ERROR_NAMES = new Set([
  'NoSuchBucket',
  'InvalidAccessKeyId',
  'SignatureDoesNotMatch',
  'AccessDenied',
  'InvalidBucketName',
  'NoSuchKey',
]);

const TRANSIENT_HTTP_CODES = new Set([500, 502, 503, 504, 429]);
const PERMANENT_HTTP_CODES = new Set([400, 401, 403, 404]);

const TRANSIENT_ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED']);

export function classifyS3Error(error: any): S3ErrorType {
  if (error.name && PERMANENT_ERROR_NAMES.has(error.name)) {
    return S3ErrorType.Permanent;
  }
  if (error.name && TRANSIENT_ERROR_NAMES.has(error.name)) {
    return S3ErrorType.Transient;
  }

  const httpCode = error.$metadata?.httpStatusCode;
  if (httpCode && PERMANENT_HTTP_CODES.has(httpCode)) {
    return S3ErrorType.Permanent;
  }
  if (httpCode && TRANSIENT_HTTP_CODES.has(httpCode)) {
    return S3ErrorType.Transient;
  }

  if (error.code && TRANSIENT_ERROR_CODES.has(error.code)) {
    return S3ErrorType.Transient;
  }

  return S3ErrorType.Unknown; // Default to retry
}
