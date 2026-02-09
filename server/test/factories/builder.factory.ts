import { FactoryBuilder } from 'test/factories/types';

export const build = <T, K extends T>(factory: unknown, builder?: FactoryBuilder<T, K>) => {
  return builder ? builder(factory as T) : (factory as T);
};
