import { MemoryEntity, MemoryType } from 'src/entities/memory.entity';
import { assetStub } from 'test/fixtures/asset.stub';
import { userStub } from 'test/fixtures/user.stub';

export const memoryStub = {
  empty: <MemoryEntity>{
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
  },
  memory1: <MemoryEntity>{
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
  },
};
