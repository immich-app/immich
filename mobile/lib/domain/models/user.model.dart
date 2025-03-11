import 'dart:ui';

import 'package:immich_mobile/utils/hash.dart';

enum AvatarColor {
  // do not change this order or reuse indices for other purposes, adding is OK
  primary,
  pink,
  red,
  yellow,
  blue,
  green,
  purple,
  orange,
  gray,
  amber;

  Color toColor({bool isDarkTheme = false}) => switch (this) {
        AvatarColor.primary =>
          isDarkTheme ? const Color(0xFFABCBFA) : const Color(0xFF4250AF),
        AvatarColor.pink => const Color.fromARGB(255, 244, 114, 182),
        AvatarColor.red => const Color.fromARGB(255, 239, 68, 68),
        AvatarColor.yellow => const Color.fromARGB(255, 234, 179, 8),
        AvatarColor.blue => const Color.fromARGB(255, 59, 130, 246),
        AvatarColor.green => const Color.fromARGB(255, 22, 163, 74),
        AvatarColor.purple => const Color.fromARGB(255, 147, 51, 234),
        AvatarColor.orange => const Color.fromARGB(255, 234, 88, 12),
        AvatarColor.gray => const Color.fromARGB(255, 75, 85, 99),
        AvatarColor.amber => const Color.fromARGB(255, 217, 119, 6),
      };
}

// TODO: Rename to User once Isar is removed
class UserDto {
  final String uid;
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

  int get id => fastHash(uid);
  bool get hasQuota => quotaSizeInBytes > 0;

  const UserDto({
    required this.uid,
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
uid: $uid,
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
    String? uid,
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
        uid: uid ?? this.uid,
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

    return other.uid == uid &&
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
      uid.hashCode ^
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
