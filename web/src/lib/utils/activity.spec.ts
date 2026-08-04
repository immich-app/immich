import { AssetTypeEnum, ReactionType } from '@immich/sdk';
import { getGroupMediaType, groupActivities, type AssetAddedGroup } from '$lib/utils/activity';
import { activityFactory } from '@test-data/factories/activity-factory';

const assetAdded = (overrides: Partial<Parameters<typeof activityFactory.build>[0]> = {}) =>
  activityFactory.build({ type: ReactionType.AssetAdded, assetType: AssetTypeEnum.Image, ...overrides });

describe('getGroupMediaType', () => {
  it('returns other when an asset type is missing or not an image/video', () => {
    expect(
      getGroupMediaType([
        activityFactory.build({ assetType: AssetTypeEnum.Image }),
        activityFactory.build({ assetType: null }),
      ]),
    ).toBe('other');
    expect(getGroupMediaType(activityFactory.buildList(2, { assetType: AssetTypeEnum.Audio }))).toBe('other');
  });
});

describe('groupActivities', () => {
  it('returns an empty list for no activities', () => {
    expect(groupActivities([])).toEqual([]);
  });

  it('passes comments and likes through unchanged and in order', () => {
    const comment = activityFactory.build({ type: ReactionType.Comment, comment: 'hello' });
    const like = activityFactory.build({ type: ReactionType.Like });

    expect(groupActivities([comment, like])).toEqual([comment, like]);
  });

  it('merges consecutive asset additions with the same groupId into one group', () => {
    const activities = [
      assetAdded({ groupId: 'group-1' }),
      assetAdded({ groupId: 'group-1' }),
      assetAdded({ groupId: 'group-1' }),
    ];

    const items = groupActivities(activities);

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ type: 'group', id: `group|${activities[0].id}`, assets: activities });
  });

  it('splits consecutive asset additions with different groupIds into separate groups', () => {
    const activities = [
      assetAdded({ groupId: 'group-1' }),
      assetAdded({ groupId: 'group-1' }),
      assetAdded({ groupId: 'group-2' }),
    ];

    const items = groupActivities(activities) as AssetAddedGroup[];

    expect(items).toHaveLength(2);
    expect(items[0].assets).toEqual(activities.slice(0, 2));
    expect(items[1].assets).toEqual(activities.slice(2));
  });

  it('falls back to the activity id when groupId is null', () => {
    const activities = [assetAdded({ groupId: null }), assetAdded({ groupId: null })];

    const items = groupActivities(activities) as AssetAddedGroup[];

    expect(items).toHaveLength(2);
    expect(items[0].assets).toEqual([activities[0]]);
    expect(items[1].assets).toEqual([activities[1]]);
  });

  it('wraps a single asset addition in a group', () => {
    const activity = assetAdded({ groupId: null });

    expect(groupActivities([activity])).toEqual([{ type: 'group', id: `group|${activity.id}`, assets: [activity] }]);
  });

  it('handles a mixed sequence of activities', () => {
    const comment = activityFactory.build({ type: ReactionType.Comment, comment: 'first' });
    const like = activityFactory.build({ type: ReactionType.Like });
    const added = [
      assetAdded({ groupId: 'group-1' }),
      assetAdded({ groupId: 'group-1' }),
      assetAdded({ groupId: 'group-2' }),
      assetAdded({ groupId: 'group-3' }),
    ];

    const items = groupActivities([comment, added[0], added[1], like, added[2], added[3]]);

    expect(items).toEqual([
      comment,
      { type: 'group', id: `group|${added[0].id}`, assets: [added[0], added[1]] },
      like,
      { type: 'group', id: `group|${added[2].id}`, assets: [added[2]] },
      { type: 'group', id: `group|${added[3].id}`, assets: [added[3]] },
    ]);
  });
});
