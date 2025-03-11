import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';

part 'user.entity.g.dart';

@Collection(inheritance: false)
class User {
  Id get isarId => fastHash(id);
  @Index(unique: true, replace: false, type: IndexType.hash)
  final String id;
  final DateTime updatedAt;
  final String email;
  final String name;
  final bool isPartnerSharedBy;
  final bool isPartnerSharedWith;
  final bool isAdmin;
  final String profileImagePath;
  @Enumerated(EnumType.ordinal)
  final AvatarColor avatarColor;
  final bool memoryEnabled;
  final bool inTimeline;
  final int quotaUsageInBytes;
  final int quotaSizeInBytes;

  const User({
    required this.id,
    required this.updatedAt,
    required this.email,
    required this.name,
    required this.isAdmin,
    this.isPartnerSharedBy = false,
    this.isPartnerSharedWith = false,
    this.profileImagePath = '',
    this.avatarColor = AvatarColor.primary,
    this.memoryEnabled = true,
    this.inTimeline = false,
    this.quotaUsageInBytes = 0,
    this.quotaSizeInBytes = 0,
  });

  static User fromDto(UserDto dto) => User(
        id: dto.uid,
        updatedAt: dto.updatedAt,
        email: dto.email,
        name: dto.name,
        isAdmin: dto.isAdmin,
        isPartnerSharedBy: dto.isPartnerSharedBy,
        isPartnerSharedWith: dto.isPartnerSharedWith,
        profileImagePath: dto.profileImagePath ?? "",
        avatarColor: dto.avatarColor,
        memoryEnabled: dto.memoryEnabled,
        inTimeline: dto.inTimeline,
        quotaUsageInBytes: dto.quotaUsageInBytes,
        quotaSizeInBytes: dto.quotaSizeInBytes,
      );

  UserDto toDto() => UserDto(
        uid: id,
        email: email,
        name: name,
        isAdmin: isAdmin,
        updatedAt: updatedAt,
        profileImagePath: profileImagePath.isEmpty ? null : profileImagePath,
        avatarColor: avatarColor,
        memoryEnabled: memoryEnabled,
        inTimeline: inTimeline,
        isPartnerSharedBy: isPartnerSharedBy,
        isPartnerSharedWith: isPartnerSharedWith,
        quotaUsageInBytes: quotaUsageInBytes,
        quotaSizeInBytes: quotaSizeInBytes,
      );
}
