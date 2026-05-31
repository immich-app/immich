// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ActivityResponseDto {
  const ActivityResponseDto({
    required this.assetId,
    this.comment,
    required this.createdAt,
    required this.id,
    required this.type,
    required this.user,
  });

  /// Asset ID (if activity is for an asset)
  final String? assetId;

  /// Comment text (for comment activities)
  final String? comment;

  /// Creation date
  final DateTime createdAt;

  /// Activity ID
  final String id;

  final ReactionType type;

  final UserResponseDto user;

  static const _undefined = Object();

  static ActivityResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ActivityResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetId: (json[r'assetId'] as String?),
      comment: (json[r'comment'] as String?),
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      id: json[r'id'] as String,
      type: (ReactionType.fromJson(json[r'type']))!,
      user: (UserResponseDto.fromJson(json[r'user']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (assetId != null) {
      json[r'assetId'] = assetId!;
    }
    if (comment != null) {
      json[r'comment'] = comment!;
    }
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'id'] = id;
    json[r'type'] = type.toJson();
    json[r'user'] = user.toJson();
    return json;
  }

  ActivityResponseDto copyWith({
    Object? assetId = _undefined,
    Object? comment = _undefined,
    DateTime? createdAt,
    String? id,
    ReactionType? type,
    UserResponseDto? user,
  }) {
    return .new(
      assetId: identical(assetId, _undefined) ? this.assetId : assetId as String?,
      comment: identical(comment, _undefined) ? this.comment : comment as String?,
      createdAt: createdAt ?? this.createdAt,
      id: id ?? this.id,
      type: type ?? this.type,
      user: user ?? this.user,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ActivityResponseDto &&
            assetId == other.assetId &&
            comment == other.comment &&
            createdAt == other.createdAt &&
            id == other.id &&
            type == other.type &&
            user == other.user);
  }

  @override
  int get hashCode {
    return Object.hashAll([assetId, comment, createdAt, id, type, user]);
  }

  @override
  String toString() =>
      'ActivityResponseDto(assetId=$assetId, comment=$comment, createdAt=$createdAt, id=$id, type=$type, user=$user)';
}
