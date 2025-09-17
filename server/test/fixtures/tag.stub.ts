import { Tag } from 'src/database';
import { TagResponseDto } from 'src/dtos/tag.dto';
import { newUuidV7 } from 'test/small.factory';

const parent = Object.freeze<Tag>({
  id: 'tag-parent',
  createdAt: new Date('2021-01-01T00:00:00Z'),
  updatedAt: new Date('2021-01-01T00:00:00Z'),
  value: 'Parent',
  color: null,
  parentId: null,
});

const child = Object.freeze<Tag>({
  id: 'tag-child',
  createdAt: new Date('2021-01-01T00:00:00Z'),
  updatedAt: new Date('2021-01-01T00:00:00Z'),
  value: 'Parent/Child',
  color: null,
  parentId: parent.id,
});

const tag = {
  id: 'tag-1',
  createdAt: new Date('2021-01-01T00:00:00Z'),
  updatedAt: new Date('2021-01-01T00:00:00Z'),
  value: 'Tag1',
  color: null,
  parentId: null,
};

const color = {
  id: 'tag-1',
  createdAt: new Date('2021-01-01T00:00:00Z'),
  updatedAt: new Date('2021-01-01T00:00:00Z'),
  value: 'Tag1',
  color: '#000000',
  parentId: null,
};

const upsert = {
  userId: 'tag-user',
  updateId: newUuidV7(),
};

export const tagStub = {
  tag,
  tagCreate: { ...tag, ...upsert },
  color,
  colorCreate: { ...color, ...upsert },
  parentUpsert: { ...parent, ...upsert },
  childUpsert: { ...child, ...upsert },
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
