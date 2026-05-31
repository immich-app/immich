// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAuthUserV1 {
  const SyncAuthUserV1({
    this.avatarColor,
    required this.deletedAt,
    required this.email,
    required this.hasProfileImage,
    required this.id,
    required this.isAdmin,
    required this.name,
    required this.oauthId,
    required this.pinCode,
    required this.profileChangedAt,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    required this.storageLabel,
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

  /// User is admin
  final bool isAdmin;

  /// User name
  final String name;

  /// User OAuth ID
  final String oauthId;

  /// User pin code
  final String? pinCode;

  /// User profile changed at
  final DateTime profileChangedAt;

  /// Quota size in bytes
  final int? quotaSizeInBytes;

  /// Quota usage in bytes
  final int quotaUsageInBytes;

  /// User storage label
  final String? storageLabel;

  static const _undefined = Object();

  static SyncAuthUserV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAuthUserV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      avatarColor: UserAvatarColor.fromJson(json[r'avatarColor']),
      deletedAt: (json[r'deletedAt'] == null ? null : DateTime.parse(json[r'deletedAt'] as String)),
      email: json[r'email'] as String,
      hasProfileImage: json[r'hasProfileImage'] as bool,
      id: json[r'id'] as String,
      isAdmin: json[r'isAdmin'] as bool,
      name: json[r'name'] as String,
      oauthId: json[r'oauthId'] as String,
      pinCode: (json[r'pinCode'] as String?),
      profileChangedAt: DateTime.parse(json[r'profileChangedAt'] as String),
      quotaSizeInBytes: (json[r'quotaSizeInBytes'] as int?),
      quotaUsageInBytes: json[r'quotaUsageInBytes'] as int,
      storageLabel: (json[r'storageLabel'] as String?),
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
    json[r'isAdmin'] = isAdmin;
    json[r'name'] = name;
    json[r'oauthId'] = oauthId;
    if (pinCode != null) {
      json[r'pinCode'] = pinCode!;
    }
    json[r'profileChangedAt'] = profileChangedAt.toUtc().toIso8601String();
    if (quotaSizeInBytes != null) {
      json[r'quotaSizeInBytes'] = quotaSizeInBytes!;
    }
    json[r'quotaUsageInBytes'] = quotaUsageInBytes;
    if (storageLabel != null) {
      json[r'storageLabel'] = storageLabel!;
    }
    return json;
  }

  SyncAuthUserV1 copyWith({
    Object? avatarColor = _undefined,
    Object? deletedAt = _undefined,
    String? email,
    bool? hasProfileImage,
    String? id,
    bool? isAdmin,
    String? name,
    String? oauthId,
    Object? pinCode = _undefined,
    DateTime? profileChangedAt,
    Object? quotaSizeInBytes = _undefined,
    int? quotaUsageInBytes,
    Object? storageLabel = _undefined,
  }) {
    return .new(
      avatarColor: identical(avatarColor, _undefined) ? this.avatarColor : avatarColor as UserAvatarColor?,
      deletedAt: identical(deletedAt, _undefined) ? this.deletedAt : deletedAt as DateTime?,
      email: email ?? this.email,
      hasProfileImage: hasProfileImage ?? this.hasProfileImage,
      id: id ?? this.id,
      isAdmin: isAdmin ?? this.isAdmin,
      name: name ?? this.name,
      oauthId: oauthId ?? this.oauthId,
      pinCode: identical(pinCode, _undefined) ? this.pinCode : pinCode as String?,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      quotaSizeInBytes: identical(quotaSizeInBytes, _undefined) ? this.quotaSizeInBytes : quotaSizeInBytes as int?,
      quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
      storageLabel: identical(storageLabel, _undefined) ? this.storageLabel : storageLabel as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAuthUserV1 &&
            avatarColor == other.avatarColor &&
            deletedAt == other.deletedAt &&
            email == other.email &&
            hasProfileImage == other.hasProfileImage &&
            id == other.id &&
            isAdmin == other.isAdmin &&
            name == other.name &&
            oauthId == other.oauthId &&
            pinCode == other.pinCode &&
            profileChangedAt == other.profileChangedAt &&
            quotaSizeInBytes == other.quotaSizeInBytes &&
            quotaUsageInBytes == other.quotaUsageInBytes &&
            storageLabel == other.storageLabel);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      avatarColor,
      deletedAt,
      email,
      hasProfileImage,
      id,
      isAdmin,
      name,
      oauthId,
      pinCode,
      profileChangedAt,
      quotaSizeInBytes,
      quotaUsageInBytes,
      storageLabel,
    ]);
  }

  @override
  String toString() =>
      'SyncAuthUserV1(avatarColor=$avatarColor, deletedAt=$deletedAt, email=$email, hasProfileImage=$hasProfileImage, id=$id, isAdmin=$isAdmin, name=$name, oauthId=$oauthId, pinCode=$pinCode, profileChangedAt=$profileChangedAt, quotaSizeInBytes=$quotaSizeInBytes, quotaUsageInBytes=$quotaUsageInBytes, storageLabel=$storageLabel)';
}
