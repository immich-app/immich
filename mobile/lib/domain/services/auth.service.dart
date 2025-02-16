import 'dart:async';

import 'package:immich_mobile/domain/exceptions/auth.exception.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

class AuthService {
  final IStoreRepository _storeRepo;
  final IUserRepository _userRepo;

  User? _currentUser;
  late final StreamController<User?> _userStreamController;

  AuthService({
    required IStoreRepository storeRepo,
    required IUserRepository userRepo,
  })  : _storeRepo = storeRepo,
        _userRepo = userRepo {
    _userStreamController = StreamController.broadcast();
    // Pre-load offline user
    unawaited(_loadOfflineUser());
  }

  void _notifyListeners(User? user) {
    _currentUser = user;
    _userStreamController.add(user);
  }

  Future<void> _loadOfflineUser() async {
    final userId = await _storeRepo.tryGet(StoreKey.currentUserId);
    if (userId == null) {
      _currentUser = null;
      return;
    }
    final user = await _userRepo.tryGet(userId);
    _notifyListeners(user);
  }

  User? tryGetUser() => _currentUser;

  User getUser() {
    if (_currentUser == null) {
      throw const UserNotLoggedInException();
    }
    return _currentUser!;
  }

  Stream<User?> watchUser() => _userStreamController.stream;

  Future<User?> updateUser(User user) async {
    await _userRepo.update(user);
    await _storeRepo.update(StoreKey.currentUserId, user.id);
    _notifyListeners(user);
    return user;
  }

  Future<void> cleanup() async {
    await _userStreamController.close();
  }
}
