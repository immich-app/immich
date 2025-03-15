import { BadRequestException } from '@nestjs/common';
import { PartnerDirection } from 'src/repositories/partner.repository';
import { PartnerService } from 'src/services/partner.service';
import { factory } from 'test/small.factory';
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
      const user1 = factory.user();
      const user2 = factory.user();
      const sharedWithUser2 = factory.partner({ sharedBy: user1, sharedWith: user2 });
      const sharedWithUser1 = factory.partner({ sharedBy: user2, sharedWith: user1 });
      const auth = factory.auth({ id: user1.id });

      mocks.partner.getAll.mockResolvedValue([sharedWithUser1, sharedWithUser2]);

      await expect(sut.search(auth, { direction: PartnerDirection.SharedBy })).resolves.toBeDefined();
      expect(mocks.partner.getAll).toHaveBeenCalledWith(user1.id);
    });

    it('should return a list of partners who have shared their libraries with me', async () => {
      const user1 = factory.user();
      const user2 = factory.user();
      const sharedWithUser2 = factory.partner({ sharedBy: user1, sharedWith: user2 });
      const sharedWithUser1 = factory.partner({ sharedBy: user2, sharedWith: user1 });
      const auth = factory.auth({ id: user1.id });

      mocks.partner.getAll.mockResolvedValue([sharedWithUser1, sharedWithUser2]);
      await expect(sut.search(auth, { direction: PartnerDirection.SharedWith })).resolves.toBeDefined();
      expect(mocks.partner.getAll).toHaveBeenCalledWith(user1.id);
    });
  });

  describe('create', () => {
    it('should create a new partner', async () => {
      const user1 = factory.user();
      const user2 = factory.user();
      const partner = factory.partner({ sharedBy: user1, sharedWith: user2 });
      const auth = factory.auth({ id: user1.id });

      mocks.partner.get.mockResolvedValue(void 0);
      mocks.partner.create.mockResolvedValue(partner);

      await expect(sut.create(auth, user2.id)).resolves.toBeDefined();

      expect(mocks.partner.create).toHaveBeenCalledWith({
        sharedById: partner.sharedById,
        sharedWithId: partner.sharedWithId,
      });
    });

    it('should throw an error when the partner already exists', async () => {
      const user1 = factory.user();
      const user2 = factory.user();
      const partner = factory.partner({ sharedBy: user1, sharedWith: user2 });
      const auth = factory.auth({ id: user1.id });

      mocks.partner.get.mockResolvedValue(partner);

      await expect(sut.create(auth, user2.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.partner.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a partner', async () => {
      const user1 = factory.user();
      const user2 = factory.user();
      const partner = factory.partner({ sharedBy: user1, sharedWith: user2 });
      const auth = factory.auth({ id: user1.id });

      mocks.partner.get.mockResolvedValue(partner);

      await sut.remove(auth, user2.id);

      expect(mocks.partner.remove).toHaveBeenCalledWith({ sharedById: user1.id, sharedWithId: user2.id });
    });

    it('should throw an error when the partner does not exist', async () => {
      const user2 = factory.user();
      const auth = factory.auth();

      mocks.partner.get.mockResolvedValue(void 0);

      await expect(sut.remove(auth, user2.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.partner.remove).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should require access', async () => {
      const user2 = factory.user();
      const auth = factory.auth();

      await expect(sut.update(auth, user2.id, { inTimeline: false })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should update partner', async () => {
      const user1 = factory.user();
      const user2 = factory.user();
      const partner = factory.partner({ sharedBy: user1, sharedWith: user2 });
      const auth = factory.auth({ id: user1.id });

      mocks.access.partner.checkUpdateAccess.mockResolvedValue(new Set([user2.id]));
      mocks.partner.update.mockResolvedValue(partner);

      await expect(sut.update(auth, user2.id, { inTimeline: true })).resolves.toBeDefined();
      expect(mocks.partner.update).toHaveBeenCalledWith(
        { sharedById: user2.id, sharedWithId: user1.id },
        { inTimeline: true },
      );
    });
  });
});
