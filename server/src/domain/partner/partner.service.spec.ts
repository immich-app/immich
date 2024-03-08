import { UserAvatarColor } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';
import { authStub, newPartnerRepositoryMock, partnerStub } from '@test';
import { IAccessRepository, IPartnerRepository, PartnerDirection } from '../repositories';
import { PartnerResponseDto } from './partner.dto';
import { PartnerService } from './partner.service';

const responseDto = {
  admin: <PartnerResponseDto>{
    email: 'admin@test.com',
    name: 'admin_name',
    id: 'admin_id',
    isAdmin: true,
    oauthId: '',
    profileImagePath: '',
    shouldChangePassword: false,
    storageLabel: 'admin',
    createdAt: new Date('2021-01-01'),
    deletedAt: null,
    updatedAt: new Date('2021-01-01'),
    memoriesEnabled: true,
    avatarColor: UserAvatarColor.PRIMARY,
    quotaSizeInBytes: null,
    inTimeline: true,
    quotaUsageInBytes: 0,
  },
  user1: <PartnerResponseDto>{
    email: 'immich@test.com',
    name: 'immich_name',
    id: 'user-id',
    isAdmin: false,
    oauthId: '',
    profileImagePath: '',
    shouldChangePassword: false,
    storageLabel: null,
    createdAt: new Date('2021-01-01'),
    deletedAt: null,
    updatedAt: new Date('2021-01-01'),
    memoriesEnabled: true,
    avatarColor: UserAvatarColor.PRIMARY,
    inTimeline: true,
    quotaSizeInBytes: null,
    quotaUsageInBytes: 0,
  },
};

describe(PartnerService.name, () => {
  let sut: PartnerService;
  let partnerMock: jest.Mocked<IPartnerRepository>;
  let accessMock: jest.Mocked<IAccessRepository>;

  beforeEach(() => {
    partnerMock = newPartnerRepositoryMock();
    sut = new PartnerService(partnerMock, accessMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it("should return a list of partners with whom I've shared my library", async () => {
      partnerMock.getAll.mockResolvedValue([partnerStub.adminToUser1, partnerStub.user1ToAdmin1]);
      await expect(sut.getAll(authStub.user1, PartnerDirection.SharedBy)).resolves.toEqual([responseDto.admin]);
      expect(partnerMock.getAll).toHaveBeenCalledWith(authStub.user1.user.id);
    });

    it('should return a list of partners who have shared their libraries with me', async () => {
      partnerMock.getAll.mockResolvedValue([partnerStub.adminToUser1, partnerStub.user1ToAdmin1]);
      await expect(sut.getAll(authStub.user1, PartnerDirection.SharedWith)).resolves.toEqual([responseDto.admin]);
      expect(partnerMock.getAll).toHaveBeenCalledWith(authStub.user1.user.id);
    });
  });

  describe('create', () => {
    it('should create a new partner', async () => {
      partnerMock.get.mockResolvedValue(null);
      partnerMock.create.mockResolvedValue(partnerStub.adminToUser1);

      await expect(sut.create(authStub.admin, authStub.user1.user.id)).resolves.toEqual(responseDto.user1);

      expect(partnerMock.create).toHaveBeenCalledWith({
        sharedById: authStub.admin.user.id,
        sharedWithId: authStub.user1.user.id,
      });
    });

    it('should throw an error when the partner already exists', async () => {
      partnerMock.get.mockResolvedValue(partnerStub.adminToUser1);

      await expect(sut.create(authStub.admin, authStub.user1.user.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(partnerMock.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a partner', async () => {
      partnerMock.get.mockResolvedValue(partnerStub.adminToUser1);

      await sut.remove(authStub.admin, authStub.user1.user.id);

      expect(partnerMock.remove).toHaveBeenCalledWith(partnerStub.adminToUser1);
    });

    it('should throw an error when the partner does not exist', async () => {
      partnerMock.get.mockResolvedValue(null);

      await expect(sut.remove(authStub.admin, authStub.user1.user.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(partnerMock.remove).not.toHaveBeenCalled();
    });
  });
});
