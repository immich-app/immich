"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractHttpAdapter = void 0;
/**
 * @publicApi
 */
class AbstractHttpAdapter {
    constructor(instance) {
        this.instance = instance;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async init() { }
    use(...args) {
        return this.instance.use(...args);
    }
    get(...args) {
        return this.instance.get(...args);
    }
    post(...args) {
        return this.instance.post(...args);
    }
    head(...args) {
        return this.instance.head(...args);
    }
    delete(...args) {
        return this.instance.delete(...args);
    }
    put(...args) {
        return this.instance.put(...args);
    }
    patch(...args) {
        return this.instance.patch(...args);
    }
    all(...args) {
        return this.instance.all(...args);
    }
    options(...args) {
        return this.instance.options(...args);
    }
    listen(port, hostname, callback) {
        return this.instance.listen(port, hostname, callback);
    }
    getHttpServer() {
        return this.httpServer;
    }
    setHttpServer(httpServer) {
        this.httpServer = httpServer;
    }
    setInstance(instance) {
        this.instance = instance;
    }
    getInstance() {
        return this.instance;
    }
}
exports.AbstractHttpAdapter = AbstractHttpAdapter;
