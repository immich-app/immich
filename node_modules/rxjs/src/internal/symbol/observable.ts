/** Symbol.observable or a string "@@observable". Used for interop */
export const observable: string | symbol = (() => (typeof Symbol === 'function' && Symbol.observable) || '@@observable')();
