// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserAdminUpdateDto {
  const UserAdminUpdateDto({
    this.avatarColor = const Optional.absent(),
    this.email = const Optional.absent(),
    this.isAdmin = const Optional.absent(),
    this.name = const Optional.absent(),
    this.password = const Optional.absent(),
    this.pinCode = const Optional.absent(),
    this.quotaSizeInBytes = const Optional.absent(),
    this.shouldChangePassword = const Optional.absent(),
    this.storageLabel = const Optional.absent(),
  });

  final Optional<UserAvatarColor?> avatarColor;

  /// User email
  final Optional<String> email;

  /// Grant admin privileges
  final Optional<bool> isAdmin;

  /// User name
  final Optional<String> name;

  /// User password
  final Optional<String> password;

  /// PIN code
  final Optional<String?> pinCode;

  /// Storage quota in bytes
  final Optional<int?> quotaSizeInBytes;

  /// Require password change on next login
  final Optional<bool> shouldChangePassword;

  /// Storage label
  final Optional<String?> storageLabel;

  static UserAdminUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UserAdminUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      avatarColor: json.containsKey(r'avatarColor')
          ? Optional.present(UserAvatarColor.fromJson(json[r'avatarColor']))
          : const Optional.absent(),
      email: json.containsKey(r'email') ? Optional.present(json[r'email'] as String) : const Optional.absent(),
      isAdmin: json.containsKey(r'isAdmin') ? Optional.present(json[r'isAdmin'] as bool) : const Optional.absent(),
      name: json.containsKey(r'name') ? Optional.present(json[r'name'] as String) : const Optional.absent(),
      password: json.containsKey(r'password') ? Optional.present(json[r'password'] as String) : const Optional.absent(),
      pinCode: json.containsKey(r'pinCode') ? Optional.present((json[r'pinCode'] as String?)) : const Optional.absent(),
      quotaSizeInBytes: json.containsKey(r'quotaSizeInBytes')
          ? Optional.present((json[r'quotaSizeInBytes'] as int?))
          : const Optional.absent(),
      shouldChangePassword: json.containsKey(r'shouldChangePassword')
          ? Optional.present(json[r'shouldChangePassword'] as bool)
          : const Optional.absent(),
      storageLabel: json.containsKey(r'storageLabel')
          ? Optional.present((json[r'storageLabel'] as String?))
          : const Optional.absent(),
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
    if (isAdmin case Present(:final value)) {
      json[r'isAdmin'] = value;
    }
    if (name case Present(:final value)) {
      json[r'name'] = value;
    }
    if (password case Present(:final value)) {
      json[r'password'] = value;
    }
    if (pinCode case Present(:final value)) {
      json[r'pinCode'] = value;
    }
    if (quotaSizeInBytes case Present(:final value)) {
      json[r'quotaSizeInBytes'] = value;
    }
    if (shouldChangePassword case Present(:final value)) {
      json[r'shouldChangePassword'] = value;
    }
    if (storageLabel case Present(:final value)) {
      json[r'storageLabel'] = value;
    }
    return json;
  }

  UserAdminUpdateDto copyWith({
    Optional<UserAvatarColor?>? avatarColor,
    Optional<String>? email,
    Optional<bool>? isAdmin,
    Optional<String>? name,
    Optional<String>? password,
    Optional<String?>? pinCode,
    Optional<int?>? quotaSizeInBytes,
    Optional<bool>? shouldChangePassword,
    Optional<String?>? storageLabel,
  }) {
    return .new(
      avatarColor: avatarColor ?? this.avatarColor,
      email: email ?? this.email,
      isAdmin: isAdmin ?? this.isAdmin,
      name: name ?? this.name,
      password: password ?? this.password,
      pinCode: pinCode ?? this.pinCode,
      quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
      shouldChangePassword: shouldChangePassword ?? this.shouldChangePassword,
      storageLabel: storageLabel ?? this.storageLabel,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UserAdminUpdateDto &&
            avatarColor == other.avatarColor &&
            email == other.email &&
            isAdmin == other.isAdmin &&
            name == other.name &&
            password == other.password &&
            pinCode == other.pinCode &&
            quotaSizeInBytes == other.quotaSizeInBytes &&
            shouldChangePassword == other.shouldChangePassword &&
            storageLabel == other.storageLabel);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      avatarColor,
      email,
      isAdmin,
      name,
      password,
      pinCode,
      quotaSizeInBytes,
      shouldChangePassword,
      storageLabel,
    ]);
  }

  @override
  String toString() =>
      'UserAdminUpdateDto(avatarColor=$avatarColor, email=$email, isAdmin=$isAdmin, name=$name, password=$password, pinCode=$pinCode, quotaSizeInBytes=$quotaSizeInBytes, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel)';
}
