import 'package:drift/drift.dart' hide Index;
import 'package:immich_mobile/domain/models/user.model.dart' as model;
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
  final model.AvatarColor avatarColor;
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
    this.avatarColor = model.AvatarColor.primary,
    this.memoryEnabled = true,
    this.inTimeline = false,
    this.quotaUsageInBytes = 0,
    this.quotaSizeInBytes = 0,
  });

  static User fromDto(model.User dto) => User(
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

  model.User toDto() => model.User(
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

@TableIndex(name: 'user_uid', columns: {#uid})
@UseRowClass(model.User)
class UserEntity extends Table {
  const UserEntity();

  IntColumn get id => integer()();
  TextColumn get uid => text().unique()();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  TextColumn get name => text()();
  TextColumn get email => text()();
  BoolColumn get isAdmin => boolean().withDefault(const Constant(false))();
  // Quota
  IntColumn get quotaSizeInBytes => integer().withDefault(const Constant(0))();
  IntColumn get quotaUsageInBytes => integer().withDefault(const Constant(0))();
  // Sharing
  BoolColumn get isPartnerSharedBy =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get isPartnerSharedWith =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get inTimeline => boolean().withDefault(const Constant(false))();
  // User prefs
  TextColumn get profileImagePath => text()();
  BoolColumn get memoryEnabled => boolean().withDefault(const Constant(true))();
  IntColumn get avatarColor => intEnum<model.AvatarColor>()();

  @override
  Set<Column> get primaryKey => {id};
}
