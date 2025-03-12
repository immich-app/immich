import 'package:immich_mobile/domain/models/user.model.dart';

enum ActivityType { comment, like }

class Activity {
  final String id;
  final String? assetId;
  final String? comment;
  final DateTime createdAt;
  final ActivityType type;
  final UserDto user;

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
    UserDto? user,
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

class ActivityStats {
  final int comments;

  const ActivityStats({required this.comments});
}
