import 'package:immich_mobile/entities/user.entity.dart';
import 'package:openapi/api.dart';

enum ActivityType { comment, like }

class Activity {
  final String id;
  final String? assetId;
  final String? comment;
  final DateTime createdAt;
  final ActivityType type;
  final User user;

  const Activity({
    required this.id,
    this.assetId,
    this.comment,
    required this.createdAt,
    required this.type,
    required this.user,
  });

  Activity copyWith({
    String? id,
    String? assetId,
    String? comment,
    DateTime? createdAt,
    ActivityType? type,
    User? user,
  }) {
    return Activity(
      id: id ?? this.id,
      assetId: assetId ?? this.assetId,
      comment: comment ?? this.comment,
      createdAt: createdAt ?? this.createdAt,
      type: type ?? this.type,
      user: user ?? this.user,
    );
  }

  Activity.fromDto(ActivityResponseDto dto)
      : id = dto.id,
        assetId = dto.assetId,
        comment = dto.comment,
        createdAt = dto.createdAt,
        type = dto.type == ActivityResponseDtoTypeEnum.comment
            ? ActivityType.comment
            : ActivityType.like,
        user = User.fromSimpleUserDto(dto.user);

  @override
  String toString() {
    return 'Activity(id: $id, assetId: $assetId, comment: $comment, createdAt: $createdAt, type: $type, user: $user)';
  }

  @override
  bool operator ==(covariant Activity other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.assetId == assetId &&
        other.comment == comment &&
        other.createdAt == createdAt &&
        other.type == type &&
        other.user == user;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        assetId.hashCode ^
        comment.hashCode ^
        createdAt.hashCode ^
        type.hashCode ^
        user.hashCode;
  }
}
