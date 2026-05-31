// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UserAdminResponseDto {
  const UserAdminResponseDto({
    required this.avatarColor,
    required this.createdAt,
    required this.deletedAt,
    required this.email,
    required this.id,
    required this.isAdmin,
    required this.license,
    required this.name,
    required this.oauthId,
    required this.profileChangedAt,
    required this.profileImagePath,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    required this.shouldChangePassword,
    required this.status,
    required this.storageLabel,
    required this.updatedAt,
  });

  final UserAvatarColor avatarColor;

  /// Creation date
  final DateTime createdAt;

  /// Deletion date
  final DateTime? deletedAt;

  /// User email
  final String email;

  /// User ID
  final String id;

  /// Is admin user
  final bool isAdmin;

  final UserLicense? license;

  /// User name
  final String name;

  /// OAuth ID
  final String oauthId;

  /// Profile change date
  final DateTime profileChangedAt;

  /// Profile image path
  final String profileImagePath;

  /// Storage quota in bytes
  final int? quotaSizeInBytes;

  /// Storage usage in bytes
  final int? quotaUsageInBytes;

  /// Require password change on next login
  final bool shouldChangePassword;

  final UserStatus status;

  /// Storage label
  final String? storageLabel;

  /// Last update date
  final DateTime updatedAt;

  static const _undefined = Object();

  static UserAdminResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UserAdminResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      avatarColor: (UserAvatarColor.fromJson(json[r'avatarColor']))!,
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      deletedAt: (json[r'deletedAt'] == null ? null : DateTime.parse(json[r'deletedAt'] as String)),
      email: json[r'email'] as String,
      id: json[r'id'] as String,
      isAdmin: json[r'isAdmin'] as bool,
      license: UserLicense.fromJson(json[r'license']),
      name: json[r'name'] as String,
      oauthId: json[r'oauthId'] as String,
      profileChangedAt: DateTime.parse(json[r'profileChangedAt'] as String),
      profileImagePath: json[r'profileImagePath'] as String,
      quotaSizeInBytes: (json[r'quotaSizeInBytes'] as int?),
      quotaUsageInBytes: (json[r'quotaUsageInBytes'] as int?),
      shouldChangePassword: json[r'shouldChangePassword'] as bool,
      status: (UserStatus.fromJson(json[r'status']))!,
      storageLabel: (json[r'storageLabel'] as String?),
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'avatarColor'] = avatarColor.toJson();
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    if (deletedAt != null) {
      json[r'deletedAt'] = deletedAt!.toUtc().toIso8601String();
    }
    json[r'email'] = email;
    json[r'id'] = id;
    json[r'isAdmin'] = isAdmin;
    if (license != null) {
      json[r'license'] = license!.toJson();
    }
    json[r'name'] = name;
    json[r'oauthId'] = oauthId;
    json[r'profileChangedAt'] = profileChangedAt.toUtc().toIso8601String();
    json[r'profileImagePath'] = profileImagePath;
    if (quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = quotaSizeInBytes!;
    }
    if (quotaUsageInBytes != null) {
      json[r'quotaUsageInBytes'] = quotaUsageInBytes!;
    }
    json[r'shouldChangePassword'] = shouldChangePassword;
    json[r'status'] = status.toJson();
    if (storageLabel != null) {
      json[r'storageLabel'] = storageLabel!;
    }
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    return json;
  }

  UserAdminResponseDto copyWith({
    UserAvatarColor? avatarColor,
    DateTime? createdAt,
    Object? deletedAt = _undefined,
    String? email,
    String? id,
    bool? isAdmin,
    Object? license = _undefined,
    String? name,
    String? oauthId,
    DateTime? profileChangedAt,
    String? profileImagePath,
    Object? quotaSizeInBytes = _undefined,
    Object? quotaUsageInBytes = _undefined,
    bool? shouldChangePassword,
    UserStatus? status,
    Object? storageLabel = _undefined,
    DateTime? updatedAt,
  }) {
    return .new(
      avatarColor: avatarColor ?? this.avatarColor,
      createdAt: createdAt ?? this.createdAt,
      deletedAt: identical(deletedAt, _undefined) ? this.deletedAt : deletedAt as DateTime?,
      email: email ?? this.email,
      id: id ?? this.id,
      isAdmin: isAdmin ?? this.isAdmin,
      license: identical(license, _undefined) ? this.license : license as UserLicense?,
      name: name ?? this.name,
      oauthId: oauthId ?? this.oauthId,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      quotaSizeInBytes: identical(quotaSizeInBytes, _undefined) ? this.quotaSizeInBytes : quotaSizeInBytes as int?,
      quotaUsageInBytes: identical(quotaUsageInBytes, _undefined) ? this.quotaUsageInBytes : quotaUsageInBytes as int?,
      shouldChangePassword: shouldChangePassword ?? this.shouldChangePassword,
      status: status ?? this.status,
      storageLabel: identical(storageLabel, _undefined) ? this.storageLabel : storageLabel as String?,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UserAdminResponseDto &&
            avatarColor == other.avatarColor &&
            createdAt == other.createdAt &&
            deletedAt == other.deletedAt &&
            email == other.email &&
            id == other.id &&
            isAdmin == other.isAdmin &&
            license == other.license &&
            name == other.name &&
            oauthId == other.oauthId &&
            profileChangedAt == other.profileChangedAt &&
            profileImagePath == other.profileImagePath &&
            quotaSizeInBytes == other.quotaSizeInBytes &&
            quotaUsageInBytes == other.quotaUsageInBytes &&
            shouldChangePassword == other.shouldChangePassword &&
            status == other.status &&
            storageLabel == other.storageLabel &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      avatarColor,
      createdAt,
      deletedAt,
      email,
      id,
      isAdmin,
      license,
      name,
      oauthId,
      profileChangedAt,
      profileImagePath,
      quotaSizeInBytes,
      quotaUsageInBytes,
      shouldChangePassword,
      status,
      storageLabel,
      updatedAt,
    ]);
  }

  @override
  String toString() =>
      'UserAdminResponseDto(avatarColor=$avatarColor, createdAt=$createdAt, deletedAt=$deletedAt, email=$email, id=$id, isAdmin=$isAdmin, license=$license, name=$name, oauthId=$oauthId, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath, quotaSizeInBytes=$quotaSizeInBytes, quotaUsageInBytes=$quotaUsageInBytes, shouldChangePassword=$shouldChangePassword, status=$status, storageLabel=$storageLabel, updatedAt=$updatedAt)';
}
