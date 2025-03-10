import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/interfaces/partner_api.interface.dart';
import 'package:immich_mobile/interfaces/user_api.interface.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:immich_mobile/repositories/user_api.repository.dart';
import 'package:immich_mobile/utils/diff.dart';
import 'package:logging/logging.dart';

final userServiceProvider = Provider(
  (ref) => UserService(
    ref.watch(partnerApiRepositoryProvider),
    ref.watch(userApiRepositoryProvider),
    ref.watch(userRepositoryProvider),
  ),
);

class UserService {
  final IPartnerApiRepository _partnerApiRepository;
  final IUserApiRepository _userApiRepository;
  final IUserRepository _userRepository;
  final Logger _log = Logger("UserService");

  UserService(
    this._partnerApiRepository,
    this._userApiRepository,
    this._userRepository,
  );

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

  Future<List<User>> getAll() async {
    return await _userRepository.getAll();
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

    users.sortBy((u) => u.uid);
    sharedBy.sortBy((u) => u.uid);
    sharedWith.sortBy((u) => u.uid);

    final updatedSharedBy = <User>[];

    diffSortedListsSync(
      users,
      sharedBy,
      compare: (User a, User b) => a.uid.compareTo(b.uid),
      both: (User a, User b) {
        updatedSharedBy.add(a.copyWith(isPartnerSharedBy: true));
        return true;
      },
      onlyFirst: (User a) => updatedSharedBy.add(a),
      onlySecond: (User b) => updatedSharedBy.add(b),
    );

    final updatedSharedWith = <User>[];

    diffSortedListsSync(
      updatedSharedBy,
      sharedWith,
      compare: (User a, User b) => a.uid.compareTo(b.uid),
      both: (User a, User b) {
        updatedSharedWith.add(
          a.copyWith(inTimeline: b.inTimeline, isPartnerSharedWith: true),
        );
        return true;
      },
      onlyFirst: (User a) => updatedSharedWith.add(a),
      onlySecond: (User b) => updatedSharedWith.add(b),
    );

    return updatedSharedWith;
  }

  Future<void> clearTable() {
    return _userRepository.deleteAll();
  }
}
