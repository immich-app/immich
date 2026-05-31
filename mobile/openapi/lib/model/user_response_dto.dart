// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserResponseDto {
  const UserResponseDto({
    required this.avatarColor,
    required this.email,
    required this.id,
    required this.name,
    required this.profileChangedAt,
    required this.profileImagePath,
  });

  final UserAvatarColor avatarColor;

  /// User email
  final String email;

  /// User ID
  final String id;

  /// User name
  final String name;

  /// Profile change date
  final DateTime profileChangedAt;

  /// Profile image path
  final String profileImagePath;

  static UserResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UserResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      avatarColor: (UserAvatarColor.fromJson(json[r'avatarColor']))!,
      email: json[r'email'] as String,
      id: json[r'id'] as String,
      name: json[r'name'] as String,
      profileChangedAt: DateTime.parse(json[r'profileChangedAt'] as String),
      profileImagePath: json[r'profileImagePath'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'avatarColor'] = avatarColor.toJson();
    json[r'email'] = email;
    json[r'id'] = id;
    json[r'name'] = name;
    json[r'profileChangedAt'] = profileChangedAt.toUtc().toIso8601String();
    json[r'profileImagePath'] = profileImagePath;
    return json;
  }

  UserResponseDto copyWith({
    UserAvatarColor? avatarColor,
    String? email,
    String? id,
    String? name,
    DateTime? profileChangedAt,
    String? profileImagePath,
  }) {
    return .new(
      avatarColor: avatarColor ?? this.avatarColor,
      email: email ?? this.email,
      id: id ?? this.id,
      name: name ?? this.name,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      profileImagePath: profileImagePath ?? this.profileImagePath,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UserResponseDto &&
            avatarColor == other.avatarColor &&
            email == other.email &&
            id == other.id &&
            name == other.name &&
            profileChangedAt == other.profileChangedAt &&
            profileImagePath == other.profileImagePath);
  }

  @override
  int get hashCode {
    return Object.hashAll([avatarColor, email, id, name, profileChangedAt, profileImagePath]);
  }

  @override
  String toString() =>
      'UserResponseDto(avatarColor=$avatarColor, email=$email, id=$id, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath)';
}
