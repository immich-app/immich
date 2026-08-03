import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

part 'activity.model.freezed.dart';

enum ActivityType { comment, like }

@freezed
abstract class Activity with _$Activity {
  const factory Activity({
    required String id,
    String? assetId,
    String? comment,
    required DateTime createdAt,
    required ActivityType type,
    required UserDto user,
  }) = _Activity;
}

class ActivityStats {
  final int comments;

  const ActivityStats({required this.comments});
}
