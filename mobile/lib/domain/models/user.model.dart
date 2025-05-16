import 'package:immich_mobile/domain/models/user_metadata.model.dart';

// TODO: Rename to User once Isar is removed
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
