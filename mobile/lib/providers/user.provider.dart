import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:isar/isar.dart';

class CurrentUserProvider extends StateNotifier<User?> {
  CurrentUserProvider(this._apiService) : super(null) {
    state = Store.tryGet(StoreKey.currentUser);
    streamSub =
        Store.watch(StoreKey.currentUser).listen((user) => state = user);
  }

  final ApiService _apiService;
  late final StreamSubscription<User?> streamSub;

  refresh() async {
    try {
      final user = await _apiService.userApi.getMyUserInfo();
      if (user != null) {
        Store.put(
          StoreKey.currentUser,
          User.fromUserDto(user),
        );
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
    query.findAll().then((users) => state = users);
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
