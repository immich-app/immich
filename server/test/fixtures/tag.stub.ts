import { TagResponseDto } from 'src/domain/tag/tag-response.dto';
import { TagEntity, TagType } from 'src/infra/entities/tag.entity';
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
