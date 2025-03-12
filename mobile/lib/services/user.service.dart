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

  Future<List<UserDto>> getAll() async {
    return await _userRepository.getAll();
  }

  Future<List<UserDto>?> getUsersFromServer() async {
    List<UserDto>? users;
    try {
      users = await _userApiRepository.getAll();
    } catch (e) {
      _log.warning("Failed to fetch users", e);
      users = null;
    }
    final List<UserDto> sharedBy =
        await _partnerApiRepository.getAll(Direction.sharedByMe);
    final List<UserDto> sharedWith =
        await _partnerApiRepository.getAll(Direction.sharedWithMe);

    if (users == null) {
      _log.warning("Failed to refresh users");
      return null;
    }

    users.sortBy((u) => u.uid);
    sharedBy.sortBy((u) => u.uid);
    sharedWith.sortBy((u) => u.uid);

    final updatedSharedBy = <UserDto>[];

    diffSortedListsSync(
      users,
      sharedBy,
      compare: (UserDto a, UserDto b) => a.uid.compareTo(b.uid),
      both: (UserDto a, UserDto b) {
        updatedSharedBy.add(a.copyWith(isPartnerSharedBy: true));
        return true;
      },
      onlyFirst: (UserDto a) => updatedSharedBy.add(a),
      onlySecond: (UserDto b) => updatedSharedBy.add(b),
    );

    final updatedSharedWith = <UserDto>[];

    diffSortedListsSync(
      updatedSharedBy,
      sharedWith,
      compare: (UserDto a, UserDto b) => a.uid.compareTo(b.uid),
      both: (UserDto a, UserDto b) {
        updatedSharedWith.add(
          a.copyWith(inTimeline: b.inTimeline, isPartnerSharedWith: true),
        );
        return true;
      },
      onlyFirst: (UserDto a) => updatedSharedWith.add(a),
      onlySecond: (UserDto b) => updatedSharedWith.add(b),
    );

    return updatedSharedWith;
  }

  Future<void> clearTable() {
    return _userRepository.deleteAll();
  }
}
