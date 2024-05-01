import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/modules/partner/services/partner.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final userServiceProvider = Provider(
  (ref) => UserService(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
    ref.watch(syncServiceProvider),
    ref.watch(partnerServiceProvider),
  ),
);

class UserService {
  final ApiService _apiService;
  final Isar _db;
  final SyncService _syncService;
  final PartnerService _partnerService;
  final Logger _log = Logger("UserService");

  UserService(
    this._apiService,
    this._db,
    this._syncService,
    this._partnerService,
  );

  Future<List<User>?> _getAllUsers({required bool isAll}) async {
    try {
      final dto = await _apiService.userApi.getAllUsers(isAll);
      return dto?.map(User.fromUserDto).toList();
    } catch (e) {
      _log.warning("Failed get all users", e);
      return null;
    }
  }

  Future<List<User>> getUsersInDb({bool self = false}) async {
    if (self) {
      return _db.users.where().findAll();
    }
    final int userId = Store.get(StoreKey.currentUser).isarId;
    return _db.users.where().isarIdNotEqualTo(userId).findAll();
  }

  Future<CreateProfileImageResponseDto?> uploadProfileImage(XFile image) async {
    try {
      return await _apiService.userApi.createProfileImage(
        MultipartFile.fromBytes(
          'file',
          await image.readAsBytes(),
          filename: image.name,
        ),
      );
    } catch (e) {
      _log.warning("Failed to upload profile image", e);
      return null;
    }
  }

  Future<bool> refreshUsers() async {
    final List<User>? users = await _getAllUsers(isAll: true);
    final List<User>? sharedBy =
        await _partnerService.getPartners(PartnerDirection.sharedBy);
    final List<User>? sharedWith =
        await _partnerService.getPartners(PartnerDirection.sharedWith);

    if (users == null || sharedBy == null || sharedWith == null) {
      _log.warning("Failed to refresh users");
      return false;
    }

    users.sortBy((u) => u.id);
    sharedBy.sortBy((u) => u.id);
    sharedWith.sortBy((u) => u.id);

    diffSortedListsSync(
      users,
      sharedBy,
      compare: (User a, User b) => a.id.compareTo(b.id),
      both: (User a, User b) => a.isPartnerSharedBy = true,
      onlyFirst: (_) {},
      onlySecond: (_) {},
    );

    diffSortedListsSync(
      users,
      sharedWith,
      compare: (User a, User b) => a.id.compareTo(b.id),
      both: (User a, User b) {
        a.isPartnerSharedWith = true;
        a.inTimeline = b.inTimeline;
        return true;
      },
      onlyFirst: (_) {},
      onlySecond: (_) {},
    );

    return _syncService.syncUsersFromServer(users);
  }
}
