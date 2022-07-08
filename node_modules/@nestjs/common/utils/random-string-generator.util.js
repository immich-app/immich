"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomStringGenerator = void 0;
const uuid_1 = require("uuid");
const randomStringGenerator = () => (0, uuid_1.v4)();
exports.randomStringGenerator = randomStringGenerator;
