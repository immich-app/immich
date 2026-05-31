// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserAdminCreateDto {
  const UserAdminCreateDto({
    this.avatarColor = const Optional.absent(),
    required this.email,
    this.isAdmin = const Optional.absent(),
    required this.name,
    this.notify = const Optional.absent(),
    required this.password,
    this.pinCode = const Optional.absent(),
    this.quotaSizeInBytes = const Optional.absent(),
    this.shouldChangePassword = const Optional.absent(),
    this.storageLabel = const Optional.absent(),
  });

  final Optional<UserAvatarColor?> avatarColor;

  /// User email
  final String email;

  /// Grant admin privileges
  final Optional<bool> isAdmin;

  /// User name
  final String name;

  /// Send notification email
  final Optional<bool> notify;

  /// User password
  final String password;

  /// PIN code
  final Optional<String?> pinCode;

  /// Storage quota in bytes
  final Optional<int?> quotaSizeInBytes;

  /// Require password change on next login
  final Optional<bool> shouldChangePassword;

  /// Storage label
  final Optional<String?> storageLabel;

  static UserAdminCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UserAdminCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      avatarColor: json.containsKey(r'avatarColor')
          ? Optional.present(UserAvatarColor.fromJson(json[r'avatarColor']))
          : const Optional.absent(),
      email: json[r'email'] as String,
      isAdmin: json.containsKey(r'isAdmin') ? Optional.present(json[r'isAdmin'] as bool) : const Optional.absent(),
      name: json[r'name'] as String,
      notify: json.containsKey(r'notify') ? Optional.present(json[r'notify'] as bool) : const Optional.absent(),
      password: json[r'password'] as String,
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
    json[r'email'] = email;
    if (isAdmin case Present(:final value)) {
      json[r'isAdmin'] = value;
    }
    json[r'name'] = name;
    if (notify case Present(:final value)) {
      json[r'notify'] = value;
    }
    json[r'password'] = password;
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

  UserAdminCreateDto copyWith({
    Optional<UserAvatarColor?>? avatarColor,
    String? email,
    Optional<bool>? isAdmin,
    String? name,
    Optional<bool>? notify,
    String? password,
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
      notify: notify ?? this.notify,
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
        (other is UserAdminCreateDto &&
            avatarColor == other.avatarColor &&
            email == other.email &&
            isAdmin == other.isAdmin &&
            name == other.name &&
            notify == other.notify &&
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
      notify,
      password,
      pinCode,
      quotaSizeInBytes,
      shouldChangePassword,
      storageLabel,
    ]);
  }

  @override
  String toString() =>
      'UserAdminCreateDto(avatarColor=$avatarColor, email=$email, isAdmin=$isAdmin, name=$name, notify=$notify, password=$password, pinCode=$pinCode, quotaSizeInBytes=$quotaSizeInBytes, shouldChangePassword=$shouldChangePassword, storageLabel=$storageLabel)';
}
