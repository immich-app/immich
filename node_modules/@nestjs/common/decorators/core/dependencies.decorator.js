"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependencies = exports.flatten = void 0;
const constants_1 = require("../../constants");
function flatten(arr) {
    const flat = [].concat(...arr);
    return flat.some(Array.isArray) ? flatten(flat) : flat;
}
exports.flatten = flatten;
/**
 * Decorator that sets required dependencies (required with a vanilla JavaScript objects)
 */
const Dependencies = (...dependencies) => {
    const flattenDeps = flatten(dependencies);
    return (target) => {
        Reflect.defineMetadata(constants_1.PARAMTYPES_METADATA, flattenDeps, target);
    };
};
exports.Dependencies = Dependencies;
