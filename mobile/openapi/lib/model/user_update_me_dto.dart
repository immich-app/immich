// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserUpdateMeDto {
  const UserUpdateMeDto({
    this.avatarColor = const Optional.absent(),
    this.email = const Optional.absent(),
    this.name = const Optional.absent(),
    this.password = const Optional.absent(),
  });

  final Optional<UserAvatarColor?> avatarColor;

  /// User email
  final Optional<String> email;

  /// User name
  final Optional<String> name;

  /// User password (deprecated, use change password endpoint)
  @Deprecated(r'Deprecated by the Immich server API.')
  final Optional<String> password;

  static UserUpdateMeDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UserUpdateMeDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      avatarColor: json.containsKey(r'avatarColor')
          ? Optional.present(UserAvatarColor.fromJson(json[r'avatarColor']))
          : const Optional.absent(),
      email: json.containsKey(r'email') ? Optional.present(json[r'email'] as String) : const Optional.absent(),
      name: json.containsKey(r'name') ? Optional.present(json[r'name'] as String) : const Optional.absent(),
      password: json.containsKey(r'password') ? Optional.present(json[r'password'] as String) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (avatarColor case Present(:final value)) {
      json[r'avatarColor'] = value?.toJson();
    }
    if (email case Present(:final value)) {
      json[r'email'] = value;
    }
    if (name case Present(:final value)) {
      json[r'name'] = value;
    }
    if (password case Present(:final value)) {
      json[r'password'] = value;
    }
    return json;
  }

  UserUpdateMeDto copyWith({
    Optional<UserAvatarColor?>? avatarColor,
    Optional<String>? email,
    Optional<String>? name,
    Optional<String>? password,
  }) {
    return .new(
      avatarColor: avatarColor ?? this.avatarColor,
      email: email ?? this.email,
      name: name ?? this.name,
      password: password ?? this.password,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UserUpdateMeDto &&
            avatarColor == other.avatarColor &&
            email == other.email &&
            name == other.name &&
            password == other.password);
  }

  @override
  int get hashCode {
    return Object.hashAll([avatarColor, email, name, password]);
  }

  @override
  String toString() => 'UserUpdateMeDto(avatarColor=$avatarColor, email=$email, name=$name, password=$password)';
}
