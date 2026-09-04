import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:openapi/api.dart' show AssetTypeEnum;

import '../factories/activity_factory.dart';

void main() {
  group('getGroupMediaType', () {
    test('returns photo when every asset is an image', () {
      final activities = [
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.IMAGE),
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.IMAGE),
      ];

      expect(getGroupMediaType(activities), 'photo');
    });

    test('returns video when every asset is a video', () {
      final activities = [
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.VIDEO),
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.VIDEO),
      ];

      expect(getGroupMediaType(activities), 'video');
    });

    test('returns other for mixed images and videos', () {
      final activities = [
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.IMAGE),
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.VIDEO),
      ];

      expect(getGroupMediaType(activities), 'other');
    });

    test('returns other when an asset type is missing', () {
      final activities = [
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.IMAGE),
        ActivityFactory.createAssetAdded(assetType: null),
      ];

      expect(getGroupMediaType(activities), 'other');
    });

    test('returns other for asset types that are not image or video', () {
      final activities = [
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.AUDIO),
        ActivityFactory.createAssetAdded(assetType: AssetTypeEnum.AUDIO),
      ];

      expect(getGroupMediaType(activities), 'other');
    });
  });

  group('groupActivities', () {
    test('returns an empty list for no activities', () {
      expect(groupActivities([]), isEmpty);
    });

    test('passes comments and likes through in order', () {
      final comment = ActivityFactory.create(type: ActivityType.comment, comment: 'hello');
      final like = ActivityFactory.create(type: ActivityType.like);

      expect(groupActivities([comment, like]), [
        [comment],
        [like],
      ]);
    });

    test('merges consecutive additions with the same groupId', () {
      final group1Asset1 = ActivityFactory.createAssetAdded(groupId: 'group-1');
      final group1Asset2 = ActivityFactory.createAssetAdded(groupId: 'group-1');
      final group1Asset3 = ActivityFactory.createAssetAdded(groupId: 'group-1');

      expect(groupActivities([group1Asset1, group1Asset2, group1Asset3]), [
        [group1Asset1, group1Asset2, group1Asset3],
      ]);
    });

    test('splits additions with different groupIds', () {
      final group1Asset1 = ActivityFactory.createAssetAdded(groupId: 'group-1');
      final group1Asset2 = ActivityFactory.createAssetAdded(groupId: 'group-1');
      final group2Asset = ActivityFactory.createAssetAdded(groupId: 'group-2');

      expect(groupActivities([group1Asset1, group1Asset2, group2Asset]), [
        [group1Asset1, group1Asset2],
        [group2Asset],
      ]);
    });

    test('never merges additions without a groupId', () {
      final asset1 = ActivityFactory.createAssetAdded(groupId: null);
      final asset2 = ActivityFactory.createAssetAdded(groupId: null);

      expect(groupActivities([asset1, asset2]), [
        [asset1],
        [asset2],
      ]);
    });

    test('wraps a single asset addition in a group of one', () {
      final activity = ActivityFactory.createAssetAdded(groupId: 'group-1');

      expect(groupActivities([activity]), [
        [activity],
      ]);
    });

    test('lets comments and likes split a group', () {
      final comment = ActivityFactory.create(type: ActivityType.comment, comment: 'first');
      final like = ActivityFactory.create(type: ActivityType.like);
      final group1Asset1 = ActivityFactory.createAssetAdded(groupId: 'group-1');
      final group1Asset2 = ActivityFactory.createAssetAdded(groupId: 'group-1');
      final group1Asset3 = ActivityFactory.createAssetAdded(groupId: 'group-1');
      final group2Asset = ActivityFactory.createAssetAdded(groupId: 'group-2');

      expect(groupActivities([comment, group1Asset1, group1Asset2, like, group2Asset, group1Asset3]), [
        [comment],
        [group1Asset1, group1Asset2],
        [like],
        [group2Asset],
        [group1Asset3],
      ]);
    });
  });
}
