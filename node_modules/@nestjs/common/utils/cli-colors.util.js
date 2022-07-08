"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yellow = exports.clc = void 0;
const isColorAllowed = () => !process.env.NO_COLOR;
const colorIfAllowed = (colorFn) => (text) => isColorAllowed() ? colorFn(text) : text;
exports.clc = {
    green: colorIfAllowed((text) => `\x1B[32m${text}\x1B[39m`),
    yellow: colorIfAllowed((text) => `\x1B[33m${text}\x1B[39m`),
    red: colorIfAllowed((text) => `\x1B[31m${text}\x1B[39m`),
    magentaBright: colorIfAllowed((text) => `\x1B[95m${text}\x1B[39m`),
    cyanBright: colorIfAllowed((text) => `\x1B[96m${text}\x1B[39m`),
};
exports.yellow = colorIfAllowed((text) => `\x1B[38;5;3m${text}\x1B[39m`);
