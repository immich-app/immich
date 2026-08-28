// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

part 'activity.model.freezed.dart';

enum ActivityType { comment, like }

@freezed
class const Activity({
  required final String id,
  final String? assetId,
  final String? comment,
  required final DateTime createdAt,
  required final ActivityType type,
  required final UserDto user,
}) with _$Activity;

class ActivityStats {
  final int comments;

  const ActivityStats({required this.comments});
}
