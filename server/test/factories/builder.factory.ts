import { FactoryBuilder } from 'test/factories/types';

export const build = <T>(factory: T, builder?: FactoryBuilder<T>) => {
  return builder ? builder(factory) : factory;
};
