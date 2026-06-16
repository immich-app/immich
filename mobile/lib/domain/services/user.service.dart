import 'dart:async';
import 'dart:typed_data';

import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_api.repository.dart';
import 'package:logging/logging.dart';

class UserService {
  final Logger _log = Logger("UserService");
  final UserApiRepository _userApiRepository;
  final DriftAuthUserRepository _authUserRepository;

  UserService({required this._userApiRepository, required this._authUserRepository});

  Future<UserDto?> tryGetMyUser() {
    return _authUserRepository.get();
  }

  Stream<UserDto?> watchMyUser() {
    return _authUserRepository.watch();
  }

  Future<UserDto?> refreshMyUser() async {
    final user = await _userApiRepository.getMyUser();
    if (user == null) {
      return null;
    }
    await _authUserRepository.upsert(user);
    return user;
  }

  Future<String?> createProfileImage(String name, Uint8List image) async {
    try {
      final path = await _userApiRepository.createProfileImage(name: name, data: image);
      final updatedUser = await tryGetMyUser();
      if (updatedUser != null) {
        await _authUserRepository.upsert(updatedUser);
      }
      return path;
    } catch (e) {
      _log.warning("Failed to upload profile image", e);
      return null;
    }
  }
}
