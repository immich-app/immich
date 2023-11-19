import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class CurrentUserProvider extends StateNotifier<User?> {
  CurrentUserProvider() : super(null) {
    state = Store.tryGet(StoreKey.currentUser);
    streamSub =
        Store.watch(StoreKey.currentUser).listen((user) => state = user);
  }

  late final StreamSubscription<User?> streamSub;

  @override
  void dispose() {
    streamSub.cancel();
    super.dispose();
  }
}

final currentUserProvider =
    StateNotifierProvider<CurrentUserProvider, User?>((ref) {
  return CurrentUserProvider();
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
