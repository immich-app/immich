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

  String? _currentUserId;
  late final StreamSubscription<String?> _userIdStream;

  AuthService({
    required IStoreRepository storeRepo,
    required IUserRepository userRepo,
  })  : _storeRepo = storeRepo,
        _userRepo = userRepo {
    _userStreamController = StreamController.broadcast();
    _userIdStream = _storeRepo.watch(StoreKey.currentUserId).listen((userId) {
      if (_currentUserId == userId) {
        return;
      }
      _currentUserId = userId;
      unawaited(loadOfflineUser());
    });
  }

  void _updateCurrentUser(User? user) {
    _currentUser = user;
    _userStreamController.add(user);
  }

  User getCurrentUser() {
    if (_currentUser == null) {
      throw const UserNotLoggedInException();
    }
    return _currentUser!;
  }

  User? tryGetCurrentUser() => _currentUser;

  Stream<User?> watchCurrentUser() => _userStreamController.stream;

  Future<User?> loadOfflineUser() async {
    if (_currentUserId == null) return null;
    final user = await _userRepo.tryGet(_currentUserId!);
    _updateCurrentUser(user);
    return user;
  }

  Future<void> cleanup() async {
    await _userIdStream.cancel();
    await _userStreamController.close();
  }
}
