import { ISystemConfigRepository } from '@app/domain';

const singleton = {
  load: jest.fn().mockResolvedValue([]),
  readFile: jest.fn(),
  saveAll: jest.fn().mockResolvedValue([]),
  deleteKeys: jest.fn(),
};

export const newSystemConfigRepositoryMock = (): jest.Mocked<ISystemConfigRepository> => {
  singleton.deleteKeys.mockReset();
  singleton.load.mockReset();
  singleton.readFile.mockReset();
  singleton.saveAll.mockReset();

  singleton.load.mockResolvedValue([]);
  singleton.saveAll.mockResolvedValue([]);

  return singleton;
};
