import { HttpStatus } from '../enums';
import { Type } from '../interfaces';
export declare type ErrorHttpStatusCode = HttpStatus.BAD_GATEWAY | HttpStatus.BAD_REQUEST | HttpStatus.CONFLICT | HttpStatus.FORBIDDEN | HttpStatus.GATEWAY_TIMEOUT | HttpStatus.GONE | HttpStatus.I_AM_A_TEAPOT | HttpStatus.INTERNAL_SERVER_ERROR | HttpStatus.METHOD_NOT_ALLOWED | HttpStatus.NOT_ACCEPTABLE | HttpStatus.NOT_FOUND | HttpStatus.NOT_IMPLEMENTED | HttpStatus.PAYLOAD_TOO_LARGE | HttpStatus.PRECONDITION_FAILED | HttpStatus.REQUEST_TIMEOUT | HttpStatus.SERVICE_UNAVAILABLE | HttpStatus.UNAUTHORIZED | HttpStatus.UNPROCESSABLE_ENTITY | HttpStatus.UNSUPPORTED_MEDIA_TYPE;
export declare const HttpErrorByCode: Record<ErrorHttpStatusCode, Type<unknown>>;
