"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpAdapterHost = void 0;
/**
 * Defines the `HttpAdapterHost` object.
 *
 * `HttpAdapterHost` wraps the underlying
 * platform-specific `HttpAdapter`.  The `HttpAdapter` is a wrapper around the underlying
 * native HTTP server library (e.g., Express).  The `HttpAdapterHost` object
 * provides methods to `get` and `set` the underlying HttpAdapter.
 *
 * @see [Http adapter](https://docs.nestjs.com/faq/http-adapter)
 *
 * @publicApi
 */
class HttpAdapterHost {
    /**
     * Accessor for the underlying `HttpAdapter`
     *
     * @param httpAdapter reference to the `HttpAdapter` to be set
     */
    set httpAdapter(httpAdapter) {
        this._httpAdapter = httpAdapter;
    }
    /**
     * Accessor for the underlying `HttpAdapter`
     *
     * @example
     * `const httpAdapter = adapterHost.httpAdapter;`
     */
    get httpAdapter() {
        return this._httpAdapter;
    }
}
exports.HttpAdapterHost = HttpAdapterHost;
