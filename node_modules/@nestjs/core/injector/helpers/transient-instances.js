"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNonTransientInstances = exports.getTransientInstances = void 0;
const iterare_1 = require("iterare");
/**
 * Returns the instances which are transient
 * @param instances The instances which should be checked whether they are transcient
 */
function getTransientInstances(instances) {
    return (0, iterare_1.iterate)(instances)
        .filter(([_, wrapper]) => wrapper.isDependencyTreeStatic())
        .map(([_, wrapper]) => wrapper.getStaticTransientInstances())
        .flatten()
        .filter(item => !!item)
        .map(({ instance }) => instance)
        .toArray();
}
exports.getTransientInstances = getTransientInstances;
/**
 * Returns the instances which are not transient
 * @param instances The instances which should be checked whether they are transcient
 */
function getNonTransientInstances(instances) {
    return (0, iterare_1.iterate)(instances)
        .filter(([key, wrapper]) => wrapper.isDependencyTreeStatic() && !wrapper.isTransient)
        .map(([key, { instance }]) => instance)
        .toArray();
}
exports.getNonTransientInstances = getNonTransientInstances;
