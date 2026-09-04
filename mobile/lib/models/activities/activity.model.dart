import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:openapi/api.dart' show AssetTypeEnum;

part 'activity.model.freezed.dart';

enum ActivityType { comment, like, assetAdded }

@freezed
abstract class Activity with _$Activity {
  const factory Activity({
    required String id,
    String? assetId,
    String? comment,
    required DateTime createdAt,
    required ActivityType type,
    required UserDto user,
    AssetTypeEnum? assetType,
    String? groupId,
  }) = _Activity;
}

class ActivityStats {
  final int comments;

  const ActivityStats({required this.comments});
}

// keep in sync with getGroupMediaType in web/src/lib/utils/activity.ts
String getGroupMediaType(List<Activity> activities) {
  if (activities.every((activity) => activity.assetType == AssetTypeEnum.IMAGE)) {
    return 'photo';
  }
  if (activities.every((activity) => activity.assetType == AssetTypeEnum.VIDEO)) {
    return 'video';
  }
  return 'other';
}

// groups consecutive asset-added activities that share the same groupId;
// keep in sync with groupActivities in web/src/lib/utils/activity.ts
List<List<Activity>> groupActivities(List<Activity> activities) {
  final List<List<Activity>> items = [];
  List<Activity>? currentGroup;
  String? currentGroupId;

  for (final activity in activities) {
    if (activity.type == ActivityType.assetAdded) {
      final groupId = activity.groupId ?? activity.id;
      if (currentGroup != null && currentGroupId == groupId) {
        currentGroup.add(activity);
      } else {
        currentGroup = [activity];
        currentGroupId = groupId;
        items.add(currentGroup);
      }
    } else {
      currentGroup = null;
      currentGroupId = null;
      items.add([activity]);
    }
  }

  return items;
}
