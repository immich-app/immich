import { BadRequestException } from '@nestjs/common';
import { IPartnerRepository, PartnerDirection } from 'src/interfaces/partner.interface';
import { PartnerService } from 'src/services/partner.service';
import { authStub } from 'test/fixtures/auth.stub';
import { partnerStub } from 'test/fixtures/partner.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(PartnerService.name, () => {
  let sut: PartnerService;

  let accessMock: IAccessRepositoryMock;
  let partnerMock: Mocked<IPartnerRepository>;

  beforeEach(() => {
    ({ sut, accessMock, partnerMock } = newTestService(PartnerService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('search', () => {
    it("should return a list of partners with whom I've shared my library", async () => {
      partnerMock.getAll.mockResolvedValue([partnerStub.adminToUser1, partnerStub.user1ToAdmin1]);
      await expect(sut.search(authStub.user1, { direction: PartnerDirection.SharedBy })).resolves.toBeDefined();
      expect(partnerMock.getAll).toHaveBeenCalledWith(authStub.user1.user.id);
    });

    it('should return a list of partners who have shared their libraries with me', async () => {
      partnerMock.getAll.mockResolvedValue([partnerStub.adminToUser1, partnerStub.user1ToAdmin1]);
      await expect(sut.search(authStub.user1, { direction: PartnerDirection.SharedWith })).resolves.toBeDefined();
      expect(partnerMock.getAll).toHaveBeenCalledWith(authStub.user1.user.id);
    });
  });

  describe('create', () => {
    it('should create a new partner', async () => {
      partnerMock.get.mockResolvedValue(null);
      partnerMock.create.mockResolvedValue(partnerStub.adminToUser1);

      await expect(sut.create(authStub.admin, authStub.user1.user.id)).resolves.toBeDefined();

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

  describe('update', () => {
    it('should require access', async () => {
      await expect(sut.update(authStub.admin, 'shared-by-id', { inTimeline: false })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should update partner', async () => {
      accessMock.partner.checkUpdateAccess.mockResolvedValue(new Set(['shared-by-id']));
      partnerMock.update.mockResolvedValue(partnerStub.adminToUser1);

      await expect(sut.update(authStub.admin, 'shared-by-id', { inTimeline: true })).resolves.toBeDefined();
      expect(partnerMock.update).toHaveBeenCalledWith({
        sharedById: 'shared-by-id',
        sharedWithId: authStub.admin.user.id,
        inTimeline: true,
      });
    });
  });
});
