import { DeviceInfoEntity, DeviceType } from '@app/database';
import { Repository } from 'typeorm';
import { DeviceInfoService } from './device-info.service';

const deviceId = 'device-123';
const userId = 'user-123';

describe('DeviceInfoService', () => {
  let sut: DeviceInfoService;
  let repositoryMock: jest.Mocked<Repository<DeviceInfoEntity>>;

  beforeEach(async () => {
    repositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<DeviceInfoEntity>>;

    sut = new DeviceInfoService(repositoryMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('upsert', () => {
    it('should create a new record', async () => {
      const request = { deviceId, userId, deviceType: DeviceType.IOS } as DeviceInfoEntity;
      const response = { ...request, id: 1 } as DeviceInfoEntity;

      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.save.mockResolvedValue(response);

      await expect(sut.upsert(request)).resolves.toEqual(response);

      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should update an existing record', async () => {
      const request = { deviceId, userId, deviceType: DeviceType.IOS, isAutoBackup: true } as DeviceInfoEntity;
      const response = { ...request, id: 1 } as DeviceInfoEntity;

      repositoryMock.findOne.mockResolvedValue(response);
      repositoryMock.save.mockResolvedValue(response);

      await expect(sut.upsert(request)).resolves.toEqual(response);

      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should keep properties that were not updated', async () => {
      const request = { deviceId, userId } as DeviceInfoEntity;
      const response = { id: 1, isAutoBackup: true, deviceId, userId, deviceType: DeviceType.WEB } as DeviceInfoEntity;

      repositoryMock.findOne.mockResolvedValue(response);
      repositoryMock.save.mockResolvedValue(response);

      await expect(sut.upsert(request)).resolves.toEqual(response);

      expect(repositoryMock.findOne).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });
});
