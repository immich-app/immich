import { DeviceInfoEntity, DeviceType } from '@app/infra/db/entities';
import { authStub, newDeviceInfoRepositoryMock } from '../../test';
import { IDeviceInfoRepository } from './device-info.repository';
import { DeviceInfoService } from './device-info.service';

const deviceId = 'device-123';
const userId = 'user-123';

describe('DeviceInfoService', () => {
  let sut: DeviceInfoService;
  let repositoryMock: jest.Mocked<IDeviceInfoRepository>;

  beforeEach(async () => {
    repositoryMock = newDeviceInfoRepositoryMock();

    sut = new DeviceInfoService(repositoryMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('upsert', () => {
    it('should create a new record', async () => {
      const request = { deviceId, userId, deviceType: DeviceType.IOS } as DeviceInfoEntity;
      const response = { ...request, id: 1 } as DeviceInfoEntity;

      repositoryMock.get.mockResolvedValue(null);
      repositoryMock.save.mockResolvedValue(response);

      await expect(sut.upsert(authStub.user1, request)).resolves.toEqual(response);

      expect(repositoryMock.get).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should update an existing record', async () => {
      const request = { deviceId, userId, deviceType: DeviceType.IOS, isAutoBackup: true } as DeviceInfoEntity;
      const response = { ...request, id: 1 } as DeviceInfoEntity;

      repositoryMock.get.mockResolvedValue(response);
      repositoryMock.save.mockResolvedValue(response);

      await expect(sut.upsert(authStub.user1, request)).resolves.toEqual(response);

      expect(repositoryMock.get).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should keep properties that were not updated', async () => {
      const request = { deviceId, userId } as DeviceInfoEntity;
      const response = { id: 1, isAutoBackup: true, deviceId, userId, deviceType: DeviceType.WEB } as DeviceInfoEntity;

      repositoryMock.get.mockResolvedValue(response);
      repositoryMock.save.mockResolvedValue(response);

      await expect(sut.upsert(authStub.user1, request)).resolves.toEqual(response);

      expect(repositoryMock.get).toHaveBeenCalledTimes(1);
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });
});
