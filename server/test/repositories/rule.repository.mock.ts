import { IRuleRepository } from '@app/domain';

export const newRuleRepositoryMock = (): jest.Mocked<IRuleRepository> => {
  return {
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
};
