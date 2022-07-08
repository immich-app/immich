"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = void 0;
/**
 * @publicApi
 */
var Scope;
(function (Scope) {
    /**
     * The provider can be shared across multiple classes. The provider lifetime
     * is strictly tied to the application lifecycle. Once the application has
     * bootstrapped, all providers have been instantiated.
     */
    Scope[Scope["DEFAULT"] = 0] = "DEFAULT";
    /**
     * A new private instance of the provider is instantiated for every use
     */
    Scope[Scope["TRANSIENT"] = 1] = "TRANSIENT";
    /**
     * A new instance is instantiated for each request processing pipeline
     */
    Scope[Scope["REQUEST"] = 2] = "REQUEST";
})(Scope = exports.Scope || (exports.Scope = {}));
