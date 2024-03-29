import { PartnerEntity } from 'src/entities/partner.entity';
import { userStub } from 'test/fixtures/user.stub';

export const partnerStub = {
  adminToUser1: Object.freeze<PartnerEntity>({
    createdAt: new Date('2023-02-23T05:06:29.716Z'),
    updatedAt: new Date('2023-02-23T05:06:29.716Z'),
    sharedById: userStub.admin.id,
    sharedBy: userStub.admin,
    sharedWith: userStub.user1,
    sharedWithId: userStub.user1.id,
    inTimeline: true,
  }),
  user1ToAdmin1: Object.freeze<PartnerEntity>({
    createdAt: new Date('2023-02-23T05:06:29.716Z'),
    updatedAt: new Date('2023-02-23T05:06:29.716Z'),
    sharedBy: userStub.user1,
    sharedById: userStub.user1.id,
    sharedWithId: userStub.admin.id,
    sharedWith: userStub.admin,
    inTimeline: true,
  }),
};
