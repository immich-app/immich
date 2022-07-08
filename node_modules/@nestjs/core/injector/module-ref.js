"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleRef = void 0;
const common_1 = require("@nestjs/common");
const invalid_class_scope_exception_1 = require("../errors/exceptions/invalid-class-scope.exception");
const unknown_element_exception_1 = require("../errors/exceptions/unknown-element.exception");
const get_class_scope_1 = require("../helpers/get-class-scope");
const injector_1 = require("./injector");
const instance_links_host_1 = require("./instance-links-host");
const instance_wrapper_1 = require("./instance-wrapper");
class ModuleRef {
    constructor(container) {
        this.container = container;
        this.injector = new injector_1.Injector();
    }
    get instanceLinksHost() {
        if (!this._instanceLinksHost) {
            this._instanceLinksHost = new instance_links_host_1.InstanceLinksHost(this.container);
        }
        return this._instanceLinksHost;
    }
    introspect(token) {
        const { wrapperRef } = this.instanceLinksHost.get(token);
        let scope = common_1.Scope.DEFAULT;
        if (!wrapperRef.isDependencyTreeStatic()) {
            scope = common_1.Scope.REQUEST;
        }
        else if (wrapperRef.isTransient) {
            scope = common_1.Scope.TRANSIENT;
        }
        return { scope };
    }
    registerRequestByContextId(request, contextId) {
        this.container.registerRequestProvider(request, contextId);
    }
    find(typeOrToken, contextModule) {
        const moduleId = contextModule && contextModule.id;
        const { wrapperRef } = this.instanceLinksHost.get(typeOrToken, moduleId);
        if (wrapperRef.scope === common_1.Scope.REQUEST ||
            wrapperRef.scope === common_1.Scope.TRANSIENT) {
            throw new invalid_class_scope_exception_1.InvalidClassScopeException(typeOrToken);
        }
        return wrapperRef.instance;
    }
    async resolvePerContext(typeOrToken, contextModule, contextId, options) {
        const isStrictModeEnabled = options && options.strict;
        const instanceLink = isStrictModeEnabled
            ? this.instanceLinksHost.get(typeOrToken, contextModule.id)
            : this.instanceLinksHost.get(typeOrToken);
        const { wrapperRef, collection } = instanceLink;
        if (wrapperRef.isDependencyTreeStatic() && !wrapperRef.isTransient) {
            return this.get(typeOrToken, options);
        }
        const ctorHost = wrapperRef.instance || { constructor: typeOrToken };
        const instance = await this.injector.loadPerContext(ctorHost, wrapperRef.host, collection, contextId, wrapperRef);
        if (!instance) {
            throw new unknown_element_exception_1.UnknownElementException();
        }
        return instance;
    }
    async instantiateClass(type, moduleRef) {
        const wrapper = new instance_wrapper_1.InstanceWrapper({
            name: type && type.name,
            metatype: type,
            isResolved: false,
            scope: (0, get_class_scope_1.getClassScope)(type),
            host: moduleRef,
        });
        return new Promise(async (resolve, reject) => {
            try {
                const callback = async (instances) => {
                    const properties = await this.injector.resolveProperties(wrapper, moduleRef);
                    const instance = new type(...instances);
                    this.injector.applyProperties(instance, properties);
                    resolve(instance);
                };
                await this.injector.resolveConstructorParams(wrapper, moduleRef, undefined, callback);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.ModuleRef = ModuleRef;
