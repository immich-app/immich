"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceWrapper = exports.INSTANCE_ID_SYMBOL = exports.INSTANCE_METADATA_SYMBOL = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const random_string_generator_util_1 = require("@nestjs/common/utils/random-string-generator.util");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const iterare_1 = require("iterare");
const constants_1 = require("./constants");
exports.INSTANCE_METADATA_SYMBOL = Symbol.for('instance_metadata:cache');
exports.INSTANCE_ID_SYMBOL = Symbol.for('instance_metadata:id');
class InstanceWrapper {
    constructor(metadata = {}) {
        this.isAlias = false;
        this.scope = common_1.Scope.DEFAULT;
        this.values = new WeakMap();
        this[_a] = {};
        this[exports.INSTANCE_ID_SYMBOL] = (0, random_string_generator_util_1.randomStringGenerator)();
        this.initialize(metadata);
    }
    get id() {
        return this[exports.INSTANCE_ID_SYMBOL];
    }
    set instance(value) {
        this.values.set(constants_1.STATIC_CONTEXT, { instance: value });
    }
    get instance() {
        const instancePerContext = this.getInstanceByContextId(constants_1.STATIC_CONTEXT);
        return instancePerContext.instance;
    }
    get isNotMetatype() {
        const isFactory = this.metatype && !(0, shared_utils_1.isNil)(this.inject);
        return !this.metatype || isFactory;
    }
    get isTransient() {
        return this.scope === common_1.Scope.TRANSIENT;
    }
    getInstanceByContextId(contextId, inquirerId) {
        if (this.scope === common_1.Scope.TRANSIENT && inquirerId) {
            return this.getInstanceByInquirerId(contextId, inquirerId);
        }
        const instancePerContext = this.values.get(contextId);
        return instancePerContext
            ? instancePerContext
            : this.cloneStaticInstance(contextId);
    }
    getInstanceByInquirerId(contextId, inquirerId) {
        let collectionPerContext = this.transientMap.get(inquirerId);
        if (!collectionPerContext) {
            collectionPerContext = new WeakMap();
            this.transientMap.set(inquirerId, collectionPerContext);
        }
        const instancePerContext = collectionPerContext.get(contextId);
        return instancePerContext
            ? instancePerContext
            : this.cloneTransientInstance(contextId, inquirerId);
    }
    setInstanceByContextId(contextId, value, inquirerId) {
        if (this.scope === common_1.Scope.TRANSIENT && inquirerId) {
            return this.setInstanceByInquirerId(contextId, inquirerId, value);
        }
        this.values.set(contextId, value);
    }
    setInstanceByInquirerId(contextId, inquirerId, value) {
        let collection = this.transientMap.get(inquirerId);
        if (!collection) {
            collection = new WeakMap();
            this.transientMap.set(inquirerId, collection);
        }
        collection.set(contextId, value);
    }
    addCtorMetadata(index, wrapper) {
        if (!this[exports.INSTANCE_METADATA_SYMBOL].dependencies) {
            this[exports.INSTANCE_METADATA_SYMBOL].dependencies = [];
        }
        this[exports.INSTANCE_METADATA_SYMBOL].dependencies[index] = wrapper;
    }
    getCtorMetadata() {
        return this[exports.INSTANCE_METADATA_SYMBOL].dependencies;
    }
    addPropertiesMetadata(key, wrapper) {
        if (!this[exports.INSTANCE_METADATA_SYMBOL].properties) {
            this[exports.INSTANCE_METADATA_SYMBOL].properties = [];
        }
        this[exports.INSTANCE_METADATA_SYMBOL].properties.push({
            key,
            wrapper,
        });
    }
    getPropertiesMetadata() {
        return this[exports.INSTANCE_METADATA_SYMBOL].properties;
    }
    addEnhancerMetadata(wrapper) {
        if (!this[exports.INSTANCE_METADATA_SYMBOL].enhancers) {
            this[exports.INSTANCE_METADATA_SYMBOL].enhancers = [];
        }
        this[exports.INSTANCE_METADATA_SYMBOL].enhancers.push(wrapper);
    }
    getEnhancersMetadata() {
        return this[exports.INSTANCE_METADATA_SYMBOL].enhancers;
    }
    isDependencyTreeStatic(lookupRegistry = []) {
        if (!(0, shared_utils_1.isUndefined)(this.isTreeStatic)) {
            return this.isTreeStatic;
        }
        if (this.scope === common_1.Scope.REQUEST) {
            this.isTreeStatic = false;
            return this.isTreeStatic;
        }
        if (lookupRegistry.includes(this[exports.INSTANCE_ID_SYMBOL])) {
            return true;
        }
        lookupRegistry = lookupRegistry.concat(this[exports.INSTANCE_ID_SYMBOL]);
        const { dependencies, properties, enhancers } = this[exports.INSTANCE_METADATA_SYMBOL];
        let isStatic = (dependencies &&
            this.isWrapperListStatic(dependencies, lookupRegistry)) ||
            !dependencies;
        if (!isStatic || !(properties || enhancers)) {
            this.isTreeStatic = isStatic;
            return this.isTreeStatic;
        }
        const propertiesHosts = (properties || []).map(item => item.wrapper);
        isStatic =
            isStatic && this.isWrapperListStatic(propertiesHosts, lookupRegistry);
        if (!isStatic || !enhancers) {
            this.isTreeStatic = isStatic;
            return this.isTreeStatic;
        }
        this.isTreeStatic = this.isWrapperListStatic(enhancers, lookupRegistry);
        return this.isTreeStatic;
    }
    cloneStaticInstance(contextId) {
        const staticInstance = this.getInstanceByContextId(constants_1.STATIC_CONTEXT);
        if (this.isDependencyTreeStatic()) {
            return staticInstance;
        }
        const instancePerContext = Object.assign(Object.assign({}, staticInstance), { instance: undefined, isResolved: false, isPending: false });
        if (this.isNewable()) {
            instancePerContext.instance = Object.create(this.metatype.prototype);
        }
        this.setInstanceByContextId(contextId, instancePerContext);
        return instancePerContext;
    }
    cloneTransientInstance(contextId, inquirerId) {
        const staticInstance = this.getInstanceByContextId(constants_1.STATIC_CONTEXT);
        const instancePerContext = Object.assign(Object.assign({}, staticInstance), { instance: undefined, isResolved: false, isPending: false });
        if (this.isNewable()) {
            instancePerContext.instance = Object.create(this.metatype.prototype);
        }
        this.setInstanceByInquirerId(contextId, inquirerId, instancePerContext);
        return instancePerContext;
    }
    createPrototype(contextId) {
        const host = this.getInstanceByContextId(contextId);
        if (!this.isNewable() || host.isResolved) {
            return;
        }
        return Object.create(this.metatype.prototype);
    }
    isInRequestScope(contextId, inquirer) {
        const isDependencyTreeStatic = this.isDependencyTreeStatic();
        return (!isDependencyTreeStatic &&
            contextId !== constants_1.STATIC_CONTEXT &&
            (!this.isTransient || (this.isTransient && !!inquirer)));
    }
    isLazyTransient(contextId, inquirer) {
        const isInquirerRequestScoped = inquirer && !inquirer.isDependencyTreeStatic();
        return (this.isDependencyTreeStatic() &&
            contextId !== constants_1.STATIC_CONTEXT &&
            this.isTransient &&
            isInquirerRequestScoped);
    }
    isExplicitlyRequested(contextId, inquirer) {
        const isSelfRequested = inquirer === this;
        return (this.isDependencyTreeStatic() &&
            contextId !== constants_1.STATIC_CONTEXT &&
            (isSelfRequested || (inquirer && inquirer.scope === common_1.Scope.TRANSIENT)));
    }
    isStatic(contextId, inquirer) {
        const isInquirerRequestScoped = inquirer && !inquirer.isDependencyTreeStatic();
        const isStaticTransient = this.isTransient && !isInquirerRequestScoped;
        return (this.isDependencyTreeStatic() &&
            contextId === constants_1.STATIC_CONTEXT &&
            (!this.isTransient ||
                (isStaticTransient && !!inquirer && !inquirer.isTransient)));
    }
    getStaticTransientInstances() {
        if (!this.transientMap) {
            return [];
        }
        const instances = [...this.transientMap.values()];
        return (0, iterare_1.iterate)(instances)
            .map(item => item.get(constants_1.STATIC_CONTEXT))
            .filter(item => !!item)
            .toArray();
    }
    mergeWith(provider) {
        if (!(0, shared_utils_1.isUndefined)(provider.useValue)) {
            this.metatype = null;
            this.inject = null;
            this.scope = common_1.Scope.DEFAULT;
            this.setInstanceByContextId(constants_1.STATIC_CONTEXT, {
                instance: provider.useValue,
                isResolved: true,
                isPending: false,
            });
        }
        else if (provider.useClass) {
            this.inject = null;
            this.metatype = provider.useClass;
        }
        else if (provider.useFactory) {
            this.metatype = provider.useFactory;
            this.inject = provider.inject || [];
        }
    }
    isNewable() {
        return (0, shared_utils_1.isNil)(this.inject) && this.metatype && this.metatype.prototype;
    }
    isWrapperListStatic(tree, lookupRegistry) {
        return tree.every((item) => item.isDependencyTreeStatic(lookupRegistry));
    }
    initialize(metadata) {
        const { instance, isResolved } = metadata, wrapperPartial = tslib_1.__rest(metadata, ["instance", "isResolved"]);
        Object.assign(this, wrapperPartial);
        this.setInstanceByContextId(constants_1.STATIC_CONTEXT, {
            instance,
            isResolved,
        });
        this.scope === common_1.Scope.TRANSIENT && (this.transientMap = new Map());
    }
}
exports.InstanceWrapper = InstanceWrapper;
_a = exports.INSTANCE_METADATA_SYMBOL;
