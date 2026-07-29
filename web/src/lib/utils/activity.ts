import { AssetTypeEnum, ReactionType, type ActivityResponseDto } from '@immich/sdk';

export const getGroupMediaType = (activities: ActivityResponseDto[]): 'photo' | 'video' | 'other' => {
  if (activities.every(({ assetType }) => assetType === AssetTypeEnum.Image)) {
    return 'photo';
  }
  if (activities.every(({ assetType }) => assetType === AssetTypeEnum.Video)) {
    return 'video';
  }
  return 'other';
};

export const groupActivities = (activities: ActivityResponseDto[]): ActivityResponseDto[][] => {
  const items: ActivityResponseDto[][] = [];
  let currentGroup: ActivityResponseDto[] | null = null;
  let currentGroupId: string | null = null;

  for (const activity of activities) {
    if (activity.type === ReactionType.AssetAdded) {
      const groupId = activity.groupId ?? activity.id;
      if (currentGroup && currentGroupId === groupId) {
        currentGroup.push(activity);
      } else {
        currentGroup = [activity];
        currentGroupId = groupId;
        items.push(currentGroup);
      }
    } else {
      currentGroup = null;
      currentGroupId = null;
      items.push([activity]);
    }
  }

  return items;
};
