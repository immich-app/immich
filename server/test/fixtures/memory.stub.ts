import { MemoryType } from 'src/enum';
import { assetStub } from 'test/fixtures/asset.stub';
import { userStub } from 'test/fixtures/user.stub';

export const memoryStub = {
  empty: {
    id: 'memoryEmpty',
    createdAt: new Date(),
    updatedAt: new Date(),
    memoryAt: new Date(2024),
    ownerId: userStub.admin.id,
    owner: userStub.admin,
    type: MemoryType.ON_THIS_DAY,
    data: { year: 2024 },
    isSaved: false,
    assets: [],
    deletedAt: null,
    seenAt: null,
  } as unknown as any,
  memory1: {
    id: 'memory1',
    createdAt: new Date(),
    updatedAt: new Date(),
    memoryAt: new Date(2024),
    ownerId: userStub.admin.id,
    owner: userStub.admin,
    type: MemoryType.ON_THIS_DAY,
    data: { year: 2024 },
    isSaved: false,
    assets: [assetStub.image1],
    deletedAt: null,
    seenAt: null,
  } as unknown as any,
};
