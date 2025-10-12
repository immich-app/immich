// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';
import 'dart:ui';

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
    if (identical(this, other)) return true;

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

class PartnerUserDto {
  final String id;
  final String email;
  final String name;
  final bool inTimeline;

  final String? profileImagePath;

  const PartnerUserDto({
    required this.id,
    required this.email,
    required this.name,
    required this.inTimeline,
    this.profileImagePath,
  });

  PartnerUserDto copyWith({String? id, String? email, String? name, bool? inTimeline, String? profileImagePath}) {
    return PartnerUserDto(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      inTimeline: inTimeline ?? this.inTimeline,
      profileImagePath: profileImagePath ?? this.profileImagePath,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'id': id,
      'email': email,
      'name': name,
      'inTimeline': inTimeline,
      'profileImagePath': profileImagePath,
    };
  }

  factory PartnerUserDto.fromMap(Map<String, dynamic> map) {
    return PartnerUserDto(
      id: map['id'] as String,
      email: map['email'] as String,
      name: map['name'] as String,
      inTimeline: map['inTimeline'] as bool,
      profileImagePath: map['profileImagePath'] != null ? map['profileImagePath'] as String : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory PartnerUserDto.fromJson(String source) => PartnerUserDto.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() {
    return 'PartnerUserDto(id: $id, email: $email, name: $name, inTimeline: $inTimeline, profileImagePath: $profileImagePath)';
  }

  @override
  bool operator ==(covariant PartnerUserDto other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.email == email &&
        other.name == name &&
        other.inTimeline == inTimeline &&
        other.profileImagePath == profileImagePath;
  }

  @override
  int get hashCode {
    return id.hashCode ^ email.hashCode ^ name.hashCode ^ inTimeline.hashCode ^ profileImagePath.hashCode;
  }
}
