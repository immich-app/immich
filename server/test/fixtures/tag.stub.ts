import { TagResponseDto } from 'src/dtos/tag.dto';
import { TagEntity, TagType } from 'src/entities/tag.entity';
import { userStub } from 'test/fixtures/user.stub';

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
