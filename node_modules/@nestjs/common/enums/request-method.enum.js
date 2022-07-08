"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestMethod = void 0;
var RequestMethod;
(function (RequestMethod) {
    RequestMethod[RequestMethod["GET"] = 0] = "GET";
    RequestMethod[RequestMethod["POST"] = 1] = "POST";
    RequestMethod[RequestMethod["PUT"] = 2] = "PUT";
    RequestMethod[RequestMethod["DELETE"] = 3] = "DELETE";
    RequestMethod[RequestMethod["PATCH"] = 4] = "PATCH";
    RequestMethod[RequestMethod["ALL"] = 5] = "ALL";
    RequestMethod[RequestMethod["OPTIONS"] = 6] = "OPTIONS";
    RequestMethod[RequestMethod["HEAD"] = 7] = "HEAD";
})(RequestMethod = exports.RequestMethod || (exports.RequestMethod = {}));
