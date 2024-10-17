import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/interfaces/partner_api.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/interfaces/user_api.interface.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';
import 'package:immich_mobile/repositories/user_api.repository.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/services/sync.service.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:logging/logging.dart';

final userServiceProvider = Provider(
  (ref) => UserService(
    ref.watch(partnerApiRepositoryProvider),
    ref.watch(userApiRepositoryProvider),
    ref.watch(userRepositoryProvider),
    ref.watch(syncServiceProvider),
  ),
);

class UserService {
  final IPartnerApiRepository _partnerApiRepository;
  final IUserApiRepository _userApiRepository;
  final IUserRepository _userRepository;
  final SyncService _syncService;
  final Logger _log = Logger("UserService");

  UserService(
    this._partnerApiRepository,
    this._userApiRepository,
    this._userRepository,
    this._syncService,
  );

  Future<List<User>> getUsers({bool self = false}) =>
      _userRepository.getAll(self: self);

  Future<({String profileImagePath})?> uploadProfileImage(XFile image) async {
    try {
      return await _userApiRepository.createProfileImage(
        name: image.name,
        data: await image.readAsBytes(),
      );
    } catch (e) {
      _log.warning("Failed to upload profile image", e);
      return null;
    }
  }

  Future<List<User>?> getUsersFromServer() async {
    List<User>? users;
    try {
      users = await _userApiRepository.getAll();
    } catch (e) {
      _log.warning("Failed to fetch users", e);
      users = null;
    }
    final List<User> sharedBy =
        await _partnerApiRepository.getAll(Direction.sharedByMe);
    final List<User> sharedWith =
        await _partnerApiRepository.getAll(Direction.sharedWithMe);

    if (users == null) {
      _log.warning("Failed to refresh users");
      return null;
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

    return users;
  }

  Future<bool> refreshUsers() async {
    final users = await getUsersFromServer();
    if (users == null) return false;
    return _syncService.syncUsersFromServer(users);
  }
}
