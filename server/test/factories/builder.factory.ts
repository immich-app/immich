import { FactoryBuilder } from 'test/factories/types.js';

export const build = <T>(factory: T, builder?: FactoryBuilder<T>) => {
  return builder ? builder(factory) : factory;
};
