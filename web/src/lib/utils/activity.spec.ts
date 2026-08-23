import { AssetTypeEnum, ReactionType } from '@immich/sdk';
import { getGroupMediaType, groupActivities } from '$lib/utils/activity';
import { activityFactory } from '@test-data/factories/activity-factory';

const assetAdded = (overrides: Partial<Parameters<typeof activityFactory.build>[0]> = {}) =>
  activityFactory.build({ type: ReactionType.AssetAdded, assetType: AssetTypeEnum.Image, ...overrides });

describe('getGroupMediaType', () => {
  it('returns photo when every asset is an image', () => {
    const activities = [assetAdded({ assetType: AssetTypeEnum.Image }), assetAdded({ assetType: AssetTypeEnum.Image })];

    expect(getGroupMediaType(activities)).toBe('photo');
  });

  it('returns video when every asset is a video', () => {
    const activities = [assetAdded({ assetType: AssetTypeEnum.Video }), assetAdded({ assetType: AssetTypeEnum.Video })];

    expect(getGroupMediaType(activities)).toBe('video');
  });

  it('returns other for mixed images and videos', () => {
    const activities = [assetAdded({ assetType: AssetTypeEnum.Image }), assetAdded({ assetType: AssetTypeEnum.Video })];

    expect(getGroupMediaType(activities)).toBe('other');
  });

  it('returns other when an asset type is missing', () => {
    const activities = [assetAdded({ assetType: AssetTypeEnum.Image }), assetAdded({ assetType: null })];

    expect(getGroupMediaType(activities)).toBe('other');
  });

  it('returns other for asset types that are not image or video', () => {
    const activities = [assetAdded({ assetType: AssetTypeEnum.Audio }), assetAdded({ assetType: AssetTypeEnum.Audio })];

    expect(getGroupMediaType(activities)).toBe('other');
  });
});

describe('groupActivities', () => {
  it('returns an empty list for no activities', () => {
    expect(groupActivities([])).toEqual([]);
  });

  it('passes comments and likes through in order', () => {
    const comment = activityFactory.build({ type: ReactionType.Comment, comment: 'hello' });
    const like = activityFactory.build({ type: ReactionType.Like });

    expect(groupActivities([comment, like])).toEqual([[comment], [like]]);
  });

  it('merges consecutive additions with the same groupId', () => {
    const group1Asset1 = assetAdded({ groupId: 'group-1' });
    const group1Asset2 = assetAdded({ groupId: 'group-1' });
    const group1Asset3 = assetAdded({ groupId: 'group-1' });

    expect(groupActivities([group1Asset1, group1Asset2, group1Asset3])).toEqual([
      [group1Asset1, group1Asset2, group1Asset3],
    ]);
  });

  it('splits additions with different groupIds', () => {
    const group1Asset1 = assetAdded({ groupId: 'group-1' });
    const group1Asset2 = assetAdded({ groupId: 'group-1' });
    const group2Asset = assetAdded({ groupId: 'group-2' });

    expect(groupActivities([group1Asset1, group1Asset2, group2Asset])).toEqual([
      [group1Asset1, group1Asset2],
      [group2Asset],
    ]);
  });

  it('never merges additions without a groupId', () => {
    const asset1 = assetAdded({ groupId: null });
    const asset2 = assetAdded({ groupId: null });

    expect(groupActivities([asset1, asset2])).toEqual([[asset1], [asset2]]);
  });

  it('wraps a single asset addition in a group of one', () => {
    const activity = assetAdded({ groupId: 'group-1' });

    expect(groupActivities([activity])).toEqual([[activity]]);
  });

  it('lets comments and likes split a group', () => {
    const comment = activityFactory.build({ type: ReactionType.Comment, comment: 'first' });
    const like = activityFactory.build({ type: ReactionType.Like });
    const group1Asset1 = assetAdded({ groupId: 'group-1' });
    const group1Asset2 = assetAdded({ groupId: 'group-1' });
    const group1Asset3 = assetAdded({ groupId: 'group-1' });
    const group2Asset = assetAdded({ groupId: 'group-2' });

    expect(groupActivities([comment, group1Asset1, group1Asset2, like, group2Asset, group1Asset3])).toEqual([
      [comment],
      [group1Asset1, group1Asset2],
      [like],
      [group2Asset],
      [group1Asset3],
    ]);
  });
});
