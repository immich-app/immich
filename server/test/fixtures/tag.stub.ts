import { TagResponseDto } from 'src/dtos/tag.dto';
import { TagEntity } from 'src/entities/tag.entity';
import { userStub } from 'test/fixtures/user.stub';

export const tagStub = {
  tag1: Object.freeze<TagEntity>({
    id: 'tag-1',
    createdAt: new Date('2021-01-01T00:00:00Z'),
    updatedAt: new Date('2021-01-01T00:00:00Z'),
    value: 'Tag1',
    color: null,
    userId: userStub.admin.id,
    user: userStub.admin,
  }),
  color1: Object.freeze<TagEntity>({
    id: 'tag-1',
    createdAt: new Date('2021-01-01T00:00:00Z'),
    updatedAt: new Date('2021-01-01T00:00:00Z'),
    value: 'Tag1',
    color: '#000000',
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
  color1: Object.freeze<TagResponseDto>({
    id: 'tag-1',
    createdAt: new Date('2021-01-01T00:00:00Z'),
    updatedAt: new Date('2021-01-01T00:00:00Z'),
    color: '#000000',
    name: 'Tag1',
    value: 'Tag1',
  }),
};
