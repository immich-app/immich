// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Partner response
final class PartnerResponseDto {
  const PartnerResponseDto({
    required this.avatarColor,
    required this.email,
    required this.id,
    this.inTimeline,
    required this.name,
    required this.profileChangedAt,
    required this.profileImagePath,
  });

  final UserAvatarColor avatarColor;

  /// User email
  final String email;

  /// User ID
  final String id;

  /// Show in timeline
  final bool? inTimeline;

  /// User name
  final String name;

  /// Profile change date
  final DateTime profileChangedAt;

  /// Profile image path
  final String profileImagePath;

  static const _undefined = Object();

  static PartnerResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PartnerResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      avatarColor: (UserAvatarColor.fromJson(json[r'avatarColor']))!,
      email: json[r'email'] as String,
      id: json[r'id'] as String,
      inTimeline: (json[r'inTimeline'] as bool?),
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
    if (inTimeline != null) {
      json[r'inTimeline'] = inTimeline!;
    }
    json[r'name'] = name;
    json[r'profileChangedAt'] = profileChangedAt.toUtc().toIso8601String();
    json[r'profileImagePath'] = profileImagePath;
    return json;
  }

  PartnerResponseDto copyWith({
    UserAvatarColor? avatarColor,
    String? email,
    String? id,
    Object? inTimeline = _undefined,
    String? name,
    DateTime? profileChangedAt,
    String? profileImagePath,
  }) {
    return .new(
      avatarColor: avatarColor ?? this.avatarColor,
      email: email ?? this.email,
      id: id ?? this.id,
      inTimeline: identical(inTimeline, _undefined) ? this.inTimeline : inTimeline as bool?,
      name: name ?? this.name,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      profileImagePath: profileImagePath ?? this.profileImagePath,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PartnerResponseDto &&
            avatarColor == other.avatarColor &&
            email == other.email &&
            id == other.id &&
            inTimeline == other.inTimeline &&
            name == other.name &&
            profileChangedAt == other.profileChangedAt &&
            profileImagePath == other.profileImagePath);
  }

  @override
  int get hashCode {
    return Object.hashAll([avatarColor, email, id, inTimeline, name, profileChangedAt, profileImagePath]);
  }

  @override
  String toString() =>
      'PartnerResponseDto(avatarColor=$avatarColor, email=$email, id=$id, inTimeline=$inTimeline, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath)';
}
