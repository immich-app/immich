"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceLinksHost = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const unknown_element_exception_1 = require("../errors/exceptions/unknown-element.exception");
class InstanceLinksHost {
    constructor(container) {
        this.container = container;
        this.instanceLinks = new Map();
        this.initialize();
    }
    get(token, moduleId) {
        const modulesMap = this.instanceLinks.get(token);
        if (!modulesMap) {
            throw new unknown_element_exception_1.UnknownElementException(this.getInstanceNameByToken(token));
        }
        const instanceLink = moduleId
            ? modulesMap.find(item => item.moduleId === moduleId)
            : modulesMap[modulesMap.length - 1];
        if (!instanceLink) {
            throw new unknown_element_exception_1.UnknownElementException(this.getInstanceNameByToken(token));
        }
        return instanceLink;
    }
    initialize() {
        const modules = this.container.getModules();
        modules.forEach(moduleRef => {
            const { providers, injectables, controllers } = moduleRef;
            providers.forEach((wrapper, token) => this.addLink(wrapper, token, moduleRef, 'providers'));
            injectables.forEach((wrapper, token) => this.addLink(wrapper, token, moduleRef, 'injectables'));
            controllers.forEach((wrapper, token) => this.addLink(wrapper, token, moduleRef, 'controllers'));
        });
    }
    addLink(wrapper, token, moduleRef, collectionName) {
        const instanceLink = {
            moduleId: moduleRef.id,
            wrapperRef: wrapper,
            collection: moduleRef[collectionName],
            token,
        };
        const existingLinks = this.instanceLinks.get(token);
        if (!existingLinks) {
            this.instanceLinks.set(token, [instanceLink]);
        }
        else {
            existingLinks.push(instanceLink);
        }
    }
    getInstanceNameByToken(token) {
        return (0, shared_utils_1.isFunction)(token) ? token === null || token === void 0 ? void 0 : token.name : token;
    }
}
exports.InstanceLinksHost = InstanceLinksHost;
