"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpErrorByCode = void 0;
const enums_1 = require("../enums");
const exceptions_1 = require("../exceptions");
exports.HttpErrorByCode = {
    [enums_1.HttpStatus.BAD_GATEWAY]: exceptions_1.BadGatewayException,
    [enums_1.HttpStatus.BAD_REQUEST]: exceptions_1.BadRequestException,
    [enums_1.HttpStatus.CONFLICT]: exceptions_1.ConflictException,
    [enums_1.HttpStatus.FORBIDDEN]: exceptions_1.ForbiddenException,
    [enums_1.HttpStatus.GATEWAY_TIMEOUT]: exceptions_1.GatewayTimeoutException,
    [enums_1.HttpStatus.GONE]: exceptions_1.GoneException,
    [enums_1.HttpStatus.I_AM_A_TEAPOT]: exceptions_1.ImATeapotException,
    [enums_1.HttpStatus.INTERNAL_SERVER_ERROR]: exceptions_1.InternalServerErrorException,
    [enums_1.HttpStatus.METHOD_NOT_ALLOWED]: exceptions_1.MethodNotAllowedException,
    [enums_1.HttpStatus.NOT_ACCEPTABLE]: exceptions_1.NotAcceptableException,
    [enums_1.HttpStatus.NOT_FOUND]: exceptions_1.NotFoundException,
    [enums_1.HttpStatus.NOT_IMPLEMENTED]: exceptions_1.NotImplementedException,
    [enums_1.HttpStatus.PAYLOAD_TOO_LARGE]: exceptions_1.PayloadTooLargeException,
    [enums_1.HttpStatus.PRECONDITION_FAILED]: exceptions_1.PreconditionFailedException,
    [enums_1.HttpStatus.REQUEST_TIMEOUT]: exceptions_1.RequestTimeoutException,
    [enums_1.HttpStatus.SERVICE_UNAVAILABLE]: exceptions_1.ServiceUnavailableException,
    [enums_1.HttpStatus.UNAUTHORIZED]: exceptions_1.UnauthorizedException,
    [enums_1.HttpStatus.UNPROCESSABLE_ENTITY]: exceptions_1.UnprocessableEntityException,
    [enums_1.HttpStatus.UNSUPPORTED_MEDIA_TYPE]: exceptions_1.UnsupportedMediaTypeException,
};
