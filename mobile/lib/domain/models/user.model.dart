import 'dart:ui';

import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.model.freezed.dart';

enum AvatarColor {
  // do not change this order or reuse indices for other purposes, adding is OK
  primary("primary"),
  pink("pink"),
  red("red"),
  yellow("yellow"),
  blue("blue"),
  green("green"),
  purple("purple"),
  orange("orange"),
  gray("gray"),
  amber("amber");

  final String value;
  const AvatarColor(this.value);

  Color toColor({bool isDarkTheme = false}) => switch (this) {
    AvatarColor.primary => isDarkTheme ? const Color(0xFFABCBFA) : const Color(0xFF4250AF),
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
  final String id;
  final String email;
  final String name;
  final bool isAdmin;
  final DateTime? updatedAt;

  final AvatarColor avatarColor;

  final bool memoryEnabled;
  final bool inTimeline;

  final bool isPartnerSharedBy;
  final bool isPartnerSharedWith;

  final int quotaUsageInBytes;
  final int quotaSizeInBytes;

  bool get hasQuota => quotaSizeInBytes > 0;

  final bool hasProfileImage;
  final DateTime profileChangedAt;

  const UserDto({
    required this.id,
    required this.email,
    required this.name,
    this.isAdmin = false,
    this.updatedAt,
    required this.profileChangedAt,
    this.avatarColor = AvatarColor.primary,
    this.memoryEnabled = true,
    this.inTimeline = false,
    this.isPartnerSharedBy = false,
    this.isPartnerSharedWith = false,
    this.hasProfileImage = false,
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
avatarColor: $avatarColor,
memoryEnabled: $memoryEnabled,
inTimeline: $inTimeline,
isPartnerSharedBy: $isPartnerSharedBy,
isPartnerSharedWith: $isPartnerSharedWith,
hasProfileImage: $hasProfileImage
profileChangedAt: $profileChangedAt
}''';
  }

  UserDto copyWith({
    String? id,
    String? email,
    String? name,
    bool? isAdmin,
    DateTime? updatedAt,
    AvatarColor? avatarColor,
    bool? memoryEnabled,
    bool? inTimeline,
    bool? isPartnerSharedBy,
    bool? isPartnerSharedWith,
    bool? hasProfileImage,
    DateTime? profileChangedAt,
    int? quotaSizeInBytes,
    int? quotaUsageInBytes,
  }) => UserDto(
    id: id ?? this.id,
    email: email ?? this.email,
    name: name ?? this.name,
    isAdmin: isAdmin ?? this.isAdmin,
    updatedAt: updatedAt ?? this.updatedAt,
    avatarColor: avatarColor ?? this.avatarColor,
    memoryEnabled: memoryEnabled ?? this.memoryEnabled,
    inTimeline: inTimeline ?? this.inTimeline,
    isPartnerSharedBy: isPartnerSharedBy ?? this.isPartnerSharedBy,
    isPartnerSharedWith: isPartnerSharedWith ?? this.isPartnerSharedWith,
    hasProfileImage: hasProfileImage ?? this.hasProfileImage,
    profileChangedAt: profileChangedAt ?? this.profileChangedAt,
    quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
    quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
  );

  @override
  bool operator ==(covariant UserDto other) {
    if (identical(this, other)) {
      return true;
    }

    return other.id == id &&
        ((updatedAt == null && other.updatedAt == null) ||
            (updatedAt != null && other.updatedAt != null && other.updatedAt!.isAtSameMomentAs(updatedAt!))) &&
        other.avatarColor == avatarColor &&
        other.email == email &&
        other.name == name &&
        other.isPartnerSharedBy == isPartnerSharedBy &&
        other.isPartnerSharedWith == isPartnerSharedWith &&
        other.isAdmin == isAdmin &&
        other.memoryEnabled == memoryEnabled &&
        other.inTimeline == inTimeline &&
        other.hasProfileImage == hasProfileImage &&
        other.profileChangedAt.isAtSameMomentAs(profileChangedAt) &&
        other.quotaSizeInBytes == quotaSizeInBytes &&
        other.quotaUsageInBytes == quotaUsageInBytes;
  }

  @override
  int get hashCode =>
      id.hashCode ^
      name.hashCode ^
      email.hashCode ^
      updatedAt.hashCode ^
      isAdmin.hashCode ^
      avatarColor.hashCode ^
      memoryEnabled.hashCode ^
      inTimeline.hashCode ^
      isPartnerSharedBy.hashCode ^
      isPartnerSharedWith.hashCode ^
      hasProfileImage.hashCode ^
      profileChangedAt.hashCode ^
      quotaSizeInBytes.hashCode ^
      quotaUsageInBytes.hashCode;
}

@freezed
abstract class PartnerUserDto with _$PartnerUserDto {
  const factory PartnerUserDto({
    required String id,
    required String email,
    required String name,
    required bool inTimeline,
    String? profileImagePath,
  }) = _PartnerUserDto;
}

class User {
  final String id;
  final String name;
  final String email;
  final DateTime profileChangedAt;
  final bool hasProfileImage;
  final AvatarColor? avatarColor;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.profileChangedAt,
    required this.hasProfileImage,
    this.avatarColor = AvatarColor.primary,
  });

  @override
  String toString() {
    return 'User(id: $id, name: $name, email: $email, profileChangedAt: $profileChangedAt, hasProfileImage: $hasProfileImage, avatarColor: $avatarColor)';
  }

  @override
  bool operator ==(covariant User other) {
    if (identical(this, other)) {
      return true;
    }

    return other.id == id &&
        other.name == name &&
        other.email == email &&
        other.profileChangedAt == profileChangedAt &&
        other.hasProfileImage == hasProfileImage &&
        other.avatarColor == avatarColor;
  }

  @override
  int get hashCode => Object.hash(id, name, email, profileChangedAt, hasProfileImage, avatarColor);
}

class AuthUser extends User {
  final bool isAdmin;
  final String? pinCode;
  final int? quotaSizeInBytes;
  final int quotaUsageInBytes;

  const AuthUser({
    required super.id,
    required super.name,
    required super.email,
    required super.profileChangedAt,
    required super.hasProfileImage,
    super.avatarColor,
    this.isAdmin = false,
    this.pinCode,
    this.quotaSizeInBytes = 0,
    this.quotaUsageInBytes = 0,
  });

  @override
  String toString() {
    return 'AuthUser(user: ${super.toString()}, isAdmin: $isAdmin, pinCode: $pinCode, quotaSizeInBytes: $quotaSizeInBytes, quotaUsageInBytes: $quotaUsageInBytes)';
  }

  @override
  bool operator ==(covariant AuthUser other) {
    if (identical(this, other)) {
      return true;
    }

    return super == other &&
        other.isAdmin == isAdmin &&
        other.pinCode == pinCode &&
        other.quotaSizeInBytes == quotaSizeInBytes &&
        other.quotaUsageInBytes == quotaUsageInBytes;
  }

  @override
  int get hashCode => Object.hash(super.hashCode, isAdmin, pinCode, quotaSizeInBytes, quotaUsageInBytes);
}

class Partner extends User {
  final bool inTimeline;

  const Partner({
    required super.id,
    required super.name,
    required super.email,
    required super.profileChangedAt,
    required super.hasProfileImage,
    super.avatarColor,
    this.inTimeline = false,
  });

  Partner.fromUser(User user, {this.inTimeline = false})
    : super(
        id: user.id,
        name: user.name,
        email: user.email,
        profileChangedAt: user.profileChangedAt,
        hasProfileImage: user.hasProfileImage,
        avatarColor: user.avatarColor,
      );

  @override
  String toString() {
    return 'Partner(user: ${super.toString()}, inTimeline: $inTimeline)';
  }

  @override
  bool operator ==(covariant Partner other) {
    if (identical(this, other)) {
      return true;
    }

    return super == other && other.inTimeline == inTimeline;
  }

  @override
  int get hashCode => Object.hash(super.hashCode, inTimeline);
}
