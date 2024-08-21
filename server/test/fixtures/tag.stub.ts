import { TagResponseDto } from 'src/dtos/tag.dto';
import { TagEntity } from 'src/entities/tag.entity';
import { userStub } from 'test/fixtures/user.stub';

export const tagStub = {
  tag1: Object.freeze<TagEntity>({
    id: 'tag-1',
    createdAt: new Date('2021-01-01T00:00:00Z'),
    updatedAt: new Date('2021-01-01T00:00:00Z'),
    value: 'Tag1',
    userId: userStub.admin.id,
    user: userStub.admin,
  }),
};

export const tagResponseStub = {
  tag1: Object.freeze<TagResponseDto>({
    id: 'tag-1',
    createdAt: new Date('2021-01-01T00:00:00Z'),
    updatedAt: new Date('2021-01-01T00:00:00Z'),
    name: 'Tag1',
    value: 'Tag1',
  }),
};
