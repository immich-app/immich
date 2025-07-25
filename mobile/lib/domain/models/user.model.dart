import 'package:immich_mobile/domain/models/user_metadata.model.dart';

// TODO: Remove UserDto once Isar is removed
class UserDto {
  final String id;
  final String email;
  final String name;
  final bool isAdmin;
  final DateTime updatedAt;

  final String? profileImagePath;
  final AvatarColor avatarColor;

  final bool memoryEnabled;
  final bool inTimeline;

  final bool isPartnerSharedBy;
  final bool isPartnerSharedWith;

  final int quotaUsageInBytes;
  final int quotaSizeInBytes;

  bool get hasQuota => quotaSizeInBytes > 0;

  const UserDto({
    required this.id,
    required this.email,
    required this.name,
    required this.isAdmin,
    required this.updatedAt,
    this.profileImagePath,
    this.avatarColor = AvatarColor.primary,
    this.memoryEnabled = true,
    this.inTimeline = false,
    this.isPartnerSharedBy = false,
    this.isPartnerSharedWith = false,
    this.quotaUsageInBytes = 0,
    this.quotaSizeInBytes = 0,
  });

  @override
  String toString() {
    return '''User: {
    id: $id,
    email: $email,
    name: $name,
    isAdmin: $isAdmin,
    updatedAt: $updatedAt,
    profileImagePath: ${profileImagePath ?? '<NA>'},
    avatarColor: $avatarColor,
    memoryEnabled: $memoryEnabled,
    inTimeline: $inTimeline,
    isPartnerSharedBy: $isPartnerSharedBy,
    isPartnerSharedWith: $isPartnerSharedWith,
    quotaUsageInBytes: $quotaUsageInBytes,
    quotaSizeInBytes: $quotaSizeInBytes,
}''';
  }

  UserDto copyWith({
    String? id,
    String? email,
    String? name,
    bool? isAdmin,
    DateTime? updatedAt,
    String? profileImagePath,
    AvatarColor? avatarColor,
    bool? memoryEnabled,
    bool? inTimeline,
    bool? isPartnerSharedBy,
    bool? isPartnerSharedWith,
    int? quotaUsageInBytes,
    int? quotaSizeInBytes,
  }) =>
      UserDto(
        id: id ?? this.id,
        email: email ?? this.email,
        name: name ?? this.name,
        isAdmin: isAdmin ?? this.isAdmin,
        updatedAt: updatedAt ?? this.updatedAt,
        profileImagePath: profileImagePath ?? this.profileImagePath,
        avatarColor: avatarColor ?? this.avatarColor,
        memoryEnabled: memoryEnabled ?? this.memoryEnabled,
        inTimeline: inTimeline ?? this.inTimeline,
        isPartnerSharedBy: isPartnerSharedBy ?? this.isPartnerSharedBy,
        isPartnerSharedWith: isPartnerSharedWith ?? this.isPartnerSharedWith,
        quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
        quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
      );

  @override
  bool operator ==(covariant UserDto other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.updatedAt.isAtSameMomentAs(updatedAt) &&
        other.avatarColor == avatarColor &&
        other.email == email &&
        other.name == name &&
        other.isPartnerSharedBy == isPartnerSharedBy &&
        other.isPartnerSharedWith == isPartnerSharedWith &&
        other.profileImagePath == profileImagePath &&
        other.isAdmin == isAdmin &&
        other.memoryEnabled == memoryEnabled &&
        other.inTimeline == inTimeline &&
        other.quotaUsageInBytes == quotaUsageInBytes &&
        other.quotaSizeInBytes == quotaSizeInBytes;
  }

  @override
  int get hashCode =>
      id.hashCode ^
      name.hashCode ^
      email.hashCode ^
      updatedAt.hashCode ^
      isAdmin.hashCode ^
      profileImagePath.hashCode ^
      avatarColor.hashCode ^
      memoryEnabled.hashCode ^
      inTimeline.hashCode ^
      isPartnerSharedBy.hashCode ^
      isPartnerSharedWith.hashCode ^
      quotaUsageInBytes.hashCode ^
      quotaSizeInBytes.hashCode;
}

class User {
  final String id;
  final String name;
  final String email;
  final DateTime? deletedAt;
  final AvatarColor? avatarColor;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.deletedAt,
    this.avatarColor,
  });

  User copyWith({
    String? id,
    String? name,
    String? email,
    DateTime? deletedAt,
    AvatarColor? avatarColor,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      deletedAt: deletedAt ?? this.deletedAt,
      avatarColor: avatarColor ?? this.avatarColor,
    );
  }

  @override
  String toString() {
    return '''User {
    id: $id,
    name: $name,
    email: $email,
    deletedAt: ${deletedAt ?? "<NA>"},
    avatarColor: ${avatarColor ?? "<NA>"},
}''';
  }

  @override
  bool operator ==(covariant User other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.email == email &&
        other.deletedAt == deletedAt &&
        other.avatarColor == avatarColor;
  }

  @override
  int get hashCode {
    return id.hashCode ^ name.hashCode ^ email.hashCode ^ deletedAt.hashCode ^ avatarColor.hashCode;
  }
}

class AuthUser {
  final String id;
  final String name;
  final String email;
  final DateTime? deletedAt;
  final AvatarColor? avatarColor;
  final bool isAdmin;
  final String oauthId;
  final String? pinCode;
  final bool hasProfileImage;
  final DateTime profileChangedAt;
  final int? quotaSizeInBytes;
  final int quotaUsageInBytes;
  final String? storageLabel;

  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    this.deletedAt,
    this.avatarColor,
    required this.isAdmin,
    required this.oauthId,
    this.pinCode,
    required this.hasProfileImage,
    required this.profileChangedAt,
    this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    this.storageLabel,
  });

  AuthUser copyWith({
    String? id,
    String? name,
    String? email,
    DateTime? deletedAt,
    AvatarColor? avatarColor,
    bool? isAdmin,
    String? oauthId,
    String? pinCode,
    bool? hasProfileImage,
    DateTime? profileChangedAt,
    int? quotaSizeInBytes,
    int? quotaUsageInBytes,
    String? storageLabel,
  }) {
    return AuthUser(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      deletedAt: deletedAt ?? this.deletedAt,
      avatarColor: avatarColor ?? this.avatarColor,
      isAdmin: isAdmin ?? this.isAdmin,
      oauthId: oauthId ?? this.oauthId,
      pinCode: pinCode ?? this.pinCode,
      hasProfileImage: hasProfileImage ?? this.hasProfileImage,
      profileChangedAt: profileChangedAt ?? this.profileChangedAt,
      quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
      quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
      storageLabel: storageLabel ?? this.storageLabel,
    );
  }

  @override
  String toString() {
    return '''AuthUser {
    id: $id,
    name: $name,
    email: $email,
    deletedAt: ${deletedAt ?? "<NA>"},
    avatarColor: ${avatarColor ?? "<NA>"},
    isAdmin: $isAdmin,
    oauthId: $oauthId,
    pinCode: ${pinCode ?? "<NA>"},
    hasProfileImage: $hasProfileImage,
    profileChangedAt: $profileChangedAt,
    quotaSizeInBytes: ${quotaSizeInBytes ?? "<NA>"},
    quotaUsageInBytes: $quotaUsageInBytes,
    storageLabel: ${storageLabel ?? "<NA>"},
}''';
  }

  @override
  bool operator ==(covariant AuthUser other) {
    if (identical(this, other)) return true;
    return other.id == id &&
        other.name == name &&
        other.email == email &&
        other.deletedAt == deletedAt &&
        other.avatarColor == avatarColor &&
        other.isAdmin == isAdmin &&
        other.oauthId == oauthId &&
        other.pinCode == pinCode &&
        other.hasProfileImage == hasProfileImage &&
        other.profileChangedAt == profileChangedAt &&
        other.quotaSizeInBytes == quotaSizeInBytes &&
        other.quotaUsageInBytes == quotaUsageInBytes &&
        other.storageLabel == storageLabel;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        email.hashCode ^
        deletedAt.hashCode ^
        avatarColor.hashCode ^
        isAdmin.hashCode ^
        oauthId.hashCode ^
        pinCode.hashCode ^
        hasProfileImage.hashCode ^
        profileChangedAt.hashCode ^
        quotaSizeInBytes.hashCode ^
        quotaUsageInBytes.hashCode ^
        storageLabel.hashCode;
  }
}

class PartnerUser {
  final String id;
  final String email;
  final String name;
  final bool inTimeline;

  const PartnerUser({
    required this.id,
    required this.email,
    required this.name,
    required this.inTimeline,
  });

  PartnerUser copyWith({
    String? id,
    String? email,
    String? name,
    bool? inTimeline,
  }) {
    return PartnerUser(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      inTimeline: inTimeline ?? this.inTimeline,
    );
  }

  @override
  String toString() {
    return '''PartnerUser {
    id: $id,
    email: $email,
    name: $name,
    inTimeline: $inTimeline,
}''';
  }

  @override
  bool operator ==(covariant PartnerUser other) {
    if (identical(this, other)) return true;

    return other.id == id && other.email == email && other.name == name && other.inTimeline == inTimeline;
  }

  @override
  int get hashCode {
    return id.hashCode ^ email.hashCode ^ name.hashCode ^ inTimeline.hashCode;
  }
}
