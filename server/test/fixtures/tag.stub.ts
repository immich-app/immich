import { TagResponseDto } from '@app/domain';
import { TagEntity, TagType } from '@app/infra/entities';
import { userStub } from './user.stub';

export const tagStub = {
  tag1: Object.freeze<TagEntity>({
    id: 'tag-1',
    name: 'Tag1',
    type: TagType.CUSTOM,
    userId: userStub.admin.id,
    user: userStub.admin,
    renameTagId: null,
    assets: [],
  }),
};

export const tagResponseStub = {
  tag1: Object.freeze<TagResponseDto>({
    id: 'tag-1',
    name: 'Tag1',
    type: 'CUSTOM',
    userId: 'admin_id',
  }),
};
