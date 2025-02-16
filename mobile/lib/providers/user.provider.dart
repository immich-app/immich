import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/auth.service.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/domain/auth.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:isar/isar.dart';

class CurrentUserProvider extends StateNotifier<User?> {
  CurrentUserProvider(this._apiService, this._authService) : super(null) {
    state = _authService.tryGetUser()?.toOldUser();
    streamSub = _authService
        .watchUser()
        .map((user) => user?.toOldUser())
        .listen((user) => state = user);
  }

  final ApiService _apiService;
  final AuthService _authService;

  late final StreamSubscription<User?> streamSub;

  // TODO: Move method this to AuthService
  refresh() async {
    try {
      final user = await _apiService.usersApi.getMyUser();
      if (user != null) {
        final userPreferences = await _apiService.usersApi.getMyPreferences();
        await _authService
            .updateUser(User.fromUserDto(user, userPreferences).toDomain());
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    streamSub.cancel();
    super.dispose();
  }
}

final currentUserProvider =
    StateNotifierProvider<CurrentUserProvider, User?>((ref) {
  return CurrentUserProvider(
    ref.watch(apiServiceProvider),
    ref.watch(authServiceProvider),
  );
});

class TimelineUserIdsProvider extends StateNotifier<List<int>> {
  TimelineUserIdsProvider(Isar db, User? currentUser) : super([]) {
    final query = db.users
        .filter()
        .inTimelineEqualTo(true)
        .or()
        .isarIdEqualTo(currentUser?.isarId ?? Isar.autoIncrement)
        .isarIdProperty();
    query.findAll().then((users) {
      if (mounted) {
        state = users;
      }
    });
    streamSub = query.watch().listen((users) => state = users);
  }

  late final StreamSubscription<List<int>> streamSub;

  @override
  void dispose() {
    streamSub.cancel();
    super.dispose();
  }
}

final timelineUsersIdsProvider =
    StateNotifierProvider<TimelineUserIdsProvider, List<int>>((ref) {
  return TimelineUserIdsProvider(
    ref.watch(dbProvider),
    ref.watch(currentUserProvider),
  );
});
