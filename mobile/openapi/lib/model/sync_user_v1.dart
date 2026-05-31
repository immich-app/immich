// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncUserV1 {
  const SyncUserV1({
    this.avatarColor,
    required this.deletedAt,
    required this.email,
    required this.hasProfileImage,
    required this.id,
    required this.name,
    required this.profileChangedAt,
  });

  final UserAvatarColor? avatarColor;

  /// User deleted at
  final DateTime? deletedAt;

  /// User email
  final String email;

  /// User has profile image
  final bool hasProfileImage;

  /// User ID
  final String id;

  /// User name
  final String name;

  /// User profile changed at
  final DateTime profileChangedAt;

  static const _undefined = Object();

  static SyncUserV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncUserV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      avatarColor: UserAvatarColor.fromJson(json[r'avatarColor']),
      deletedAt: (json[r'deletedAt'] == null ? null : DateTime.parse(json[r'deletedAt'] as String)),
      email: json[r'email'] as String,
      hasProfileImage: json[r'hasProfileImage'] as bool,
      id: json[r'id'] as String,
      name: json[r'name'] as String,
      profileChangedAt: DateTime.parse(json[r'profileChangedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (avatarColor != null) {
      json[r'avatarColor'] = avatarColor!.toJson();
    }
    if (deletedAt != null) {
      json[r'deletedAt'] = deletedAt!.toUtc().toIso8601String();
    }
    json[r'email'] = email;
    json[r'hasProfileImage'] = hasProfileImage;
    json[r'id'] = id;
    json[r'name'] = name;
    json[r'profileChangedAt'] = profileChangedAt.toUtc().toIso8601String();
    return json;
  }

  SyncUserV1 copyWith({
    Object? avatarColor = _undefined,
    Object? deletedAt = _undefined,
    String? email,
    bool? hasProfileImage,
    String? id,
    String? name,
    DateTime? profileChangedAt,
  }) {
    return .new(
      avatarColor: identical(avatarColor, _undefined) ? this.avatarColor : avatarColor as UserAvatarColor?,
      deletedAt: identical(deletedAt, _undefined) ? this.deletedAt : deletedAt as DateTime?,
      email: email ?? this.email,
      hasProfileImage: hasProfileImage ?? this.hasProfileImage,
      id: id ?? this.id,
      name: name ?? this.name,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncUserV1 &&
            avatarColor == other.avatarColor &&
            deletedAt == other.deletedAt &&
            email == other.email &&
            hasProfileImage == other.hasProfileImage &&
            id == other.id &&
            name == other.name &&
            profileChangedAt == other.profileChangedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([avatarColor, deletedAt, email, hasProfileImage, id, name, profileChangedAt]);
  }

  @override
  String toString() =>
      'SyncUserV1(avatarColor=$avatarColor, deletedAt=$deletedAt, email=$email, hasProfileImage=$hasProfileImage, id=$id, name=$name, profileChangedAt=$profileChangedAt)';
}
