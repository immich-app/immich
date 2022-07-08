"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationConfig = void 0;
class ApplicationConfig {
    constructor(ioAdapter = null) {
        this.ioAdapter = ioAdapter;
        this.globalPrefix = '';
        this.globalPrefixOptions = {};
        this.globalPipes = [];
        this.globalFilters = [];
        this.globalInterceptors = [];
        this.globalGuards = [];
        this.globalRequestPipes = [];
        this.globalRequestFilters = [];
        this.globalRequestInterceptors = [];
        this.globalRequestGuards = [];
    }
    setGlobalPrefix(prefix) {
        this.globalPrefix = prefix;
    }
    getGlobalPrefix() {
        return this.globalPrefix;
    }
    setGlobalPrefixOptions(options) {
        this.globalPrefixOptions = options;
    }
    getGlobalPrefixOptions() {
        return this.globalPrefixOptions;
    }
    setIoAdapter(ioAdapter) {
        this.ioAdapter = ioAdapter;
    }
    getIoAdapter() {
        return this.ioAdapter;
    }
    addGlobalPipe(pipe) {
        this.globalPipes.push(pipe);
    }
    useGlobalPipes(...pipes) {
        this.globalPipes = this.globalPipes.concat(pipes);
    }
    getGlobalFilters() {
        return this.globalFilters;
    }
    addGlobalFilter(filter) {
        this.globalFilters.push(filter);
    }
    useGlobalFilters(...filters) {
        this.globalFilters = this.globalFilters.concat(filters);
    }
    getGlobalPipes() {
        return this.globalPipes;
    }
    getGlobalInterceptors() {
        return this.globalInterceptors;
    }
    addGlobalInterceptor(interceptor) {
        this.globalInterceptors.push(interceptor);
    }
    useGlobalInterceptors(...interceptors) {
        this.globalInterceptors = this.globalInterceptors.concat(interceptors);
    }
    getGlobalGuards() {
        return this.globalGuards;
    }
    addGlobalGuard(guard) {
        this.globalGuards.push(guard);
    }
    useGlobalGuards(...guards) {
        this.globalGuards = this.globalGuards.concat(guards);
    }
    addGlobalRequestInterceptor(wrapper) {
        this.globalRequestInterceptors.push(wrapper);
    }
    getGlobalRequestInterceptors() {
        return this.globalRequestInterceptors;
    }
    addGlobalRequestPipe(wrapper) {
        this.globalRequestPipes.push(wrapper);
    }
    getGlobalRequestPipes() {
        return this.globalRequestPipes;
    }
    addGlobalRequestFilter(wrapper) {
        this.globalRequestFilters.push(wrapper);
    }
    getGlobalRequestFilters() {
        return this.globalRequestFilters;
    }
    addGlobalRequestGuard(wrapper) {
        this.globalRequestGuards.push(wrapper);
    }
    getGlobalRequestGuards() {
        return this.globalRequestGuards;
    }
    enableVersioning(options) {
        if (Array.isArray(options.defaultVersion)) {
            // Drop duplicated versions
            options.defaultVersion = Array.from(new Set(options.defaultVersion));
        }
        this.versioningOptions = options;
    }
    getVersioning() {
        return this.versioningOptions;
    }
}
exports.ApplicationConfig = ApplicationConfig;
