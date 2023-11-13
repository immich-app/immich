import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/utils/hash.dart';
import 'package:isar/isar.dart';
import 'package:openapi/api.dart';

part 'user.g.dart';

@Collection(inheritance: false)
class User {
  User({
    required this.id,
    required this.updatedAt,
    required this.email,
    required this.name,
    required this.isAdmin,
    this.isPartnerSharedBy = false,
    this.isPartnerSharedWith = false,
    this.profileImagePath = '',
    this.memoryEnabled = true,
    this.inTimeline = false,
  });

  Id get isarId => fastHash(id);

  User.fromUserDto(UserResponseDto dto)
      : id = dto.id,
        updatedAt = dto.updatedAt,
        email = dto.email,
        name = dto.name,
        isPartnerSharedBy = false,
        isPartnerSharedWith = false,
        profileImagePath = dto.profileImagePath,
        isAdmin = dto.isAdmin,
        memoryEnabled = dto.memoriesEnabled;

  User.fromPartnerDto(PartnerResponseDto dto)
      : id = dto.id,
        updatedAt = dto.updatedAt,
        email = dto.email,
        name = dto.name,
        isPartnerSharedBy = false,
        isPartnerSharedWith = false,
        profileImagePath = dto.profileImagePath,
        isAdmin = dto.isAdmin,
        memoryEnabled = dto.memoriesEnabled,
        inTimeline = dto.inTimeline;

  @Index(unique: true, replace: false, type: IndexType.hash)
  String id;
  DateTime updatedAt;
  String email;
  String name;
  bool isPartnerSharedBy;
  bool isPartnerSharedWith;
  bool isAdmin;
  String profileImagePath;
  bool? memoryEnabled;
  bool? inTimeline;

  @Backlink(to: 'owner')
  final IsarLinks<Album> albums = IsarLinks<Album>();
  @Backlink(to: 'sharedUsers')
  final IsarLinks<Album> sharedAlbums = IsarLinks<Album>();

  @override
  bool operator ==(other) {
    if (other is! User) return false;
    return id == other.id &&
        updatedAt.isAtSameMomentAs(other.updatedAt) &&
        email == other.email &&
        name == other.name &&
        isPartnerSharedBy == other.isPartnerSharedBy &&
        isPartnerSharedWith == other.isPartnerSharedWith &&
        profileImagePath == other.profileImagePath &&
        isAdmin == other.isAdmin &&
        memoryEnabled == other.memoryEnabled &&
        inTimeline == other.inTimeline;
  }

  @override
  @ignore
  int get hashCode =>
      id.hashCode ^
      updatedAt.hashCode ^
      email.hashCode ^
      name.hashCode ^
      isPartnerSharedBy.hashCode ^
      isPartnerSharedWith.hashCode ^
      profileImagePath.hashCode ^
      isAdmin.hashCode ^
      memoryEnabled.hashCode ^
      inTimeline.hashCode;
}
