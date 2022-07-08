"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeWithValues = void 0;
const MergeWithValues = (data) => {
    return (Metatype) => {
        const Type = class extends Metatype {
            constructor(...args) {
                super(...args);
            }
        };
        const token = Metatype.name + JSON.stringify(data);
        Object.defineProperty(Type, 'name', { value: token });
        Object.assign(Type.prototype, data);
        return Type;
    };
};
exports.MergeWithValues = MergeWithValues;
