import { BadRequestException } from '@nestjs/common';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { PartnerService } from 'src/services/partner.service';
import { authStub } from 'test/fixtures/auth.stub';
import { partnerStub } from 'test/fixtures/partner.stub';
import { newTestService, ServiceMocks } from 'test/utils';

describe(PartnerService.name, () => {
  let sut: PartnerService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(PartnerService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('search', () => {
    it("should return a list of partners with whom I've shared my library", async () => {
      mocks.partner.getAll.mockResolvedValue([partnerStub.adminToUser1, partnerStub.user1ToAdmin1]);
      await expect(sut.search(authStub.user1, { direction: PartnerDirection.SharedBy })).resolves.toBeDefined();
      expect(mocks.partner.getAll).toHaveBeenCalledWith(authStub.user1.user.id);
    });

    it('should return a list of partners who have shared their libraries with me', async () => {
      mocks.partner.getAll.mockResolvedValue([partnerStub.adminToUser1, partnerStub.user1ToAdmin1]);
      await expect(sut.search(authStub.user1, { direction: PartnerDirection.SharedWith })).resolves.toBeDefined();
      expect(mocks.partner.getAll).toHaveBeenCalledWith(authStub.user1.user.id);
    });
  });

  describe('create', () => {
    it('should create a new partner', async () => {
      mocks.partner.get.mockResolvedValue(void 0);
      mocks.partner.create.mockResolvedValue(partnerStub.adminToUser1);

      await expect(sut.create(authStub.admin, authStub.user1.user.id)).resolves.toBeDefined();

      expect(mocks.partner.create).toHaveBeenCalledWith({
        sharedById: authStub.admin.user.id,
        sharedWithId: authStub.user1.user.id,
      });
    });

    it('should throw an error when the partner already exists', async () => {
      mocks.partner.get.mockResolvedValue(partnerStub.adminToUser1);

      await expect(sut.create(authStub.admin, authStub.user1.user.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.partner.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a partner', async () => {
      mocks.partner.get.mockResolvedValue(partnerStub.adminToUser1);

      await sut.remove(authStub.admin, authStub.user1.user.id);

      expect(mocks.partner.remove).toHaveBeenCalledWith(partnerStub.adminToUser1);
    });

    it('should throw an error when the partner does not exist', async () => {
      mocks.partner.get.mockResolvedValue(void 0);

      await expect(sut.remove(authStub.admin, authStub.user1.user.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.partner.remove).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should require access', async () => {
      await expect(sut.update(authStub.admin, 'shared-by-id', { inTimeline: false })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should update partner', async () => {
      mocks.access.partner.checkUpdateAccess.mockResolvedValue(new Set(['shared-by-id']));
      mocks.partner.update.mockResolvedValue(partnerStub.adminToUser1);

      await expect(sut.update(authStub.admin, 'shared-by-id', { inTimeline: true })).resolves.toBeDefined();
      expect(mocks.partner.update).toHaveBeenCalledWith(
        { sharedById: 'shared-by-id', sharedWithId: authStub.admin.user.id },
        { inTimeline: true },
      );
    });
  });
});
