import 'package:drift/drift.dart' hide Index;
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/utils/drift_default.mixin.dart';
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
    id: dto.id,
    updatedAt: dto.updatedAt ?? DateTime(2025),
    email: dto.email,
    name: dto.name,
    isAdmin: dto.isAdmin,
    isPartnerSharedBy: dto.isPartnerSharedBy,
    isPartnerSharedWith: dto.isPartnerSharedWith,
    profileImagePath: dto.hasProfileImage ? "HAS_PROFILE_IMAGE" : "",
    avatarColor: dto.avatarColor,
    memoryEnabled: dto.memoryEnabled,
    inTimeline: dto.inTimeline,
    quotaUsageInBytes: dto.quotaUsageInBytes,
    quotaSizeInBytes: dto.quotaSizeInBytes,
  );

  UserDto toDto() => UserDto(
    id: id,
    email: email,
    name: name,
    isAdmin: isAdmin,
    updatedAt: updatedAt,
    avatarColor: avatarColor,
    memoryEnabled: memoryEnabled,
    inTimeline: inTimeline,
    isPartnerSharedBy: isPartnerSharedBy,
    isPartnerSharedWith: isPartnerSharedWith,
    hasProfileImage: profileImagePath.isNotEmpty,
    profileChangedAt: updatedAt,
    quotaUsageInBytes: quotaUsageInBytes,
    quotaSizeInBytes: quotaSizeInBytes,
  );
}

class UserEntity extends Table with DriftDefaultsMixin {
  const UserEntity();

  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get email => text()();

  // Profile image
  BoolColumn get hasProfileImage => boolean().withDefault(const Constant(false))();
  DateTimeColumn get profileChangedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get avatarColor => intEnum<AvatarColor>().withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id};
}
