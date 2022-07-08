"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forwardRef = void 0;
const forwardRef = (fn) => ({
    forwardRef: fn,
});
exports.forwardRef = forwardRef;
