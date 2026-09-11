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
@Freezed(equal: false)
abstract class UserDto with _$UserDto {
  const UserDto._();

  const factory UserDto({
    required String id,
    required String email,
    required String name,
    @Default(false) bool isAdmin,
    DateTime? updatedAt,
    required DateTime profileChangedAt,
    @Default(AvatarColor.primary) AvatarColor avatarColor,
    @Default(true) bool memoryEnabled,
    @Default(false) bool inTimeline,
    @Default(false) bool isPartnerSharedBy,
    @Default(false) bool isPartnerSharedWith,
    @Default(false) bool hasProfileImage,
    @Default(0) int quotaUsageInBytes,
    @Default(0) int quotaSizeInBytes,
  }) = _UserDto;

  bool get hasQuota => quotaSizeInBytes > 0;

  // We use [DateTime.isAtSameMomentAs] for comparing across timezones. As Freezed doesn't support custom equality, we need to have our own `==` for now
  // TODO(agg23): Switch to newtypes to fix equality
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
  final AvatarColor avatarColor;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.profileChangedAt,
    required this.hasProfileImage,
    this.avatarColor = .primary,
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
