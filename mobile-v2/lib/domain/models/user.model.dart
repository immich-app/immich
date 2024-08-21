import 'dart:ui';

import 'package:openapi/openapi.dart' as api;

class User {
  const User({
    required this.id,
    required this.updatedAt,
    required this.name,
    required this.email,
    required this.isAdmin,
    required this.quotaSizeInBytes,
    required this.quotaUsageInBytes,
    required this.inTimeline,
    required this.profileImagePath,
    required this.memoryEnabled,
    required this.avatarColor,
  });

  final String id;
  final DateTime updatedAt;
  final String name;
  final String email;
  final bool isAdmin;
  // Quota
  final int quotaSizeInBytes;
  final int quotaUsageInBytes;
  // Sharing
  final bool inTimeline;
  // User prefs
  final String profileImagePath;
  final bool memoryEnabled;
  final UserAvatarColor avatarColor;

  User copyWith({
    String? id,
    DateTime? updatedAt,
    String? name,
    String? email,
    bool? isAdmin,
    int? quotaSizeInBytes,
    int? quotaUsageInBytes,
    bool? inTimeline,
    String? profileImagePath,
    bool? memoryEnabled,
    UserAvatarColor? avatarColor,
  }) {
    return User(
      id: id ?? this.id,
      updatedAt: updatedAt ?? this.updatedAt,
      name: name ?? this.name,
      email: email ?? this.email,
      isAdmin: isAdmin ?? this.isAdmin,
      quotaSizeInBytes: quotaSizeInBytes ?? this.quotaSizeInBytes,
      quotaUsageInBytes: quotaUsageInBytes ?? this.quotaUsageInBytes,
      inTimeline: inTimeline ?? this.inTimeline,
      profileImagePath: profileImagePath ?? this.profileImagePath,
      memoryEnabled: memoryEnabled ?? this.memoryEnabled,
      avatarColor: avatarColor ?? this.avatarColor,
    );
  }

  @override
  String toString() {
    return 'User(id: $id, updatedAt: $updatedAt, name: $name, email: $email, isAdmin: $isAdmin, quotaSizeInBytes: $quotaSizeInBytes, quotaUsageInBytes: $quotaUsageInBytes, inTimeline: $inTimeline, profileImagePath: $profileImagePath, memoryEnabled: $memoryEnabled, avatarColor: $avatarColor)';
  }

  @override
  bool operator ==(covariant User other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.updatedAt == updatedAt &&
        other.name == name &&
        other.email == email &&
        other.isAdmin == isAdmin &&
        other.quotaSizeInBytes == quotaSizeInBytes &&
        other.quotaUsageInBytes == quotaUsageInBytes &&
        other.inTimeline == inTimeline &&
        other.profileImagePath == profileImagePath &&
        other.memoryEnabled == memoryEnabled &&
        other.avatarColor == avatarColor;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        updatedAt.hashCode ^
        name.hashCode ^
        email.hashCode ^
        isAdmin.hashCode ^
        quotaSizeInBytes.hashCode ^
        quotaUsageInBytes.hashCode ^
        inTimeline.hashCode ^
        profileImagePath.hashCode ^
        memoryEnabled.hashCode ^
        avatarColor.hashCode;
  }

  factory User.fromAdminDto(
    api.UserAdminResponseDto userDto, [
    api.UserPreferencesResponseDto? userPreferences,
  ]) {
    return User(
      id: userDto.id,
      updatedAt: DateTime.now(),
      name: userDto.name,
      email: userDto.email,
      isAdmin: userDto.isAdmin,
      quotaSizeInBytes: userDto.quotaSizeInBytes ?? 0,
      quotaUsageInBytes: userDto.quotaUsageInBytes ?? 0,
      inTimeline: true,
      profileImagePath: userDto.profileImagePath,
      memoryEnabled: userPreferences?.memories.enabled ?? true,
      avatarColor: userDto.avatarColor.toEnum(),
    );
  }
}

enum UserAvatarColor {
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
  amber,
}

extension AvatarColorEnumHelper on api.UserAvatarColor {
  UserAvatarColor toEnum() {
    switch (this) {
      case api.UserAvatarColor.primary:
        return UserAvatarColor.primary;
      case api.UserAvatarColor.pink:
        return UserAvatarColor.pink;
      case api.UserAvatarColor.red:
        return UserAvatarColor.red;
      case api.UserAvatarColor.yellow:
        return UserAvatarColor.yellow;
      case api.UserAvatarColor.blue:
        return UserAvatarColor.blue;
      case api.UserAvatarColor.green:
        return UserAvatarColor.green;
      case api.UserAvatarColor.purple:
        return UserAvatarColor.purple;
      case api.UserAvatarColor.orange:
        return UserAvatarColor.orange;
      case api.UserAvatarColor.gray:
        return UserAvatarColor.gray;
      case api.UserAvatarColor.amber:
        return UserAvatarColor.amber;
    }
    return UserAvatarColor.primary;
  }
}

extension AvatarColorToColorHelper on UserAvatarColor {
  Color toColor([bool isDarkTheme = false]) {
    switch (this) {
      case UserAvatarColor.primary:
        return isDarkTheme ? const Color(0xFFABCBFA) : const Color(0xFF4250AF);
      case UserAvatarColor.pink:
        return const Color.fromARGB(255, 244, 114, 182);
      case UserAvatarColor.red:
        return const Color.fromARGB(255, 239, 68, 68);
      case UserAvatarColor.yellow:
        return const Color.fromARGB(255, 234, 179, 8);
      case UserAvatarColor.blue:
        return const Color.fromARGB(255, 59, 130, 246);
      case UserAvatarColor.green:
        return const Color.fromARGB(255, 22, 163, 74);
      case UserAvatarColor.purple:
        return const Color.fromARGB(255, 147, 51, 234);
      case UserAvatarColor.orange:
        return const Color.fromARGB(255, 234, 88, 12);
      case UserAvatarColor.gray:
        return const Color.fromARGB(255, 75, 85, 99);
      case UserAvatarColor.amber:
        return const Color.fromARGB(255, 217, 119, 6);
    }
  }
}
