// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class CreateProfileImageResponseDto {
  const CreateProfileImageResponseDto({
    required this.profileChangedAt,
    required this.profileImagePath,
    required this.userId,
  });

  /// Profile image change date
  final DateTime profileChangedAt;

  /// Profile image file path
  final String profileImagePath;

  /// User ID
  final String userId;

  static CreateProfileImageResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<CreateProfileImageResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      profileChangedAt: DateTime.parse(json[r'profileChangedAt'] as String),
      profileImagePath: json[r'profileImagePath'] as String,
      userId: json[r'userId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'profileChangedAt'] = profileChangedAt.toUtc().toIso8601String();
    json[r'profileImagePath'] = profileImagePath;
    json[r'userId'] = userId;
    return json;
  }

  CreateProfileImageResponseDto copyWith({DateTime? profileChangedAt, String? profileImagePath, String? userId}) {
    return .new(
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      userId: userId ?? this.userId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is CreateProfileImageResponseDto &&
            profileChangedAt == other.profileChangedAt &&
            profileImagePath == other.profileImagePath &&
            userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([profileChangedAt, profileImagePath, userId]);
  }

  @override
  String toString() =>
      'CreateProfileImageResponseDto(profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath, userId=$userId)';
}
