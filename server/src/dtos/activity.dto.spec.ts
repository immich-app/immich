import { ActivityCreateDto, ReactionType } from 'src/dtos/activity.dto';
import { newUuid } from 'test/small.factory';

describe('create activity DTO', () => {
  it('should reject creating an asset_added activity directly', () => {
    const result = ActivityCreateDto.schema.safeParse({ albumId: newUuid(), type: ReactionType.ASSET_ADDED });

    expect(result.success).toBe(false);
  });
});
